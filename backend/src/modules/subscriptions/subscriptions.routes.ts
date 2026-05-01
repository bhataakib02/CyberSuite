import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// ── GET /api/subscriptions ────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user!.userId },
      orderBy: { nextBilling: 'asc' },
    });
    sendSuccess(res, { subscriptions });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch subscriptions');
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

    sendSuccess(res, { subscription });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to create subscription');
  }
});

// ── DELETE /api/subscriptions/:id ──────────────────────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const sub = await prisma.subscription.findFirst({ 
      where: { id: String(id), userId: req.user!.userId } 
    });

    if (!sub) {
      sendError(res, 'Subscription not found', 404);
      return;
    }

    await prisma.subscription.delete({ where: { id: String(id) } });
    sendSuccess(res, null, 'Subscription removed');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to delete subscription');
  }
});

export default router;
