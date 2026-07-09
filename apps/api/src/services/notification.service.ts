import { NotificationRepository } from '../repositories/notification.repository.js';
import { NotificationTemplateService } from './notificationTemplate.service.js';
import { getIO } from '../lib/socket.js';
import { NotificationType, NotificationCategory } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface NotificationChannel {
  send(notification: any): Promise<void>;
}

export class DatabaseChannel implements NotificationChannel {
  async send(notification: any): Promise<void> {
    // Database creation is handled directly in NotificationService, or here
  }
}

export class SocketChannel implements NotificationChannel {
  async send(notification: any): Promise<void> {
    try {
      const io = getIO();
      if (io && notification.userId) {
        io.to(`user_${notification.userId}`).emit('notification_received', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          icon: notification.icon,
          link: notification.link,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString()
        });
        console.log(`[SocketChannel] Sent notification to user_${notification.userId}: "${notification.title}"`);
      }
    } catch (err: any) {
      console.error('[SocketChannel Error]', err.message || err);
    }
  }
}

export class NotificationService {
  private static channels: NotificationChannel[] = [
    new DatabaseChannel(),
    new SocketChannel()
  ];

  static async send(params: {
    userId: number;
    title: string;
    message: string;
    type?: NotificationType;
    category?: NotificationCategory;
    icon?: string;
    link?: string;
    metadata?: any;
  }) {
    // 1. Save to Database
    const notification = await NotificationRepository.createNotification({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || NotificationType.INFO,
      category: params.category || NotificationCategory.SYSTEM,
      icon: params.icon || null,
      link: params.link || null,
      metadata: params.metadata || null
    });

    // 2. Dispatch to other channels (Socket, Email, SMS, Firebase, etc.)
    for (const channel of this.channels) {
      if (!(channel instanceof DatabaseChannel)) {
        await channel.send(notification);
      }
    }

    return notification;
  }

  static async sendTemplate(
    templateCode: string,
    userId: number | null, // If null, send to all, or broadcast
    variables: Record<string, string>,
    customLink?: string,
    customMetadata?: any
  ) {
    const template = await NotificationTemplateService.getTemplate(templateCode);
    if (!template || !template.isActive) {
      console.warn(`[NotificationService] Template ${templateCode} is not available or inactive.`);
      return null;
    }

    // Interpolate title and message placeholders
    let title = template.title;
    let message = template.message;

    Object.entries(variables).forEach(([key, val]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), val);
      message = message.replace(new RegExp(placeholder, 'g'), val);
    });

    const link = customLink || template.defaultLink || undefined;

    if (userId) {
      // Single recipient
      return this.send({
        userId,
        title,
        message,
        type: template.type,
        category: template.category,
        icon: template.icon || undefined,
        link,
        metadata: customMetadata
      });
    } else {
      // Broadcast to all users
      console.log(`[NotificationService] Broadcasting template ${templateCode} to all active users...`);
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      const promises = activeUsers.map(u =>
        this.send({
          userId: u.id,
          title,
          message,
          type: template.type,
          category: template.category,
          icon: template.icon || undefined,
          link,
          metadata: customMetadata
        })
      );

      await Promise.all(promises);
      return null;
    }
  }

  // Helper method to send a raw notification to multiple users
  static async sendToUsers(
    userIds: number[],
    params: {
      title: string;
      message: string;
      type?: NotificationType;
      category?: NotificationCategory;
      icon?: string;
      link?: string;
      metadata?: any;
    }
  ) {
    const promises = userIds.map(userId =>
      this.send({
        userId,
        ...params
      })
    );
    return Promise.all(promises);
  }

  // Helper method to send a raw notification to a specific role
  static async sendToRole(
    role: string,
    params: {
      title: string;
      message: string;
      type?: NotificationType;
      category?: NotificationCategory;
      icon?: string;
      link?: string;
      metadata?: any;
    }
  ) {
    const usersOfRole = await prisma.user.findMany({
      where: { role: role.toUpperCase() as any, isActive: true },
      select: { id: true }
    });

    const promises = usersOfRole.map(u =>
      this.send({
        userId: u.id,
        ...params
      })
    );

    return Promise.all(promises);
  }
}
