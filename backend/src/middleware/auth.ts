import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        sessionId: string;
        role: string;
    };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);

        // Check session is still active
        const session = await prisma.session.findFirst({
            where: { id: payload.sessionId, isActive: true },
        });

        if (!session) {
            res.status(401).json({ error: 'Session expired or revoked' });
            return;
        }

        req.user = {
            userId: payload.userId,
            sessionId: payload.sessionId,
            role: payload.role,
        };

        // Update last seen (fire and forget to not block request)
        prisma.user.update({
            where: { id: payload.userId },
            data: { lastActiveAt: new Date() }
        }).catch(err => console.error('Failed to update lastActiveAt', err));

        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
