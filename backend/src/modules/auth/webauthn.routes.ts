import { Router } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { 
  AuthenticatorTransportFuture,
  RegistrationResponseJSON, 
  AuthenticationResponseJSON 
} from '@simplewebauthn/types';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

const RP_NAME = 'CyberSuite Sovereign';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';

const currentChallenges = new Map<string, string>();

/**
 * ── REGISTRATION ────────────────────────────────────────────────────────────
 */

router.get('/register/options', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { authenticators: true }
    });

    if (!user) return sendError(res, 'User not found', 404);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: isoUint8Array.fromUTF8String(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: user.authenticators.map((auth) => ({
        id: isoBase64URL.fromBuffer(new Uint8Array(auth.credentialID)),
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'cross-platform',
      },
    });

    currentChallenges.set(user.id, options.challenge);
    sendSuccess(res, options);
  } catch (err) {
    console.error('WebAuthn Registration Options Error:', err);
    sendError(res, 'Failed to generate registration options');
  }
});

router.post('/register/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { body }: { body: RegistrationResponseJSON } = req.body;
    const userId = req.user!.userId;
    const expectedChallenge = currentChallenges.get(userId);

    if (!expectedChallenge) return sendError(res, 'Challenge expired or not found', 400);

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;

      await prisma.authenticator.create({
        data: {
          credentialID: Buffer.from(credential.id),
          credentialPublicKey: Buffer.from(credential.publicKey),
          counter: BigInt(credential.counter),
          credentialDeviceType: verification.registrationInfo.credentialDeviceType,
          credentialBackedUp: verification.registrationInfo.credentialBackedUp,
          userId,
        },
      });

      currentChallenges.delete(userId);
      sendSuccess(res, { verified: true }, 'Hardware key registered successfully.');
    } else {
      sendError(res, 'Verification failed', 400);
    }
  } catch (err) {
    console.error('WebAuthn Registration Verification Error:', err);
    sendError(res, 'Failed to verify hardware key');
  }
});

/**
 * ── AUTHENTICATION ──────────────────────────────────────────────────────────
 */

router.post('/login/options', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { authenticators: true }
    });

    if (!user || user.authenticators.length === 0) {
      return sendError(res, 'No hardware keys registered for this account', 404);
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user.authenticators.map((auth) => ({
        id: isoBase64URL.fromBuffer(new Uint8Array(auth.credentialID)),
        type: 'public-key',
        transports: auth.transports ? (JSON.parse(auth.transports) as AuthenticatorTransportFuture[]) : undefined,
      })),
      userVerification: 'preferred',
    });

    currentChallenges.set(user.id, options.challenge);
    sendSuccess(res, { options, userId: user.id });
  } catch (err) {
    console.error('WebAuthn Login Options Error:', err);
    sendError(res, 'Failed to generate login options');
  }
});

router.post('/login/verify', async (req, res) => {
  try {
    const { body, userId }: { body: AuthenticationResponseJSON; userId: string } = req.body;
    const expectedChallenge = currentChallenges.get(userId);

    if (!expectedChallenge) return sendError(res, 'Challenge expired', 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { authenticators: true }
    });

    if (!user) return sendError(res, 'User not found', 404);

    const dbAuthenticator = user.authenticators.find(
      (auth) => isoBase64URL.fromBuffer(new Uint8Array(auth.credentialID)) === body.id
    );

    if (!dbAuthenticator) return sendError(res, 'Authenticator not found', 404);

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: isoBase64URL.fromBuffer(new Uint8Array(dbAuthenticator.credentialID)),
        publicKey: new Uint8Array(dbAuthenticator.credentialPublicKey),
        counter: Number(dbAuthenticator.counter),
      },
    });

    if (verification.verified) {
      await prisma.authenticator.update({
        where: { id: dbAuthenticator.id },
        data: { counter: verification.authenticationInfo.newCounter },
      });

      currentChallenges.delete(userId);
      sendSuccess(res, { verified: true, user: { id: user.id, email: user.email, role: user.role } });
    } else {
      sendError(res, 'Hardware key verification failed', 400);
    }
  } catch (err) {
    console.error('WebAuthn Login Verification Error:', err);
    sendError(res, 'Hardware key login failed');
  }
});

export default router;
