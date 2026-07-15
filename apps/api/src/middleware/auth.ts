import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing!');
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: 'GUEST' | 'STUDENT' | 'TEACHER' | 'ADMIN' | 'AFFILIATE';
  };
}

export async function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[auth] Missing or malformed Authorization header');
    return res.status(401).json({ success: false, error: 'Yêu cầu mã JWT xác thực (Bearer token)' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];

    // Check if user is blocked or inactive in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: payload?.id },
      select: { status: true, isActive: true }
    });

    if (!dbUser) {
      return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại!' });
    }

    if (!dbUser.isActive || dbUser.status === 'BLOCKED') {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị khóa! Không thể thao tác hệ thống.' });
    }

    req.user = payload;
    next();
  } catch (err: any) {
    console.error('[auth] JWT verification failed:', err.message);
    return res.status(403).json({ success: false, error: 'Mã xác thực không hợp lệ hoặc đã hết hạn!' });
  }
}

export function requireRole(allowedRoles: ('GUEST' | 'STUDENT' | 'TEACHER' | 'ADMIN' | 'AFFILIATE')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa được xác thực!' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền thực hiện hành động này!' });
    }

    next();
  };
}

export async function optionalAuthenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    const dbUser = await prisma.user.findUnique({
      where: { id: payload?.id },
      select: { status: true, isActive: true }
    });

    if (dbUser && dbUser.isActive && dbUser.status !== 'BLOCKED') {
      req.user = payload;
    }
  } catch (err: any) {
    // Treat as guest
  }
  next();
}

