import express from 'express';
import { getUnreadNotifications, markAsRead } from '../controllers/NotificationsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUnreadNotifications);
router.patch('/:id/read', markAsRead);

export default router;
