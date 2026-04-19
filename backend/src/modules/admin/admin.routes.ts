import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalVaultEntries,
      activeSessions,
      breachChecks,
      threatLogs,
      newSignupsToday,
      failedLoginsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vaultEntry.count(),
      prisma.session.count({ where: { isActive: true } }),
      prisma.activityLog.count({ where: { action: 'BREACH_CHECK' } }),
      prisma.activityLog.findMany({
        where: { action: { in: ['LOGIN_FAILURE', 'UNAUTHORIZED_ACCESS', 'BREACH_FOUND'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.activityLog.count({
        where: { action: 'LOGIN_FAILURE', createdAt: { gte: today } }
      }),
    ]);

    res.json({
      totalUsers,
      totalVaultEntries,
      activeSessions,
      breachChecks,
      recentThreats: threatLogs,
      newSignupsToday,
      failedLoginsToday,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
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

    res.json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
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

    res.json({ message: `User ${newStatus ? 'unblocked' : 'blocked'} successfully`, isActive: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
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

    res.json({ message: 'All active sessions destroyed for user' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to force logout' });
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

    res.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
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

    res.json({
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
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// ── GET /api/admin/pending-verifications ──────────────────────────────────────
router.get('/pending-verifications', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const pending = await prisma.professionalProfile.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true, role: true, createdAt: true } } }
    });
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
});

// ── POST /api/admin/verify-professional/:id ───────────────────────────────────
router.post('/verify-professional/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'APPROVE' or 'REJECT'

    const profile = await prisma.professionalProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

    const newStatus = status === 'APPROVE' ? 'VERIFIED' : 'REJECTED';

    await prisma.professionalProfile.update({
      where: { id },
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
        details: `${status} verification for ${profile.user.email} (${profile.type})${reason ? `. Reason: ${reason}` : ''}`,
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

    res.json({ message: `Professional ${status === 'APPROVE' ? 'verified' : 'rejected'} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify professional' });
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
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
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

    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create incident' });
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
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// ── GET /api/admin/security-rules ─────────────────────────────────────────────
router.get('/security-rules', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const rules = await (prisma as any).securityRule.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch security rules' });
  }
});

// ── POST /api/admin/security-rules ────────────────────────────────────────────
router.post('/security-rules', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { name, description, trigger, threshold, action } = req.body;
    const rule = await (prisma as any).securityRule.create({
      data: { name, description, trigger, threshold: parseInt(threshold), action }
    });
    res.json({ rule });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create security rule' });
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
    res.json({ rule: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle security rule' });
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

    res.json({
      growth: { usersLast7, usersLast30 },
      topActions: loginActions.map(a => ({ action: a.action, count: a._count.action })),
      roleBreakdown: roleBreakdown.map(r => ({ role: r.role, count: r._count.role })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
