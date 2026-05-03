import prisma from '../../lib/prisma';
import { ProtocolService } from './protocol.service';

export class PlaybookService {
  /**
   * Evaluate an alert and perform automated mitigation if applicable
   */
  static async evaluateAlert(alert: any) {
    const { autoMitigation } = ProtocolService.getProtocol();
    if (!autoMitigation) return;

    console.log(`[Playbook] Evaluating alert: ${alert.type} (${alert.severity})`);

    // ── Rule 1: CRITICAL Honeypot Hit -> Instant IP Block ────────────────────
    if (alert.type === 'HONEYPOT_TRAP_HIT' && alert.severity === 'CRITICAL' && alert.ipAddress) {
      await this.blockIp(alert.ipAddress, `Automated mitigation: Honeypot hit on ${alert.metadata?.path}`);
    }

    // ── Rule 2: Bruteforce Attack -> Force Logout User + Block IP ──────────
    if (alert.type === 'BRUTEFORCE_ATTACK' && alert.ipAddress) {
      await this.blockIp(alert.ipAddress, 'Automated mitigation: Bruteforce activity detected');
    }

    // ── Rule 3: Suspicious Location -> Revoke all sessions for user ─────────
    if (alert.type === 'SUSPICIOUS_LOCATION' && alert.userId) {
      await this.revokeUserSessions(alert.userId, 'Automated mitigation: Impossible travel/Suspicious location detected');
    }
  }

  private static async blockIp(ip: string, reason: string) {
    console.warn(`[Playbook] AUTO-BLOCKING IP: ${ip}. Reason: ${reason}`);
    
    // In a real system, this would integrate with a firewall (iptables/Cloudflare/WAF)
    // Here we log it to the ActivityLog which the middleware can eventually use
    await prisma.activityLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'ADMIN_BLOCK_IP',
        details: `${reason} | Target IP: ${ip}`,
        ipAddress: ip
      }
    });
  }

  private static async revokeUserSessions(userId: string, reason: string) {
    console.warn(`[Playbook] REVOKING SESSIONS for User: ${userId}. Reason: ${reason}`);
    
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    await prisma.activityLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'ADMIN_FORCE_LOGOUT',
        details: `${reason} | Target User: ${userId}`
      }
    });
  }
}
