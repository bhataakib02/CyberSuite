import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/subscriptions ────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user!.userId },
      orderBy: { nextBilling: 'asc' },
    });
    res.json({ subscriptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// ── POST /api/subscriptions ───────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, category, amount, currency, billingCycle, nextBilling, isAutoRenew, remindMe } = req.body;
    
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user!.userId,
        name,
        category,
        amount: parseFloat(amount),
        currency,
        billingCycle,
        nextBilling: new Date(nextBilling),
        isAutoRenew,
        remindMe,
      },
    });

    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: 'SUBSCRIPTION_ADD', details: `Added subscription: ${name}` },
    });

    res.json({ subscription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// ── DELETE /api/subscriptions/:id ──────────────────────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const sub = await prisma.subscription.findUnique({ where: { id } });

    if (!sub || sub.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    await prisma.subscription.delete({ where: { id } });
    res.json({ message: 'Subscription removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

export default router;
