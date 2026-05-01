import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// GET /api/search?q=...
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { q } = req.query;
  const userId = req.user!.userId;

  if (!q || typeof q !== 'string' || q.length < 2) {
    sendSuccess(res, { results: [] });
    return;
  }

  const query = q.toLowerCase();

  try {
    const [warranties, medical, vault] = await Promise.all([
      // Search Warranties
      prisma.warranty.findMany({
        where: {
          userId,
          productName: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, productName: true, expiryDate: true },
        take: 5
      }),
      // Search Medical Records
      prisma.medicalRecord.findMany({
        where: {
          patientId: userId,
          OR: [
            { fileName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { id: true, fileName: true, description: true },
        take: 5
      }),
      // Search Vault Categories
      prisma.vaultEntry.findMany({
        where: {
          userId,
          category: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, category: true },
        take: 5
      })
    ]);

    const results = [
      ...warranties.map(w => ({ id: w.id, title: w.productName, type: 'WARRANTY', path: '/warranty' })),
      ...medical.map(m => ({ id: m.id, title: m.fileName, type: 'MEDICAL', path: '/medical' })),
      ...vault.map(v => ({ id: v.id, title: `Vault: ${v.category}`, type: 'VAULT', path: '/vault' }))
    ];

    sendSuccess(res, { results });
  } catch (err) {
    console.error('Search error:', err);
    sendError(res, 'Search failed');
  }
});

export default router;
