import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// ── GET /api/groups ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const groups = await (prisma as any).group.findMany({
      where: {
        members: { some: { userId: req.user!.userId } }
      },
      include: {
        members: { include: { user: { select: { name: true, email: true } } } },
        owner: { select: { name: true } }
      }
    });
    sendSuccess(res, { groups });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch groups');
  }
});

// ── POST /api/groups ─────────────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, type } = req.body;
    const group = await (prisma as any).group.create({
      data: {
        name,
        type,
        ownerId: req.user!.userId,
        members: {
          create: {
            userId: req.user!.userId,
            role: 'ADMIN'
          }
        }
      }
    });
    sendSuccess(res, { group });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to create group');
  }
});

// ── POST /api/groups/:id/members ──────────────────────────────────────────────
router.post('/:id/members', authenticate, async (req: AuthRequest, res) => {
  try {
    const { email, role } = req.body;
    const { id } = req.params;

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return sendError(res, 'User not found', 404);

    const member = await (prisma as any).groupMember.create({
      data: {
        groupId: id,
        userId: userToAdd.id,
        role: role || 'MEMBER'
      }
    });
    sendSuccess(res, { member });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to add member');
  }
});

export default router;
