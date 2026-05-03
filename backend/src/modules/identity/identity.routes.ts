import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import prisma from '../../lib/prisma';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();
const checkSchema = z.object({ email: z.string().email() });

// Password breach check (k-anonymity)
async function checkPasswordBreach(password: string): Promise<number> {
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'CYBERSUITE-Platform' }
    });
    
    const lines = res.data.split('\n');
    const match = lines.find((l: string) => l.startsWith(suffix));
    return match ? parseInt(match.split(':')[1], 10) : 0;
  } catch (err) {
    console.error('Password breach check error:', err);
    return 0;
  }
}

// Email breach check via HIBP
async function checkEmailBreach(email: string): Promise<{ breached: boolean; count: number; sites: string[] }> {
  const apiKey = process.env.HIBP_API_KEY;
  
  if (!apiKey) {
    console.warn('HIBP_API_KEY missing. Using simulation mode for email breaches.');
    // Simulated data for demo purposes if no key is provided
    const isMockBreached = email.includes('test') || email.includes('leak');
    if (isMockBreached) {
      return { breached: true, count: 3, sites: ['Adobe', 'LinkedIn', 'Canva (Mock)'] };
    }
    return { breached: false, count: 0, sites: [] };
  }

  try {
    const res = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
      headers: {
        'User-Agent': 'CYBERSUITE-Platform',
        'hibp-api-key': apiKey
      }
    });
    
    if (res.status === 200) {
      const breaches = res.data;
      return { breached: true, count: breaches.length, sites: breaches.map((b: any) => b.Name) };
    }
    return { breached: false, count: 0, sites: [] };
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      return { breached: false, count: 0, sites: [] };
    }
    console.error('Email breach check error:', err.message);
    return { breached: false, count: 0, sites: [] };
  }
}

function calcRiskScore(hibpResult: { breached: boolean; count: number }, weakPassCount: number): number {
  let score = 100;
  if (hibpResult.breached) score -= Math.min(60, hibpResult.count * 10);
  score -= weakPassCount * 5;
  return Math.max(0, score);
}

// POST /api/identity/check
router.post('/check', authenticate, validate(checkSchema), async (req: AuthRequest, res) => {
  const { email } = req.body;
  const hibpResult = await checkEmailBreach(email);

  const vaultCount = await prisma.vaultEntry.count({ where: { userId: req.user!.userId } });
  const riskScore = calcRiskScore(hibpResult, 0);

  await prisma.activityLog.create({
    data: { userId: req.user!.userId, action: 'IDENTITY_CHECK', details: `Checked identity for ${email}` },
  });

  sendSuccess(res, {
    email,
    breached: hibpResult.breached,
    breachCount: hibpResult.count,
    breachedSites: hibpResult.sites,
    riskScore,
    riskLabel: riskScore >= 80 ? 'Low Risk' : riskScore >= 50 ? 'Medium Risk' : 'High Risk',
    vaultEntries: vaultCount,
  });
});

// POST /api/identity/check-password
router.post('/check-password', authenticate, async (req: AuthRequest, res) => {
  const { password } = req.body;
  const count = await checkPasswordBreach(password);
  
  await prisma.activityLog.create({
    data: { userId: req.user!.userId, action: 'PASSWORD_CHECK', details: `Performed password exposure check` },
  });

  sendSuccess(res, {
    exposed: count > 0,
    exposureCount: count,
  }, count > 0
    ? `This password appears ${count.toLocaleString()} times in known data breaches!`
    : 'This password has not been found in known breaches.');
});

import { ZKPService } from './zkp.service';

// ── GET /api/identity/zkp/challenge ──────────────────────────────────────────
router.get('/zkp/challenge', authenticate, (req, res) => {
  sendSuccess(res, { 
    challenge: ZKPService.generateChallenge(),
    nonce: ZKPService.generateNonce() 
  });
});

// ── POST /api/identity/zkp/verify ───────────────────────────────────────────
router.post('/zkp/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { attribute, proof } = req.body;
    
    const isValid = ZKPService.verifyAttributeProof(attribute, proof);
    
    if (isValid) {
      // If valid, we might want to update the user's "Private Verified Attributes" in the DB
      // For now, we'll just return success and log it
      await prisma.activityLog.create({
        data: { 
          userId: req.user!.userId, 
          action: 'IDENTITY_ZKP_VERIFY', 
          details: `Successfully verified private attribute: ${attribute}` 
        }
      });
      
      return sendSuccess(res, { verified: true }, `Private attribute "${attribute}" verified successfully.`);
    } else {
      return sendError(res, 'Cryptographic proof verification failed', 400);
    }
  } catch (err) {
    sendError(res, 'Internal ZKP engine error');
  }
});

export default router;
