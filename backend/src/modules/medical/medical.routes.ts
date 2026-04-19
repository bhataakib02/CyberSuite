import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth';

const router = Router();
const uploadDir = process.env.UPLOAD_DIR ? `${process.env.UPLOAD_DIR}/medical` : './uploads/medical';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/medical/upload — Patient uploads encrypted record
router.post('/upload', authenticate, requireRole('USER'), upload.single('record'), async (req: AuthRequest, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const { encKeyForOwner, description } = req.body;
  if (!encKeyForOwner) { res.status(400).json({ error: 'encKeyForOwner required' }); return; }

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: req.user!.userId,
      fileName: req.file.originalname,
      encFileUrl: `/uploads/medical/${req.file.filename}`,
      encKeyForOwner,
      description,
    },
  });
  res.status(201).json({ record });
});

// GET /api/medical/records — Patient views own records
router.get('/records', authenticate, requireRole('USER', 'ADMIN'), async (req: AuthRequest, res) => {
  const records = await prisma.medicalRecord.findMany({
    where: { patientId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { doctorAccesses: { include: { doctor: { select: { name: true, email: true } } } } },
  });
  res.json({ records });
});

// POST /api/medical/grant-access — Patient grants doctor access
router.post('/grant-access', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const { recordId, doctorId, encKey, expiresInHours } = req.body;
  if (!recordId || !doctorId || !encKey) { res.status(400).json({ error: 'recordId, doctorId, encKey required' }); return; }

  const record = await prisma.medicalRecord.findFirst({ where: { id: recordId, patientId: req.user!.userId } });
  if (!record) { res.status(404).json({ error: 'Record not found' }); return; }

  const doctor = await prisma.user.findFirst({ where: { id: doctorId, role: { in: ['DOCTOR', 'HEALTHCARE_STAFF'] } } });
  if (!doctor) { res.status(404).json({ error: 'Doctor not found' }); return; }

  const expiresAt = new Date(Date.now() + (expiresInHours || 24) * 60 * 60 * 1000);
  const access = await prisma.doctorAccess.create({ data: { recordId, doctorId, encKey, expiresAt } });
  res.json({ access, message: 'Access granted' });
});

// GET /api/medical/doctor-access — Doctor views accessible records
router.get('/doctor-access', authenticate, requireRole('DOCTOR', 'HEALTHCARE_STAFF', 'ADMIN'), async (req: AuthRequest, res) => {
  const now = new Date();
  const accesses = await prisma.doctorAccess.findMany({
    where: { doctorId: req.user!.userId, expiresAt: { gte: now } },
    include: {
      record: {
        include: { patient: { select: { name: true, email: true } } },
      },
    },
  });
  res.json({ accesses });
});

// POST /api/medical/revoke-access — Patient revokes doctor access
router.delete('/revoke-access/:accessId', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const access = await prisma.doctorAccess.findFirst({
    where: { id: String(req.params.accessId) },
    include: { record: true },
  });
  if (!access || (access as any).record.patientId !== req.user!.userId) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  await prisma.doctorAccess.delete({ where: { id: String(req.params.accessId) } });
  res.json({ message: 'Access revoked' });
});

// GET /api/medical/doctors — List doctors for patient to grant access
router.get('/doctors', authenticate, async (_req, res) => {
  const doctors = await prisma.user.findMany({
    where: { role: { in: ['DOCTOR', 'HEALTHCARE_STAFF'] } },
    select: { id: true, name: true, email: true, avatar: true },
  });
  res.json({ doctors });
});

// POST /api/medical/one-time-share — Patient generates a QR share link
router.post('/one-time-share', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const { recordId, encKey, expiresInHours } = req.body;
  if (!recordId || !encKey) { res.status(400).json({ error: 'recordId and encKey required' }); return; }

  const record = await prisma.medicalRecord.findFirst({ where: { id: recordId, patientId: req.user!.userId } });
  if (!record) { res.status(404).json({ error: 'Record not found' }); return; }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + (expiresInHours || 1) * 60 * 60 * 1000); // Default 1 hour

  const access = await (prisma as any).oneTimeAccess.create({
    data: { recordId, token, encKey, expiresAt }
  });

  res.json({ token, expiresAt, message: 'Sharing token generated' });
});

// GET /api/medical/public/access/:token — Public access (scanned via QR)
router.get('/public/access/:token', async (req, res) => {
  const { token } = req.params;
  const tokenStr = String(token);
  const now = new Date();

  const access = await (prisma as any).oneTimeAccess.findFirst({
    where: { token: tokenStr, expiresAt: { gte: now } },
    include: {
      record: {
        include: { patient: { select: { name: true } } }
      }
    }
  });

  if (!access) {
    res.status(404).json({ error: 'Invalid or expired sharing link' });
    return;
  }

  res.json({
    record: access.record,
    encKey: access.encKey, // This is the encrypted key (decrypted via QR hash key on client)
    patientName: (access as any).record.patient.name
  });
});

export default router;
