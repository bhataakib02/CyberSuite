import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── GET /api/consultation/professionals ───────────────────────────────────────
router.get('/professionals', authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, specialization } = req.query;
    const professionals = await (prisma as any).professionalProfile.findMany({
      where: {
        isVerified: true,
        ...(type && { type: type as string }),
        ...(specialization && { specialization: specialization as string })
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    res.json({ professionals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch professionals' });
  }
});

// ── POST /api/consultation/request ────────────────────────────────────────────
router.post('/request', authenticate, async (req: AuthRequest, res) => {
  try {
    const { professionalId, type } = req.body;
    
    const consultation = await (prisma as any).consultation.create({
      data: {
        userId: req.user!.userId,
        professionalId,
        type: type || 'CHAT',
        status: 'PENDING'
      }
    });

    res.json({ consultation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request consultation' });
  }
});

// ── GET /api/consultation/active ──────────────────────────────────────────────
router.get('/active', authenticate, async (req: AuthRequest, res) => {
  try {
    const consultations = await (prisma as any).consultation.findMany({
      where: {
        OR: [
          { userId: req.user!.userId },
          { professionalId: req.user!.userId }
        ],
        status: 'ACTIVE'
      },
      include: {
        user: { select: { name: true } },
        professional: { select: { name: true } }
      }
    });
    res.json({ consultations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active consultations' });
  }
});

export default router;
