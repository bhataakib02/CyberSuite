import prisma from '../../lib/prisma';
import { logActivity } from '../../utils/logger';

/**
 * CyberSuite AI Sentinel
 * Analyzes logs for suspicious patterns and triggers alerts/incidents.
 */
export class SentinelService {
  /**
   * Run a sweep of recent logs to detect anomalies
   */
  static async analyzeRecentLogs(lookbackMinutes: number = 60) {
    const lookbackDate = new Date(Date.now() - lookbackMinutes * 60 * 1000);

    const logs = await prisma.activityLog.findMany({
      where: {
        createdAt: { gte: lookbackDate },
      },
      include: { user: true },
    });

    if (logs.length === 0) return;

    // console.log(`[Sentinel] Analyzing ${logs.length} logs...`);

    // 1. Detect Bruteforce (Multiple failures for same email/IP)
    await this.detectBruteforce(logs);

    // 2. Detect Unusual Access (e.g., login from multiple countries in short time)
    await this.detectImpossibleTravel(logs);

    // 3. Detect "Low-and-Slow" Administrative Changes
    await this.detectPrivilegeAnomalies(logs);
  }

  private static async detectBruteforce(logs: any[]) {
    const failures = logs.filter(l => l.action.includes('FAILURE') || l.status === 'FAILURE');
    const ipCounts = new Map<string, number>();

    for (const log of failures) {
      const ip = log.ipAddress || 'unknown';
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);

      if (ipCounts.get(ip)! >= 5) {
        await this.triggerAlert({
          type: 'BRUTEFORCE_ATTACK',
          severity: 'HIGH',
          message: `Detected 5+ failed attempts from IP ${ip}`,
          ipAddress: ip,
          metadata: { count: ipCounts.get(ip) },
        });
      }
    }
  }

  private static async detectImpossibleTravel(logs: any[]) {
    // This would ideally use GeoIP data from metadata
    const userLogins = logs.filter(l => l.action === 'LOGIN' || l.action === 'LOGIN_SUCCESS');
    const userMap = new Map<string, any[]>();

    for (const log of userLogins) {
      if (!userMap.has(log.userId)) userMap.set(log.userId, []);
      userMap.get(log.userId)!.push(log);
    }

    for (const [userId, activities] of userMap.entries()) {
      if (activities.length < 2) continue;
      
      // Heuristic: Check for distinct IP addresses in a very short time
      const ips = new Set(activities.map(a => a.ipAddress));
      if (ips.size > 2) {
        await this.triggerAlert({
          userId,
          type: 'SUSPICIOUS_LOCATION',
          severity: 'MEDIUM',
          message: `User logged in from ${ips.size} different IP addresses within an hour.`,
          metadata: { ips: Array.from(ips) },
        });
      }
    }
  }

  private static async detectPrivilegeAnomalies(logs: any[]) {
    const adminActions = logs.filter(l => l.action.startsWith('ADMIN_') || l.action.includes('ROLE'));
    
    if (adminActions.length > 10) {
      await this.triggerIncident({
        title: 'High-Volume Administrative Activity',
        description: `Sentinel detected an unusual spike in administrative actions (${adminActions.length} actions in 60 minutes).`,
        severity: 'HIGH',
      });
    }
  }

  static async triggerAlert(data: {
    userId?: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    ipAddress?: string;
    metadata?: any;
  }) {
    // Simulate GeoIP for the SOC Map
    const metadata = data.metadata || {};
    if (!metadata.coords && data.ipAddress) {
      metadata.coords = this.getSimulatedCoords(data.ipAddress);
    }

    const alert = await (prisma as any).alert.create({
      data: {
        userId: data.userId,
        type: data.type,
        severity: data.severity,
        message: data.message,
        ipAddress: data.ipAddress,
        metadata,
      },
    });

    // Trigger Automated Playbook
    import('../admin/playbook.service').then(({ PlaybookService }) => {
      PlaybookService.evaluateAlert(alert).catch(err => console.error('Playbook evaluation failed', err));
    });

    console.log(`[Sentinel ALERT] ${data.type}: ${data.message} | Coords: ${JSON.stringify(metadata.coords)}`);
  }

  /**
   * Generates a deterministic but varied coordinate based on an IP string
   */
  private static getSimulatedCoords(ip: string): [number, number] {
    // Simple hash to get semi-consistent random numbers
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ((hash << 5) - hash) + ip.charCodeAt(i);
      hash |= 0;
    }
    
    // Convert hash to lat/lng within world bounds
    // Longitude: -180 to 180
    // Latitude: -60 to 80 (mostly land/populated areas)
    const lng = ((Math.abs(hash) % 36000) / 100) - 180;
    const lat = ((Math.abs(hash * 7) % 14000) / 100) - 60;
    
    return [lng, lat];
  }

  static async triggerIncident(data: {
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) {
    await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: 'OPEN',
      },
    });

    console.log(`[Sentinel INCIDENT] ${data.title}`);
  }
}
