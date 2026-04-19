import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';

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
    res.json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch groups' });
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
    res.json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// ── POST /api/groups/:id/members ──────────────────────────────────────────────
router.post('/:id/members', authenticate, async (req: AuthRequest, res) => {
  try {
    const { email, role } = req.body;
    const { id } = req.params;

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    const member = await (prisma as any).groupMember.create({
      data: {
        groupId: id,
        userId: userToAdd.id,
        role: role || 'MEMBER'
      }
    });
    res.json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

export default router;
