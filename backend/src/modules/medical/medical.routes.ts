import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth';
import { verifyOnBlockchain, getBlockchainTxData } from '../../utils/blockchain'; // Updated imports
import { sendSuccess, sendError } from '../../utils/response';

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
  if (!req.file) { sendError(res, 'No file uploaded', 400); return; }
  const { encKeyForOwner, description, documentType } = req.body;
  if (!encKeyForOwner) { sendError(res, 'encKeyForOwner required', 400); return; }
  if (!documentType) { sendError(res, 'documentType required', 400); return; }

  let blockchainTxId: string | null = null;
  let blockchainNetwork: string | null = null;
  let blockchainBlockNumber: number | null = null;

  try {
    // 1. Read the uploaded file and calculate its SHA-256 hash
    const fileBuffer = await fsPromises.readFile(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Anchor the hash to the blockchain
    const blockchainResult = await verifyOnBlockchain(fileHash);
    blockchainTxId = blockchainResult.txId || null;
    blockchainNetwork = blockchainResult.network || null;
    blockchainBlockNumber = blockchainResult.blockNumber || null;

    console.log(`[Medical Record] File hash ${fileHash} anchored to blockchain. TxID: ${blockchainTxId}`);

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: req.user!.userId,
        fileName: req.file.originalname,
        encFileUrl: `/uploads/medical/${req.file.filename}`,
        encKeyForOwner,
        description,
        blockchainTxId,
        blockchainNetwork,
        blockchainBlockNumber,
      },
    });
    sendSuccess(res, { record: { ...record, blockchainTxId, blockchainNetwork, blockchainBlockNumber } }, undefined, 201);
  } catch (error) {
    console.error('Error during medical record upload or blockchain anchoring:', error);
    sendError(res, 'Failed to upload medical record or anchor to blockchain.', 500, (error as Error).message);
  }
});

// GET /api/medical/records — Patient views own records
router.get('/records', authenticate, requireRole('USER', 'ADMIN'), async (req: AuthRequest, res) => {
  const records = await prisma.medicalRecord.findMany({
    where: { patientId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { doctorAccesses: { include: { doctor: { select: { name: true, email: true } } } } },
  });
  sendSuccess(res, { records });
});

// POST /api/medical/grant-access — Patient grants doctor access
router.post('/grant-access', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const { recordId, doctorId, encKey, expiresInHours } = req.body;
  if (!recordId || !doctorId || !encKey) { res.status(400).json({ error: 'recordId, doctorId, encKey required' }); return; }

  const record = await prisma.medicalRecord.findFirst({ where: { id: recordId, patientId: req.user!.userId } });
  if (!record) { res.status(404).json({ error: 'Record not found' }); return; }

  const doctor = await prisma.user.findFirst({ where: { id: doctorId, role: { in: ['DOCTOR', 'HEALTHCARE_STAFF'] } } });
  if (!doctor) { sendError(res, 'Doctor not found', 404); return; }

  const expiresAt = new Date(Date.now() + (expiresInHours || 24) * 60 * 60 * 1000);
  const access = await prisma.doctorAccess.create({ data: { recordId, doctorId, encKey, expiresAt } });
  sendSuccess(res, { access }, 'Access granted');
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
  sendSuccess(res, { accesses });
});

// POST /api/medical/revoke-access — Patient revokes doctor access
router.delete('/revoke-access/:accessId', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const access = await prisma.doctorAccess.findFirst({
    where: { id: String(req.params.accessId) },
    include: { record: true },
  });
  if (!access || (access as any).record.patientId !== req.user!.userId) {
    sendError(res, 'Not authorized', 403); return;
  }
  await prisma.doctorAccess.delete({ where: { id: String(req.params.accessId) } });
  sendSuccess(res, null, 'Access revoked');
});

// GET /api/medical/doctors — List doctors for patient to grant access
router.get('/doctors', authenticate, async (_req, res) => {
  const doctors = await prisma.user.findMany({
    where: { role: { in: ['DOCTOR', 'HEALTHCARE_STAFF'] } },
    select: { id: true, name: true, email: true, avatar: true, publicKey: true },
  });
  sendSuccess(res, { doctors });
});

// POST /api/medical/one-time-share — Patient generates a QR share link
router.post('/one-time-share', authenticate, requireRole('USER'), async (req: AuthRequest, res) => {
  const { recordId, encKey, expiresInHours } = req.body;
  if (!recordId || !encKey) { res.status(400).json({ error: 'recordId and encKey required' }); return; }

  const record = await prisma.medicalRecord.findFirst({ where: { id: recordId, patientId: req.user!.userId } });
  if (!record) { res.status(404).json({ error: 'Record not found' }); return; }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + (expiresInHours || 1) * 60 * 60 * 1000); // Default 1 hour

  const access = await prisma.oneTimeAccess.create({
    data: { recordId, token, encKey, expiresAt }
  });

  sendSuccess(res, { token, expiresAt }, 'Sharing token generated');
});

// GET /api/medical/public/access/:token — Public access (scanned via QR)
router.get('/public/access/:token', async (req, res) => {
  const { token } = req.params;
  const tokenStr = String(token);
  const now = new Date();

  const access = await prisma.oneTimeAccess.findFirst({
    where: { token: tokenStr, expiresAt: { gte: now } },
    include: {
      record: {
        include: { patient: { select: { name: true } } }
      }
    }
  });

  if (!access) {
    sendError(res, 'Invalid or expired sharing link', 404);
    return;
  }

  sendSuccess(res, {
    record: access.record,
    encKey: access.encKey,
    patientName: (access as any).record.patient.name
  });
});

// GET /api/medical/public/verify/:txId — Publicly verify file integrity
router.get('/public/verify/:txId', async (req, res) => {
  const { txId } = req.params;
  const { hash } = req.query; // The hash of the file the user wants to check

  if (!hash) {
    return res.status(400).json({ error: 'File hash query parameter is required' });
  }

  const txData = await getBlockchainTxData(txId);
  if (!txData) {
    return res.status(404).json({ error: 'Transaction not found on blockchain' });
  }

  // Normalize hashes for comparison (ensure 0x prefix)
  const normalizedProvidedHash = String(hash).startsWith('0x') ? String(hash) : `0x${hash}`;
  const isValid = txData.data.toLowerCase() === normalizedProvidedHash.toLowerCase();

  sendSuccess(res, {
    isValid,
    blockchainData: txData,
  }, isValid ? 'Integrity Verified: File matches blockchain anchor.' : 'Verification Failed: Hash mismatch.');
});

// ── EMERGENCY PROFILE ────────────────────────────────────────────────────────
// POST /api/medical/emergency/token — Generate/Refresh emergency token
router.post('/emergency/token', authenticate, async (req: AuthRequest, res) => {
  try {
    // We use a signature based on user secret + a static emergency salt
    const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'emergency-secret')
      .update(`${req.user!.userId}-emergency`)
      .digest('hex');
    
    sendSuccess(res, { token }, 'Emergency token generated');
  } catch (err) {
    sendError(res, 'Failed to generate token');
  }
});

// GET /api/medical/emergency/profile/:token — Public access for medical staff
router.get('/emergency/profile/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.query; // We need userId to verify against token

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const expectedToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'emergency-secret')
      .update(`${userId}-emergency`)
      .digest('hex');

    if (token !== expectedToken) {
      return res.status(401).json({ error: 'Invalid emergency token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: {
        name: true,
        bloodGroup: true,
        allergies: true,
        chronicConditions: true,
        emergencyContacts: true,
      }
    });

    if (!user) { sendError(res, 'User not found', 404); return; }

    sendSuccess(res, { profile: user });
  } catch (err) {
    sendError(res, 'Failed to fetch emergency profile');
  }
});

export default router;
