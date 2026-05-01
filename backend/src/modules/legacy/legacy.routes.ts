import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// ── GET /api/legacy ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const contacts = await (prisma as any).trustedContact.findMany({
      where: { userId: req.user!.userId },
    });
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { legacyInactivityDays: true, lastActiveAt: true } as any
    });
    sendSuccess(res, { contacts, legacyInactivityDays: user?.legacyInactivityDays, lastActiveAt: user?.lastActiveAt });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch legacy settings');
  }
});

// ── POST /api/legacy/contacts ─────────────────────────────────────────────────
router.post('/contacts', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, email, type } = req.body;
    const contact = await (prisma as any).trustedContact.create({
      data: {
        userId: req.user!.userId,
        name,
        email,
        type: type || 'LEGACY'
      },
    });
    sendSuccess(res, { contact });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to add contact');
  }
});

// ── DELETE /api/legacy/contacts/:id ──────────────────────────────────────────
router.delete('/contacts/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await (prisma as any).trustedContact.delete({
      where: { id, userId: req.user!.userId },
    });
    sendSuccess(res, null, 'Contact removed');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to remove contact');
  }
});

// ── PATCH /api/legacy/settings ────────────────────────────────────────────────
router.patch('/settings', authenticate, async (req: AuthRequest, res) => {
  try {
    const { inactivityDays } = req.body;
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { legacyInactivityDays: parseInt(inactivityDays) } as any,
    });
    sendSuccess(res, null, 'Legacy settings updated');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to update settings');
  }
});

export default router;
