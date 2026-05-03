import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../lib/prisma';
import { ProtocolService } from '../modules/admin/protocol.service';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        sessionId: string;
        role: string;
    };
}

/**
 * Global Protocol Enforcement Middleware
 */
export function protocolCheck(req: AuthRequest, res: Response, next: NextFunction) {
    const { protocol, reason } = ProtocolService.getProtocol();

    // 1. Lockdown Mode: Only ADMIN role allowed
    if (protocol === 'LOCKDOWN') {
        // We need to peek at the token if it exists to see if it's an admin
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const payload = verifyAccessToken(token);
                if (payload.role === 'ADMIN') {
                    return next();
                }
            } catch {
                // Token invalid, fall through to block
            }
        }
        return res.status(451).json({ 
            error: 'SYSTEM_LOCKDOWN', 
            message: `The system is currently under emergency lockdown: ${reason}`,
            protocol 
        });
    }

    // 2. Maintenance Mode: Non-admins are blocked from POST/PUT/DELETE
    if (protocol === 'MAINTENANCE') {
        const isWriteRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
        if (isWriteRequest) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                try {
                    const token = authHeader.split(' ')[1];
                    const payload = verifyAccessToken(token);
                    if (payload.role === 'ADMIN') {
                        return next();
                    }
                } catch {}
            }
            return res.status(503).json({ 
                error: 'SYSTEM_MAINTENANCE', 
                message: `The system is in read-only maintenance mode: ${reason}`,
                protocol 
            });
        }
    }

    next();
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
