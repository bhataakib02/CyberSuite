import { Router } from 'express';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { validate } from '../../middleware/validate';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../../utils/response';
import { 
  getRegistrationOptions, 
  verifyRegistration, 
  getAuthenticationOptions, 
  verifyAuthentication 
} from '../../utils/webauthn';
import type { 
  RegistrationResponseJSON, 
  AuthenticationResponseJSON 
} from '@simplewebauthn/types';

const router = Router();
const challenges = new Map<string, string>(); // Temporary in-memory store for WebAuthn challenges
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

// ── Schemas ──────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  }),
  role: z.enum(['USER', 'ADMIN', 'STUDENT', 'ACADEMIC', 'DOCTOR', 'LAWYER', 'HEALTHCARE_STAFF', 'EMERGENCY_PROFILE']).optional(),
  captchaAnswer: z.string().min(1, 'Captcha answer is required'),
  captchaToken: z.string().min(1, 'Captcha token is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFAToken: z.string().optional(),
});

// ── GET /api/auth/captcha ─────────────────────────────────────────────────────
router.get('/captcha', (req, res) => {
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 20) + 1;
  const answer = (num1 + num2).toString();
  
  const captchaToken = jwt.sign({ answer }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '10m' });
  
  sendSuccess(res, {
    text: `What is ${num1} + ${num2}?`,
    captchaToken
  });
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role, captchaAnswer, captchaToken } = req.body;

    // Verify Captcha
    try {
      const decoded = jwt.verify(captchaToken, process.env.JWT_ACCESS_SECRET!) as { answer: string };
      if (decoded.answer !== captchaAnswer) {
        res.status(400).json({ error: 'Incorrect CAPTCHA answer' });
        return;
      }
    } catch (err) {
      res.status(400).json({ error: 'Invalid or expired CAPTCHA' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generate 6-digit OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        passwordHash, 
        role: role || 'USER', 
        isVerified: false,
        verificationCode,
        verificationExpires
      },
    });

    // Send verification email
    try {
      const { sendOTP } = require('../../utils/mail');
      await sendOTP(email, verificationCode);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
    }

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'REGISTER', details: `New account created from ${req.ip}. Verification email sent.` },
    });

    res.status(201);
    sendSuccess(res, {
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, 'Account created successfully. Please check your email for verification code.');
  } catch (err) {
    console.error(err);
    sendError(res, 'Registration failed');
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password, twoFAToken } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await logActivity({
        userId: 'SYSTEM',
        action: 'LOGIN_FAILURE',
        details: `Failed login attempt for email: ${email}`,
        status: 'FAILURE',
        ipAddress: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logActivity({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        details: `Invalid password attempt for account: ${email}`,
        status: 'FAILURE',
        ipAddress: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    if (!user.isVerified) {
      sendError(res, 'Email not verified', 403, JSON.stringify({
        unverified: true,
        email: user.email 
      }));
      return;
    }

    // Check 2FA if enabled
    if (user.twoFAEnabled && user.twoFASecret) {
      if (!twoFAToken) {
        sendSuccess(res, { require2FA: true });
        return;
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: 'base32',
        token: twoFAToken,
        window: 1,
      });
      if (!verified) {
        sendError(res, 'Invalid 2FA code', 401);
        return;
      }
    }

    const sessionId = uuidv4();
    const deviceId = uuidv4();
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown';

    const accessToken = signAccessToken({ userId: user.id, sessionId, deviceId, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, sessionId });

    await logActivity({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      details: `Successful login from ${ipAddress}`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: deviceInfo
    });

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        deviceInfo,
        ipAddress,
        userAgent: deviceInfo,
        refreshToken,
      },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'LOGIN', details: `Login from ${ipAddress}`, ipAddress },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, {
      accessToken,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, twoFAEnabled: user.twoFAEnabled,
        publicKey: user.publicKey, encPrivateKey: user.encPrivateKey,
        hasMasterPassword: !!user.masterPasswordHash,
        masterPasswordSalt: user.masterPasswordSalt,
        phoneNumber: user.phoneNumber,
        notifyEmail: user.notifyEmail,
        notifySMS: user.notifySMS,
        notifyWhatsApp: user.notifyWhatsApp,
        notifyApp: user.notifyApp,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        chronicConditions: user.chronicConditions,
        emergencyContacts: user.emergencyContacts,
      },
    });
  } catch (err) {
    console.error(err);
    sendError(res, 'Login failed');
  }
});
// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) { res.status(401).json({ error: 'No refresh token provided' }); return; }

    const payload = verifyRefreshToken(token);
    const session = await prisma.session.findFirst({
      where: { id: payload.sessionId, refreshToken: token, isActive: true },
      include: { user: true },
    });
    
    if (!session) { 
      res.status(401).json({ error: 'Session invalid or token revoked' }); 
      return; 
    }

    const newRefreshToken = signRefreshToken({ userId: session.userId, sessionId: session.id });
    const accessToken = signAccessToken({
      userId: session.userId, 
      sessionId: session.id,
      deviceId: (session as any).deviceId || uuidv4(), 
      role: session.user.role,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, lastUsedAt: new Date() },
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, { accessToken });
  } catch (err) {
    console.error('Refresh Error:', err);
    sendError(res, 'Invalid refresh token', 401);
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    if (user.verificationCode !== code) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      res.status(400).json({ error: 'Verification code expired' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isVerified: true, 
        verificationCode: null, 
        verificationExpires: null 
      },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'VERIFY_EMAIL', details: `Email verified successfully` },
    });

    sendSuccess(res, null, 'Email verified successfully. You can now log in.');
  } catch (err) {
    console.error(err);
    sendError(res, 'Verification failed');
  }
});

// ── POST /api/auth/resend-otp ──────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationExpires },
    });

    const { sendOTP } = require('../../utils/mail');
    await sendOTP(email, verificationCode);

    sendSuccess(res, null, 'New verification code sent');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to resend code');
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  await prisma.session.updateMany({
    where: { id: req.user!.sessionId },
    data: { isActive: false },
  });
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out');
});

// ── POST /api/auth/logout-all ─────────────────────────────────────────────────
router.post('/logout-all', authenticate, async (req: AuthRequest, res) => {
  await prisma.session.updateMany({
    where: { userId: req.user!.userId },
    data: { isActive: false },
  });
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out from all devices');
});

// ── GET /api/auth/sessions ────────────────────────────────────────────────────
router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user!.userId, isActive: true },
    select: { id: true, deviceInfo: true, ipAddress: true, createdAt: true, lastUsedAt: true },
    orderBy: { lastUsedAt: 'desc' }
  });
  sendSuccess(res, { sessions });
});

// ── DELETE /api/auth/sessions/:id ─────────────────────────────────────────────
router.delete('/sessions/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Prevent revoking current session
    if (id === req.user!.sessionId) {
      res.status(400).json({ error: 'Cannot revoke current active session' });
      return;
    }

    const session = await prisma.session.findUnique({ where: { id: id as string } });
    if (!session || session.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await prisma.session.update({
      where: { id: id as string },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: 'REVOKE_SESSION', details: `Revoked session on device: ${session.deviceInfo}` },
    });

    sendSuccess(res, null, 'Session revoked successfully');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to revoke session');
  }
});

// ── POST /api/auth/enable-2fa ─────────────────────────────────────────────────
router.post('/enable-2fa', authenticate, async (req: AuthRequest, res) => {
  const secret = speakeasy.generateSecret({ name: `CYBERSUITE (${req.user!.userId})`, length: 20 });
  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { twoFASecret: secret.base32 },
  });
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
  sendSuccess(res, { secret: secret.base32, qrCode });
});

// ── POST /api/auth/verify-2fa ─────────────────────────────────────────────────
router.post('/verify-2fa', authenticate, async (req: AuthRequest, res) => {
  const { token } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user?.twoFASecret) { res.status(400).json({ error: '2FA not set up' }); return; }

  const valid = speakeasy.totp.verify({
    secret: user.twoFASecret, encoding: 'base32', token, window: 1,
  });
  if (!valid) { sendError(res, 'Invalid code', 400); return; }

  await prisma.user.update({ where: { id: user.id }, data: { twoFAEnabled: true } });
  sendSuccess(res, null, '2FA enabled');
});

// ── PUT /api/auth/keys (save E2EE keys) ───────────────────────────────────────
router.put('/keys', authenticate, async (req: AuthRequest, res) => {
  const { publicKey, encPrivateKey } = req.body;
  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { publicKey, encPrivateKey },
  });
  sendSuccess(res, null, 'Keys saved');
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { 
        id: true, name: true, email: true, role: true, avatar: true, bio: true, 
        twoFAEnabled: true, publicKey: true, encPrivateKey: true, createdAt: true,
        masterPasswordHash: true, masterPasswordSalt: true, phoneNumber: true,
        notifyEmail: true, notifySMS: true, notifyWhatsApp: true, notifyApp: true,
        bloodGroup: true, allergies: true, chronicConditions: true, emergencyContacts: true
      },
    });
    sendSuccess(res, { 
      user: {
        ...user,
        hasMasterPassword: !!user?.masterPasswordHash,
        masterPasswordHash: undefined // Don't send actual hash to frontend
      } 
    });
  } catch (err) {
    sendError(res, 'Failed to fetch profile');
  }
});

// ── GET /api/auth/users (search users for chat) ───────────────────────────────
router.get('/users', authenticate, async (req: AuthRequest, res) => {
  const { q } = req.query;
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: req.user!.userId } },
        q ? { OR: [{ name: { contains: String(q), mode: 'insensitive' } }, { email: { contains: String(q), mode: 'insensitive' } }] } : {},
      ],
    },
    select: { id: true, name: true, email: true, role: true, avatar: true, publicKey: true },
    take: 20,
  });
  sendSuccess(res, { users });
});

// ── GET /api/auth/stats ───────────────────────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [vaultCount, messageCount, warrantyCount, identityCount, activityCount, weakPasswords, expiringWarranties] = await Promise.all([
      prisma.vaultEntry.count({ where: { userId } }),
      prisma.message.count({ where: { receiverId: userId } }),
      prisma.warranty.count({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true } }).then(u => 
        prisma.activityLog.count({ where: { userId, action: 'BREACH_CHECK' } }) // Proxy for now
      ),
      prisma.activityLog.count({ where: { userId } }),
      prisma.vaultEntry.count({ where: { userId, strength: { lt: 40 } } as any }),
      prisma.warranty.count({ where: { userId, expiryDate: { gte: now, lte: in30 } } })
    ]);

    // Calculate a dynamic security score
    let securityScore = 50;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFAEnabled: true } });
    if (user?.twoFAEnabled) securityScore += 10;
    if (vaultCount > 0) securityScore += 20;
    securityScore += 20; 

    res.json({
      vaultCount,
      messageCount,
      warrantyCount,
      identityCount,
      activityCount,
      securityScore: Math.min(securityScore, 100),
      activeBreaches: 0,
      weakPasswords,
      expiringWarranties,
    });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch stats');
  }
});// ── POST /api/auth/update-profile ───────────────────────────────────────────
router.post('/update-profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { 
      name, email, bio, phoneNumber, 
      notifyEmail, notifySMS, notifyWhatsApp, notifyApp,
      bloodGroup, allergies, chronicConditions, emergencyContacts 
    } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { 
        name, email, bio, phoneNumber, 
        notifyEmail, notifySMS, notifyWhatsApp, notifyApp,
        bloodGroup, allergies, chronicConditions, emergencyContacts 
      },
    });

    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: 'UPDATE_PROFILE', details: 'Updated profile details' },
    });

    sendSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to update profile');
  }
});

// ── POST /api/auth/change-password ───────────────────────────────────────────
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'CHANGE_PASSWORD', details: 'Password changed successfully' },
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to change password');
  }
});
router.get('/activity', authenticate, async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    sendSuccess(res, { logs });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch activity logs');
  }
});
router.post('/vault-setup', authenticate, async (req: AuthRequest, res) => {
  try {
    const { masterPasswordSalt, masterPasswordHash, recoveryKeyHash } = req.body;
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { masterPasswordHash, masterPasswordSalt, recoveryKeyHash },
    });
    
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: 'VAULT_SETUP', details: 'Master password and recovery key initialized' },
    });

    sendSuccess(res, null, 'Vault setup successful');
  } catch (err) {
    console.error(err);
    sendError(res, 'Vault setup failed');
  }
});

// ── POST /api/auth/vault-recovery ─────────────────────────────────────────────
router.post('/vault-recovery', authenticate, async (req: AuthRequest, res) => {
  try {
    const { recoveryKeyHash, newMasterPasswordHash, newMasterPasswordSalt } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    if (!user || user.recoveryKeyHash !== recoveryKeyHash) {
      res.status(401).json({ error: 'Invalid recovery key' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        masterPasswordHash: newMasterPasswordHash, 
        masterPasswordSalt: newMasterPasswordSalt 
      },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'VAULT_RECOVERY', details: 'Master password reset via recovery key' },
    });

    sendSuccess(res, null, 'Master password reset successful');
  } catch (err) {
    console.error(err);
    sendError(res, 'Recovery failed');
  }
});

// ── GET /api/auth/emergency/:id ───────────────────────────────────────────────
router.get('/emergency/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      select: {
        name: true,
        bloodGroup: true,
        allergies: true,
        chronicConditions: true,
        emergencyContacts: true,
      }
    });

    if (!user) {
      sendError(res, 'Emergency profile not found', 404);
      return;
    }

    sendSuccess(res, { emergencyProfile: user });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch emergency profile');
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ error: 'No account found with this email address.' });
      return;
    }

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    const { sendResetLink } = require('../../utils/mail');
    await sendResetLink(email, resetToken);

    sendSuccess(res, null, `A password reset link has been sent to ${email}.`);
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to process request');
  }
});

// ── POST /api/auth/reset-password ──────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash, 
        resetToken: null, 
        resetTokenExpires: null 
      },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'RESET_PASSWORD', details: 'Password reset successful via email link' },
    });

    sendSuccess(res, null, 'Password reset successful. You can now log in.');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to reset password');
  }
});

// ── Recovery Backups ─────────────────────────────────────────────────────────
router.get('/recovery-backups', authenticate, async (req: AuthRequest, res) => {
  try {
    const backups = await (prisma as any).recoveryBackup.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });
    sendSuccess(res, { backups });
  } catch (err) {
    sendError(res, 'Failed to fetch recovery backups');
  }
});

router.post('/recovery-backups', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serviceName, backupCodes, notes } = req.body;
    const backup = await (prisma as any).recoveryBackup.create({
      data: {
        userId: req.user!.userId,
        serviceName,
        backupCodes,
        notes
      }
    });
    sendSuccess(res, { backup });
  } catch (err) {
    sendError(res, 'Failed to create recovery backup');
  }
});

router.delete('/recovery-backups/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await (prisma as any).recoveryBackup.delete({
      where: { id, userId: req.user!.userId }
    });
    sendSuccess(res, null, 'Backup removed');
  } catch (err) {
    sendError(res, 'Failed to remove backup');
  }
});

router.get('/expenses', authenticate, async (req: AuthRequest, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });
    sendSuccess(res, { expenses });
  } catch (err) {
    sendError(res, 'Failed to fetch expenses');
  }
});

// ── WebAuthn Registration ───────────────────────────────────────────────────
router.get('/register-options', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: req.user!.userId },
      include: { authenticators: true }
    });

    if (!user) return sendError(res, 'User not found', 404);

    const options = await getRegistrationOptions({
      userId: user.id,
      userName: user.email,
      userDisplayName: user.name,
      excludeCredentials: (user as any).authenticators.map((auth: any) => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports ? (JSON.parse(auth.transports) as any[]) : undefined,
      })),
    });

    challenges.set(`reg_${user.id}`, options.challenge);
    sendSuccess(res, options);
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to generate registration options');
  }
});

router.post('/register-verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { body } = req.body;
    const expectedChallenge = challenges.get(`reg_${req.user!.userId}`);

    if (!expectedChallenge) return sendError(res, 'Registration challenge not found or expired', 400);

    const verification = await verifyRegistration({
      body: body as RegistrationResponseJSON,
      expectedChallenge,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo as any;

      await (prisma as any).authenticator.create({
        data: {
          credentialID: Buffer.from(credentialID),
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter: BigInt(counter),
          credentialDeviceType,
          credentialBackedUp,
          transports: JSON.stringify(body.response.transports || []),
          userId: req.user!.userId,
        },
      });

      challenges.delete(`reg_${req.user!.userId}`);
      
      await prisma.activityLog.create({
        data: { userId: req.user!.userId, action: 'WEBAUTHN_REGISTER', details: 'New security key registered' },
      });

      sendSuccess(res, { verified: true });
    } else {
      sendError(res, 'Registration verification failed', 400);
    }
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to verify registration');
  }
});

// ── WebAuthn Authentication ──────────────────────────────────────────────────
router.post('/login-options', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await (prisma.user as any).findUnique({
      where: { email },
      include: { authenticators: true }
    });

    if (!user) return sendError(res, 'User not found', 404);

    const options = await getAuthenticationOptions({
      allowCredentials: (user as any).authenticators.map((auth: any) => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports ? (JSON.parse(auth.transports) as any[]) : undefined,
      })),
    });

    challenges.set(`auth_${user.id}`, options.challenge);
    sendSuccess(res, { options, userId: user.id });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to generate login options');
  }
});

router.post('/login-verify', async (req, res) => {
  try {
    const { body, userId } = req.body;
    const expectedChallenge = challenges.get(`auth_${userId}`);

    if (!expectedChallenge) return sendError(res, 'Authentication challenge not found or expired', 400);

    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      include: { authenticators: true }
    });

    if (!user) return sendError(res, 'User not found', 404);

    const authenticator = (user as any).authenticators.find((auth: any) => 
      Buffer.from(auth.credentialID).toString('base64url') === body.id
    );

    if (!authenticator) return sendError(res, 'Authenticator not found', 404);

    const verification = await verifyAuthentication({
      body: body as AuthenticationResponseJSON,
      expectedChallenge,
      authenticator: {
        credentialID: authenticator.credentialID,
        credentialPublicKey: authenticator.credentialPublicKey,
        counter: Number(authenticator.counter),
        transports: authenticator.transports ? (JSON.parse(authenticator.transports) as any[]) : undefined,
      },
    });

    if (verification.verified) {
      // Update counter
      await (prisma as any).authenticator.update({
        where: { id: authenticator.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) },
      });

      challenges.delete(`auth_${userId}`);

      // Issue tokens (similar to login)
      const sessionId = uuidv4();
      const deviceId = uuidv4();
      const deviceInfo = req.headers['user-agent'] || 'Unknown';
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown';

      const accessToken = signAccessToken({ userId: user.id, sessionId, deviceId, role: user.role });
      const refreshToken = signRefreshToken({ userId: user.id, sessionId });

      await prisma.session.create({
        data: { id: sessionId, userId: user.id, deviceInfo, ipAddress, userAgent: deviceInfo, refreshToken },
      });

      await prisma.activityLog.create({
        data: { userId: user.id, action: 'WEBAUTHN_LOGIN', details: `Login via security key from ${ipAddress}`, ipAddress },
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      sendError(res, 'Authentication verification failed', 400);
    }
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to verify login');
  }
});

export default router;
