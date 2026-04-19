import { Router } from 'express';
import multer from 'multer';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// POST /api/files/upload
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    const { category, fileName } = req.body; // e.g. STUDENT, LEGAL, IDENTITY

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }
    
    if (!category) {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    const fileRecord = await prisma.fileRecord.create({
      data: {
        userId: req.user!.userId,
        category,
        fileName: fileName || file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: file.filename // Store just the filename, we can construct the path later
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'FILE_UPLOAD',
        details: `Uploaded file to ${category} vault`,
      }
    });

    res.status(201).json({ message: 'File securely uploaded', file: fileRecord });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/files
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const files = await prisma.fileRecord.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ files });
  } catch (err) {
    console.error('Fetch files error:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// GET /api/files/download/:id
router.get('/download/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const fileRecord = await prisma.fileRecord.findUnique({
      where: { id: String(id) }
    });

    if (!fileRecord || fileRecord.userId !== req.user!.userId) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const filePath = path.join(__dirname, '../../../../uploads', fileRecord.storagePath);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File data not found on server' });
      return;
    }

    res.download(filePath, fileRecord.fileName);
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// DELETE /api/files/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const fileRecord = await prisma.fileRecord.findUnique({
      where: { id: String(id) }
    });

    if (!fileRecord || fileRecord.userId !== req.user!.userId) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const filePath = path.join(__dirname, '../../../../uploads', fileRecord.storagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.fileRecord.delete({
      where: { id: String(id) }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'FILE_DELETE',
        details: `Deleted file from ${fileRecord.category} vault`,
      }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
