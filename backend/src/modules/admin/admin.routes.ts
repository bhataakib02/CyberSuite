import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
router.get('/dashboard', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newSignupsToday,
      failedLoginsToday,
      activeSessions,
      pendingVerifications,
      activeIncidents,
      securityStats,
      liveFeed
    ] = await Promise.all([
      prisma.user.count(),
      prisma.session.count({ where: { lastUsedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.activityLog.count({ where: { action: 'LOGIN_FAILURE', createdAt: { gte: today } } }),
      prisma.session.count({ where: { isActive: true } }),
      prisma.professionalProfile.count({ where: { status: 'PENDING' } }),
      (prisma as any).incident.count({ where: { status: { not: 'RESOLVED' } } }),
      Promise.all([
        prisma.user.count({ where: { twoFAEnabled: true } }),
        prisma.vaultEntry.count({ where: { strength: { lt: 40 } } }),
        (prisma as any).alert.count({ where: { status: 'NEW' } }),
      ]),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { user: { select: { name: true, email: true, avatar: true } } }
      })
    ]);

    const mockTrends = {
      growth: [120, 145, 134, 168, 189, 210, totalUsers],
      activity: [500, 620, 480, 710, 850, 920, 1050],
      alerts: [5, 2, 8, 3, 1, 6, securityStats[2]]
    };

    sendSuccess(res, {
      kpis: {
        totalUsers,
        activeUsers,
        newSignupsToday,
        failedLoginsToday,
        activeSessions,
        pendingVerifications,
        activeIncidents,
        systemHealth: 'HEALTHY'
      },
      trends: mockTrends,
      security: {
        twoFAPercentage: totalUsers > 0 ? Math.round((securityStats[0] / totalUsers) * 100) : 0,
        weakPasswords: securityStats[1],
        activeThreats: securityStats[2],
        riskLevel: securityStats[2] > 10 ? 'HIGH' : securityStats[2] > 5 ? 'MEDIUM' : 'LOW'
      },
      liveFeed
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    sendError(res, 'Failed to fetch SOC dashboard data');
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    console.log(`[Admin] Fetching users: search="${search}", page=${page}, limit=${limit}`);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          lastActiveAt: true,
          riskLevel: true,
          _count: {
            select: { vaultEntries: true, medicalRecords: true, warranties: true, sessions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    console.log(`[Admin] Found ${users.length} users out of ${total} total`);
    sendSuccess(res, { users }, undefined, 200);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    sendError(res, 'Failed to fetch users');
  }
});

// ── POST /api/admin/users/:id/block ──────────────────────────────────────────
router.post('/users/:id/block', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: String(id) } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    if (user.role === 'ADMIN' && req.user!.userId !== user.id) {
      res.status(403).json({ error: 'Cannot block another admin' }); return;
    }

    const newStatus = !(user as any).isActive;
    await prisma.user.update({
      where: { id: String(id) },
      data: { isActive: newStatus }
    });

    if (!newStatus) {
      await prisma.session.updateMany({
        where: { userId: String(id) },
        data: { isActive: false }
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: newStatus ? 'ADMIN_UNBLOCK_USER' : 'ADMIN_BLOCK_USER',
        details: `${newStatus ? 'Unblocked' : 'Blocked'} user ${user.email}`,
      }
    });

    sendSuccess(res, { isActive: newStatus }, `User ${newStatus ? 'unblocked' : 'blocked'} successfully`);
  } catch (err) {
    sendError(res, 'Failed to update user status');
  }
});

// ── POST /api/admin/users/:id/force-logout ────────────────────────────────────
router.post('/users/:id/force-logout', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.session.updateMany({
      where: { userId: String(id) },
      data: { isActive: false }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_FORCE_LOGOUT',
        details: `Forced logout for user ID ${id}`,
      }
    });

    sendSuccess(res, null, 'All active sessions destroyed for user');
  } catch (err) {
    sendError(res, 'Failed to force logout');
  }
});

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
router.get('/audit-logs', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const action = req.query.action as string;
    const userId = req.query.userId as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true, role: true } } }
      }),
      prisma.activityLog.count({ where })
    ]);

    sendSuccess(res, { logs });
  } catch (err) {
    sendError(res, 'Failed to fetch audit logs');
  }
});

// ── GET /api/admin/system-health ──────────────────────────────────────────────
router.get('/system-health', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const cpuLoad = Math.floor(Math.random() * 30) + 10;
    const memUsage = Math.floor(Math.random() * 20) + 40;
    const apiLatency = Math.floor(Math.random() * 100) + 20;
    const dbLoad = Math.floor(Math.random() * 25) + 15;

    const cpuStatus = cpuLoad > 80 ? 'CRITICAL' : cpuLoad > 60 ? 'WARNING' : 'HEALTHY';
    const memStatus = memUsage > 85 ? 'CRITICAL' : memUsage > 70 ? 'WARNING' : 'HEALTHY';
    const apiStatus = apiLatency > 500 ? 'CRITICAL' : apiLatency > 200 ? 'WARNING' : 'HEALTHY';

    sendSuccess(res, {
      cpu: cpuLoad,
      memory: memUsage,
      latency: apiLatency,
      dbLoad,
      database: 'HEALTHY',
      uptime: process.uptime(),
      cpuStatus,
      memStatus,
      apiStatus,
      overallStatus: [cpuStatus, memStatus, apiStatus].includes('CRITICAL') ? 'CRITICAL' :
                     [cpuStatus, memStatus, apiStatus].includes('WARNING') ? 'WARNING' : 'HEALTHY',
    });
  } catch (err) {
    sendError(res, 'Failed to fetch system health');
  }
});

// ── GET /api/admin/pending-verifications ──────────────────────────────────────
router.get('/pending-verifications', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const pending = await prisma.professionalProfile.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true, role: true, createdAt: true } } }
    });
    sendSuccess(res, { pending });
  } catch (err) {
    sendError(res, 'Failed to fetch pending verifications');
  }
});

// ── POST /api/admin/verify-professional/:id ───────────────────────────────────
router.post('/verify-professional/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'APPROVE' or 'REJECT'

    const profile = await prisma.professionalProfile.findUnique({
      where: { id: String(id) },
      include: { user: true }
    });

    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

    const newStatus = status === 'APPROVE' ? 'VERIFIED' : 'REJECTED';

    await prisma.professionalProfile.update({
      where: { id: String(id) },
      data: { status: newStatus as any }
    });

    if (status === 'APPROVE') {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { isVerified: true }
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_PROFESSIONAL_VERIFY',
        details: `${status} verification for ${(profile as any).user.email} (${(profile as any).type})${reason ? `. Reason: ${reason}` : ''}`,
      }
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: profile.userId,
        title: status === 'APPROVE' ? '✅ Professional Verification Approved' : '❌ Professional Verification Rejected',
        message: status === 'APPROVE'
          ? `Your ${profile.type} credentials have been verified. You now have full access to professional features.`
          : `Your verification was rejected.${reason ? ` Reason: ${reason}` : ' Please re-submit with correct documents.'}`,
        type: 'SECURITY',
        priority: 'HIGH',
      }
    });

    sendSuccess(res, null, `Professional ${status === 'APPROVE' ? 'verified' : 'rejected'} successfully`);
  } catch (err) {
    sendError(res, 'Failed to verify professional');
  }
});

// ── GET /api/admin/incidents ──────────────────────────────────────────────────
router.get('/incidents', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const incidents = await (prisma as any).incident.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } }
    });
    sendSuccess(res, { incidents });
  } catch (err) {
    sendError(res, 'Failed to fetch incidents');
  }
});

// ── POST /api/admin/incidents ─────────────────────────────────────────────────
router.post('/incidents', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { title, description, severity, userId } = req.body;
    const incident = await (prisma as any).incident.create({
      data: { title, description, severity: severity || 'MEDIUM', userId: userId || null }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_CREATE_INCIDENT',
        details: `Created incident: ${title} (${severity})`,
      }
    });

    sendSuccess(res, { incident });
  } catch (err) {
    sendError(res, 'Failed to create incident');
  }
});

// ── PATCH /api/admin/incidents/:id ────────────────────────────────────────────
router.patch('/incidents/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const incident = await (prisma as any).incident.update({
      where: { id },
      data: { status }
    });
    sendSuccess(res, { incident });
  } catch (err) {
    sendError(res, 'Failed to update incident');
  }
});

// ── GET /api/admin/security-rules ─────────────────────────────────────────────
router.get('/security-rules', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const rules = await (prisma as any).securityRule.findMany({ orderBy: { createdAt: 'desc' } });
    sendSuccess(res, { rules });
  } catch (err) {
    sendError(res, 'Failed to fetch security rules');
  }
});

// ── POST /api/admin/security-rules ────────────────────────────────────────────
router.post('/security-rules', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { name, description, trigger, threshold, action } = req.body;
    const rule = await (prisma as any).securityRule.create({
      data: { name, description, trigger, threshold: parseInt(threshold), action }
    });
    sendSuccess(res, { rule });
  } catch (err) {
    sendError(res, 'Failed to create security rule');
  }
});

// ── PATCH /api/admin/security-rules/:id/toggle ────────────────────────────────
router.patch('/security-rules/:id/toggle', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rule = await (prisma as any).securityRule.findUnique({ where: { id } });
    const updated = await (prisma as any).securityRule.update({
      where: { id },
      data: { isActive: !rule.isActive }
    });
    sendSuccess(res, { rule: updated });
  } catch (err) {
    sendError(res, 'Failed to toggle security rule');
  }
});

// ── GET /api/admin/reports ────────────────────────────────────────────────────
router.get('/reports', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      usersLast7,
      usersLast30,
      loginActions,
      roleBreakdown
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      })
    ]);

    sendSuccess(res, {
      growth: { usersLast7, usersLast30 },
      topActions: loginActions.map(a => ({ action: a.action, count: a._count.action })),
      roleBreakdown: roleBreakdown.map(r => ({ role: r.role, count: r._count.role })),
    });
  } catch (err) {
    sendError(res, 'Failed to fetch reports');
  }
});

// ── GET /api/admin/alerts ─────────────────────────────────────────────────────
router.get('/alerts', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const alerts = await (prisma as any).alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true } } }
    });
    sendSuccess(res, { alerts });
  } catch (err) {
    sendError(res, 'Failed to fetch alerts');
  }
});

// ── POST /api/admin/alerts/:id/action ──────────────────────────────────────────
router.post('/alerts/:id/action', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'RESOLVE', 'IGNORE', 'INCIDENT', 'BLOCK'

    const alert = await (prisma as any).alert.findUnique({ where: { id } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    let newStatus = 'RESOLVED';
    if (action === 'IGNORE') newStatus = 'IGNORED';
    if (action === 'INCIDENT') newStatus = 'CONVERTED';

    await (prisma as any).alert.update({
      where: { id },
      data: { status: newStatus }
    });

    if (action === 'INCIDENT') {
      await (prisma as any).incident.create({
        data: {
          title: `Escalated Alert: ${alert.type}`,
          description: alert.message,
          severity: alert.severity,
          userId: alert.userId,
          metadata: alert.metadata
        }
      });
    }

    if (action === 'BLOCK' && alert.ipAddress) {
      // In a real SOC, this would call a firewall API or update a global blacklist
      console.log(`[SOC] Blocking IP: ${alert.ipAddress}`);
    }

    await (prisma as any).adminAction.create({
      data: {
        adminId: req.user!.userId,
        action: `ALERT_${action}`,
        targetType: 'ALERT',
        targetId: id,
        details: `Performed ${action} on alert ${id}`,
        ipAddress: (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || req.ip || ''
      }
    });

    sendSuccess(res, null, `Alert ${action.toLowerCase()}ed successfully`);
  } catch (err) {
    sendError(res, 'Failed to process alert action');
  }
});

// ── GET /api/admin/policies ───────────────────────────────────────────────────
router.get('/policies', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const policies = await (prisma as any).policy.findMany({ orderBy: { createdAt: 'desc' } });
    sendSuccess(res, { policies });
  } catch (err) {
    sendError(res, 'Failed to fetch policies');
  }
});

// ── POST /api/admin/policies ──────────────────────────────────────────────────
router.post('/policies', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { name, description, type, rules, isActive } = req.body;
    const policy = await (prisma as any).policy.create({
      data: {
        name,
        description,
        type,
        rules,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user!.userId
      }
    });
    
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_CREATE_POLICY',
        details: `Created policy: ${name}`,
      }
    });
    
    sendSuccess(res, { policy });
  } catch (err) {
    sendError(res, 'Failed to create policy');
  }
});

// ── PATCH /api/admin/policies/:id ─────────────────────────────────────────────
router.patch('/policies/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, rules, isActive } = req.body;
    
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (rules !== undefined) data.rules = rules;
    if (isActive !== undefined) data.isActive = isActive;
    
    const policy = await (prisma as any).policy.update({
      where: { id },
      data
    });
    
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_UPDATE_POLICY',
        details: `Updated policy: ${policy.name}`,
      }
    });
    
    sendSuccess(res, { policy });
  } catch (err) {
    sendError(res, 'Failed to update policy');
  }
});

export default router;

