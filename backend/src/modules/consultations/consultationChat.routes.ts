import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── GET /api/consultation/chat/:id/messages ───────────────────────────────────
router.get('/chat/:id/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is part of consultation
    const consultation = await (prisma as any).consultation.findUnique({
      where: { id }
    });

    if (!consultation || (consultation.userId !== req.user!.userId && consultation.professionalId !== req.user!.userId)) {
      return res.status(403).json({ error: 'Unauthorized access to chat' });
    }

    const messages = await (prisma as any).consultationMessage.findMany({
      where: { consultationId: id },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── POST /api/consultation/chat/:id/messages ──────────────────────────────────
router.post('/chat/:id/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { encryptedContent, encryptedKey, iv, type, fileUrl } = req.body;

    const message = await (prisma as any).consultationMessage.create({
      data: {
        consultationId: id,
        senderId: req.user!.userId,
        encryptedContent,
        encryptedKey,
        iv,
        type: type || 'TEXT',
        fileUrl
      }
    });

    res.json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
