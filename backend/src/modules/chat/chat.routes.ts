import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// GET /api/chat/messages/:contactId — fetch conversation
router.get('/messages/:contactId', authenticate, async (req: AuthRequest, res) => {
  const contactId = String(req.params.contactId);
  const userId = req.user!.userId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId },
      ],
      // Auto-clean self-destruct messages
      AND: [
        { OR: [{ selfDestruct: false }, { destructAt: { gt: new Date() } }] },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Mark received messages as delivered
  await prisma.message.updateMany({
    where: { senderId: contactId, receiverId: userId, status: 'SENT' },
    data: { status: 'DELIVERED' },
  });

  sendSuccess(res, { messages });
});

// GET /api/chat/contacts — list users the current user has chatted with
router.get('/contacts', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    distinct: ['senderId', 'receiverId'],
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true, publicKey: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true, publicKey: true } },
    },
  });

  const contactMap = new Map<string, any>();
  for (const msg of messages) {
    const contact = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!contactMap.has(contact.id)) {
      contactMap.set(contact.id, { ...contact, lastMessage: msg.encryptedMessage, lastMessageAt: msg.createdAt });
    }
  }

  sendSuccess(res, { contacts: Array.from(contactMap.values()) });
});

// DELETE /api/chat/messages/:id — delete own message
router.delete('/messages/:id', authenticate, async (req: AuthRequest, res) => {
  const msg = await prisma.message.findFirst({
    where: { id: String(req.params.id), senderId: req.user!.userId },
  });
  if (!msg) { sendError(res, 'Not found', 404); return; }
  await prisma.message.delete({ where: { id: String(req.params.id) } });
  sendSuccess(res, null, 'Deleted');
});

export default router;
