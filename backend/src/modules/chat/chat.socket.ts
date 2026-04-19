import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../../utils/jwt';
import prisma from '../../lib/prisma';

interface ConnectedUser {
  userId: string;
  socketId: string;
  name: string;
}

const onlineUsers = new Map<string, string>(); // userId -> socketId
let io: SocketServer | null = null;

export const getOnlineUserSocketId = (userId: string) => onlineUsers.get(userId);
export const getIo = () => io;

export function initChatSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Auth middleware for sockets
  io!.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).sessionId = payload.sessionId;
      (socket as any).role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io!.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    const role = (socket as any).role as string;
    onlineUsers.set(userId, socket.id);

    // Join admin room if applicable
    if (role === 'ADMIN') {
      socket.join('admin_room');
      console.log(`Admin joined monitor: ${userId}`);
    }

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId });
    socket.emit('online:users', Array.from(onlineUsers.keys()));

    console.log(`[Socket] ${userId} connected (${socket.id})`);

    // ── Send Message ────────────────────────────────────────────────────────
    socket.on('message:send', async (data: {
      receiverId: string;
      encryptedMessage: string;
      encryptedKey: string;
      iv: string;
      selfDestruct?: boolean;
      destructInSeconds?: number;
      tempId?: string;
    }) => {
      try {
        const destructAt = data.selfDestruct && data.destructInSeconds
          ? new Date(Date.now() + data.destructInSeconds * 1000)
          : undefined;

        const msg = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId: data.receiverId,
            encryptedMessage: data.encryptedMessage,
            encryptedKey: data.encryptedKey,
            iv: data.iv,
            selfDestruct: !!data.selfDestruct,
            destructAt,
          },
        });

        // Send back to sender (update tempId -> real id)
        socket.emit('message:sent', { ...msg, tempId: data.tempId });

        // Deliver to receiver if online
        const receiverSocketId = onlineUsers.get(data.receiverId);
        if (receiverSocketId) {
          io!.to(receiverSocketId).emit('message:receive', msg);
          // Mark delivered
          await prisma.message.update({ where: { id: msg.id }, data: { status: 'DELIVERED' } });
          socket.emit('message:status', { id: msg.id, status: 'DELIVERED' });
        }
      } catch (err) {
        console.error('[Socket] message:send error', err);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // ── Typing indicator ────────────────────────────────────────────────────
    socket.on('typing:start', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) io!.to(receiverSocketId).emit('typing:start', { senderId: userId });
    });

    socket.on('typing:stop', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) io!.to(receiverSocketId).emit('typing:stop', { senderId: userId });
    });

    // ── Read receipt ────────────────────────────────────────────────────────
    socket.on('message:read', async ({ messageId, senderId }: { messageId: string; senderId: string }) => {
      try {
        await prisma.message.update({ where: { id: messageId }, data: { status: 'READ' } });
        const senderSocket = onlineUsers.get(senderId);
        if (senderSocket) io!.to(senderSocket).emit('message:status', { id: messageId, status: 'READ' });
      } catch {}
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
      console.log(`[Socket] ${userId} disconnected`);
    });
  });

  return io;
}
