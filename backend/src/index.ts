import 'dotenv/config'; // Force reload of environment
import prisma from './lib/prisma';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler, notFound } from './middleware/error';
import { initChatSocket } from './modules/chat/chat.socket';
import authRouter from './modules/auth/auth.routes';
import chatRouter from './modules/chat/chat.routes';
import vaultRouter from './modules/vault/vault.routes';
import analyzerRouter from './modules/analyzer/analyzer.routes';
import warrantyRouter from './modules/warranty/warranty.routes';
import identityRouter from './modules/identity/identity.routes';
import medicalRouter from './modules/medical/medical.routes';
import notificationRouter from './modules/notifications/notification.routes';
import searchRouter from './modules/search/search.routes';
import adminRouter from './modules/admin/admin.routes';
import filesRouter from './modules/files/files.routes';
import subscriptionRouter from './modules/subscriptions/subscriptions.routes';
import legacyRouter from './modules/legacy/legacy.routes';
import disasterRouter from './modules/disaster/disaster.routes';
import groupsRouter from './modules/groups/groups.routes';
import webauthnRouter from './modules/auth/webauthn.routes';
import expensesRouter from './modules/expenses/expenses.routes';
import consultationRouter from './modules/consultations/consultation.routes';
import consultationChatRouter from './modules/consultations/consultationChat.routes';
import { geoFence } from './middleware/geo';
import { startCronJobs } from './jobs/cron';
import { sendSuccess } from './utils/response';

const app = express();
const httpServer = http.createServer(app);

// ── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Managed by Next.js on frontend
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5000, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { error: 'Too many auth attempts' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: 'Too many login attempts. Try again later.' } });

app.use(globalLimiter);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import { honeypot } from './middleware/honeypot';

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Honeypot (Active Defense) ────────────────────────────────────────────────
app.use(honeypot);

import { protocolCheck } from './middleware/auth';

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }));

// ── Protocol Check (Global) ───────────────────────────────────────────────────
app.use('/api', protocolCheck as any);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/auth/webauthn', webauthnRouter);
app.use('/api/chat', chatRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/analyze', analyzerRouter);
app.use('/api/warranty', warrantyRouter);
app.use('/api/identity', identityRouter);
app.use('/api/medical', medicalRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/admin', adminRouter);
app.use('/api/files', filesRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/legacy', legacyRouter);
app.use('/api/disaster', disasterRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/expenses', geoFence as any, expensesRouter);
app.use('/api/consultation', consultationRouter);
app.use('/api/consultation', consultationChatRouter);

// ── 404 + Error Handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────────────────────
initChatSocket(httpServer);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(`🚀 CYBERSUITE API running on http://localhost:${PORT}`);
  
  try {
    const maskedUrl = process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 CONNECTING TO: ${maskedUrl}`);
    await prisma.$connect();
    console.log('✅ DATABASE CONNECTED');
  } catch (err) {
    console.error('❌ DATABASE CONNECTION FAILED:', err);
  }

  startCronJobs();
});

export default app;
