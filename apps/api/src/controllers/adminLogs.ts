import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { LogType, LogLevel } from '@prisma/client';

export const getAdminLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 10));
    const skip = (page - 1) * limit;

    const { search, type, level, module: logModule, userId, fromDate, toDate } = req.query;

    const where: any = {};

    if (type && type !== 'ALL') {
      where.type = type as LogType;
    }
    if (level && level !== 'ALL') {
      where.level = level as LogLevel;
    }
    if (logModule && logModule !== 'ALL') {
      where.module = logModule as string;
    }
    if (userId) {
      where.userId = Number(userId);
    }
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate as string);
      }
    }

    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { description: { contains: searchStr, mode: 'insensitive' } },
        { action: { contains: searchStr, mode: 'insensitive' } },
        { user: { fullName: { contains: searchStr, mode: 'insensitive' } } },
        { user: { email: { contains: searchStr, mode: 'insensitive' } } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err: any) {
    console.error('[getAdminLogs Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAdminLogById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Mã nhật ký không hợp lệ.' });
    }

    const log = await prisma.systemLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhật ký.' });
    }

    return res.status(200).json({ success: true, data: log });
  } catch (err: any) {
    console.error('[getAdminLogById Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAdminLogsStatistics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [
      totalToday,
      loginToday,
      adminToday,
      systemToday,
      aiErrorsToday,
      paymentErrorsToday
    ] = await Promise.all([
      // Total logs today
      prisma.systemLog.count({
        where: { createdAt: { gte: startOfToday } }
      }),
      // Login logs today
      prisma.systemLog.count({
        where: { type: 'LOGIN', createdAt: { gte: startOfToday } }
      }),
      // Admin operations today
      prisma.systemLog.count({
        where: { type: 'ADMIN', createdAt: { gte: startOfToday } }
      }),
      // System errors today
      prisma.systemLog.count({
        where: { type: 'SYSTEM', createdAt: { gte: startOfToday } }
      }),
      // AI Errors today
      prisma.systemLog.count({
        where: {
          module: 'AI_SERVICE',
          level: { in: ['ERROR', 'CRITICAL'] },
          createdAt: { gte: startOfToday }
        }
      }),
      // Payment Errors today
      prisma.systemLog.count({
        where: {
          module: 'PAYMENT_SERVICE',
          level: { in: ['ERROR', 'CRITICAL'] },
          createdAt: { gte: startOfToday }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalToday,
        loginToday,
        adminToday,
        systemToday,
        aiErrorsToday,
        paymentErrorsToday
      }
    });
  } catch (err: any) {
    console.error('[getAdminLogsStatistics Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
