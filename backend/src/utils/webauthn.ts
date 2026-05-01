import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

// Relying Party (RP) Configuration
const rpName = process.env.RP_NAME || 'CyberSuite Security';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Generate options for a user to register a new authenticator (e.g. YubiKey, TouchID)
 */
export const getRegistrationOptions = (params: {
  userId: string;
  userName: string;
  userDisplayName: string;
  excludeCredentials?: any[];
}) => {
  return generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(params.userId),
    userName: params.userName,
    userDisplayName: params.userDisplayName,
    // Only allow non-resident keys for maximum security in some contexts, 
    // but usually we want "preferred" for best UX.
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    attestationType: 'none',
    excludeCredentials: params.excludeCredentials,
  });
};

/**
 * Verify the response from the client after they've tapped their security key
 */
export const verifyRegistration = async (params: {
  body: RegistrationResponseJSON;
  expectedChallenge: string;
}) => {
  return verifyRegistrationResponse({
    response: params.body,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
};

/**
 * Generate options for a user to authenticate with a previously registered key
 */
export const getAuthenticationOptions = (params: {
  allowCredentials?: any[];
}) => {
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: params.allowCredentials,
    userVerification: 'preferred',
  });
};

/**
 * Verify the authentication response
 */
export const verifyAuthentication = async (params: {
  body: AuthenticationResponseJSON;
  expectedChallenge: string;
  authenticator: any;
}) => {
  return verifyAuthenticationResponse({
    response: params.body,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: params.authenticator,
  } as any);
};
