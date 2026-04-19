import prisma from '../lib/prisma';
import { getIo, getOnlineUserSocketId } from '../modules/chat/chat.socket';

export type LogAction = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILURE' 
  | 'BREACH_CHECK' 
  | 'BREACH_FOUND' 
  | 'UNAUTHORIZED_ACCESS' 
  | 'UPDATE_PROFILE' 
  | 'VAULT_ACCESS' 
  | 'MEDICAL_SHARE';

interface LogOptions {
  userId: string;
  action: LogAction;
  details: string;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export async function logActivity(options: LogOptions) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        details: options.details,
        status: options.status || 'SUCCESS',
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: options.metadata,
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    // If it's a threat/warning, broadcast to all online admins
    if (options.status === 'FAILURE' || options.status === 'WARNING' || ['BREACH_FOUND', 'UNAUTHORIZED_ACCESS'].includes(options.action)) {
      const io = getIo();
      if (io) {
        // We broadcast to the 'admin' room
        io.to('admin_room').emit('admin:threat', log);
      }
    }

    return log;
  } catch (err) {
    console.error('Logging failed:', err);
  }
}
