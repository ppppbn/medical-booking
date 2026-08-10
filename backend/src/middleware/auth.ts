import { Request, Response, NextFunction } from 'express';
import jwt = require('jsonwebtoken');
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        role: string;
      };
    }
  }
}

// JWT Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Mã xác thực token là bắt buộc' });
    }

    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as { userId: string; role: string };

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Không tìm thấy người dùng' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Role-based authorization middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yêu cầu xác thực tài khoản' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Truy cập bị từ chối. Bạn không có quyền thực hiện thao tác này' });
    }

    next();
  };
};
