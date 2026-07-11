import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let ioInstance: Server | null = null;

export function initSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`[Socket] Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('join_user_room', (userId: string | number) => {
      socket.join(`user_${userId}`);
      console.log(`[Socket] Socket ${socket.id} joined personal room: user_${userId}`);
    });

    // Forum post thread live updates
    socket.on('join_post', (postId: string | number) => {
      const room = `post_${postId}`;
      socket.join(room);
      console.log(`[Socket] Socket ${socket.id} joined post thread: ${room}`);
    });

    socket.on('leave_post', (postId: string | number) => {
      const room = `post_${postId}`;
      socket.leave(room);
      console.log(`[Socket] Socket ${socket.id} left post thread: ${room}`);
    });

    socket.on('send_message', (data: { roomId: string; studentId: number; role: string; content: string }) => {
      console.log(`[Socket] Message received for room ${data.roomId}:`, data.content);
      // Broadcast to room members
      io.to(data.roomId).emit('receive_message', {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return ioInstance;
}
