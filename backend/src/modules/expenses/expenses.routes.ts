import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── GET /api/expenses ────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user!.userId },
      orderBy: { expenseDate: 'desc' }
    });
    
    // Monthly Summary
    const summary = await prisma.expense.groupBy({
      by: ['category'],
      where: { userId: req.user!.userId },
      _sum: { amount: true }
    });

    res.json({ expenses, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// ── POST /api/expenses ───────────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, amount, category, currency, receiptUrl, expenseDate } = req.body;
    const expense = await prisma.expense.create({
      data: {
        userId: req.user!.userId,
        title,
        amount: parseFloat(amount),
        category,
        currency: currency || 'USD',
        receiptUrl,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date()
      }
    });
    res.json({ expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

export default router;
