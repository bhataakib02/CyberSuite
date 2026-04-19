import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface JwtPayload {
    userId: string;
    sessionId: string;
    deviceId: string;
    role: string;
}

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions);
}

export function signRefreshToken(payload: { userId: string; sessionId: string }): string {
    return jwt.sign({ ...payload, jti: uuidv4() }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRY,
    } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string; sessionId: string } {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string; sessionId: string };
}
