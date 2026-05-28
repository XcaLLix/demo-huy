import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edupath_jwt_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: 'GUEST' | 'STUDENT' | 'TEACHER' | 'ADMIN';
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Yêu cầu mã JWT xác thực (Bearer token)' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Mã xác thực không hợp lệ hoặc đã hết hạn!' });
  }
}

export function requireRole(allowedRoles: ('GUEST' | 'STUDENT' | 'TEACHER' | 'ADMIN')[]) {
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
