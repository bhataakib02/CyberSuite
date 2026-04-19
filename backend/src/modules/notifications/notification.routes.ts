import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all notifications
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.post('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Clear all
router.post('/clear', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user!.userId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

export default router;
