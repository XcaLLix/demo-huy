import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edupath_jwt_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'edupath_jwt_refresh_secret_key_2026';

export async function register(req: Request, res: Response) {
  const { email, password, fullName, role, subjectGroup, bio } = req.body;

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Địa chỉ Email này đã được sử dụng!' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create base user and dynamic subclass profiles in transaction
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: role || 'STUDENT',
          isActive: true
        }
      });

      if (u.role === 'STUDENT') {
        await tx.student.create({
          data: {
            userId: u.id,
            subjectGroup: subjectGroup || 'A01'
          }
        });
      } else if (u.role === 'TEACHER') {
        await tx.teacher.create({
          data: {
            userId: u.id,
            isApproved: false, // Teacher requires Admin verification approval!
            bio: bio || ''
          }
        });
      } else if (u.role === 'ADMIN') {
        await tx.admin.create({
          data: {
            userId: u.id
          }
        });
      }

      return u;
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị khóa!' });
    }

    // If teacher, verify approved status
    if (user.role === 'TEACHER' && user.teacher && !user.teacher.isApproved) {
      return res.status(403).json({ success: false, error: 'Tài khoản Giáo viên đang chờ Quản trị viên duyệt hồ sơ!' });
    }

    // Sign Access and Refresh tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          subjectGroup: user.student?.subjectGroup || null
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function logout(req: Request, res: Response) {
  // Rotate/Invalidate JWT token
  return res.status(200).json({ success: true, data: 'Đăng xuất thành công!' });
}
