import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();
const uploadDir = process.env.UPLOAD_DIR || './uploads/warranty';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const addWarrantySchema = z.object({
  productName: z.string().min(1),
  price: z.coerce.number().default(0),
  purchaseDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  notes: z.string().optional(),
});

// GET /api/warranty
router.get('/', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const items = await prisma.warranty.findMany({
    where: { userId: req.user!.userId },
    orderBy: { expiryDate: 'asc' },
  });
  sendSuccess(res, { items });
});

// POST /api/warranty
router.post('/', authenticate, requireRole('USER'), upload.single('bill'), async (req: AuthRequest, res) => {
  try {
    const parsed = addWarrantySchema.safeParse({
      ...req.body,
      price: req.body.price,
    });
    if (!parsed.success) { sendError(res, 'Validation failed', 400, JSON.stringify(parsed.error.flatten())); return; }

    const { productName, price, purchaseDate, expiryDate, notes } = parsed.data;
    const encFileUrl = req.file ? `/uploads/warranty/${req.file.filename}` : undefined;

    const item = await prisma.warranty.create({
      data: {
        userId: req.user!.userId,
        productName,
        price,
        purchaseDate: new Date(purchaseDate),
        expiryDate: new Date(expiryDate),
        encFileUrl,
        notes,
      },
    });
    sendSuccess(res, { item }, undefined, 201);
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to add warranty');
  }
});

// DELETE /api/warranty/:id
router.delete('/:id', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const item = await prisma.warranty.findFirst({ where: { id: String(req.params.id), userId: req.user!.userId } });
  if (!item) { res.status(404).json({ error: 'Not found' }); return; }
  if (item.encFileUrl) {
    const filePath = path.join('.', item.encFileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await prisma.warranty.delete({ where: { id: String(req.params.id) } });
  sendSuccess(res, null, 'Deleted');
});

// GET /api/warranty/expiring — items expiring in next 30 days
router.get('/expiring', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const items = await prisma.warranty.findMany({
    where: { userId: req.user!.userId, expiryDate: { gte: now, lte: in30 } },
  });
  sendSuccess(res, { items });
});

export default router;
