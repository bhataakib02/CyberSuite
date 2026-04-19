import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { logActivity } from '../../utils/logger';

const router = Router();

const addEntrySchema = z.object({
  encryptedData: z.string().min(1),
  category: z.string().default('general'),
  strength: z.number().optional(),
  groupId: z.string().optional(),
});

// GET /api/vault — list all entries for user
router.get('/', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const entries = await prisma.vaultEntry.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, encryptedData: true, category: true, strength: true, createdAt: true, updatedAt: true } as any,
  });

  await logActivity({
    userId: req.user!.userId,
    action: 'VAULT_ACCESS',
    details: `Accessed ${entries.length} encrypted vault entries`,
    ipAddress: req.ip,
    userAgent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']
  });

  res.json({ entries });
});

// POST /api/vault — add entry
router.post('/', authenticate, requireRole('USER'), validate(addEntrySchema), async (req: AuthRequest, res) => {
  const { encryptedData, category, strength } = req.body;
  const entry = await prisma.vaultEntry.create({
    data: { userId: req.user!.userId, encryptedData, category, strength: strength || 0 } as any,
  });
  res.status(201).json({ entry });
});

// PUT /api/vault/:id — update entry
router.put('/:id', authenticate, requireRole('USER'), validate(addEntrySchema), async (req: AuthRequest, res) => {
  const entry = await prisma.vaultEntry.findFirst({
    where: { id: String(req.params.id), userId: req.user!.userId },
  });
  if (!entry) { res.status(404).json({ error: 'Not found' }); return; }

  const updated = await prisma.vaultEntry.update({
    where: { id: String(req.params.id) },
    data: { encryptedData: req.body.encryptedData, category: req.body.category, strength: req.body.strength } as any,
  });
  res.json({ entry: updated });
});

// DELETE /api/vault/:id — delete entry
router.delete('/:id', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const entry = await prisma.vaultEntry.findFirst({
    where: { id: String(req.params.id), userId: req.user!.userId },
  });
  if (!entry) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.vaultEntry.delete({ where: { id: String(req.params.id) } });
  res.json({ message: 'Deleted' });
});

// DELETE /api/vault/:id/shred — Permanently destroy entry
router.delete('/:id/shred', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // We don't just delete, we log the shredding
    await prisma.vaultEntry.deleteMany({
      where: { id: String(id), userId: req.user!.userId },
    });

    await logActivity({
      userId: req.user!.userId,
      action: 'VAULT_ACCESS', // Using existing LogAction
      details: `Permanently destroyed vault entry ${id}. No recovery possible.`,
      ipAddress: req.ip,
      userAgent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'],
      status: 'WARNING'
    });

    res.json({ message: 'Data shredded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to shred data' });
  }
});

export default router;
