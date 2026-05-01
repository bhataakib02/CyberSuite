import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate as authenticateToken, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// Get all notifications
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    sendSuccess(res, { notifications });
  } catch (err) {
    sendError(res, 'Failed to fetch notifications');
  }
});

// Mark as read
router.post('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
      data: { isRead: true }
    });
    sendSuccess(res, null, 'Notification marked as read');
  } catch (err) {
    sendError(res, 'Failed to update notification');
  }
});

// Clear all
router.post('/clear', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user!.userId }
    });
    sendSuccess(res, null, 'All notifications cleared');
  } catch (err) {
    sendError(res, 'Failed to clear notifications');
  }
});

export default router;
