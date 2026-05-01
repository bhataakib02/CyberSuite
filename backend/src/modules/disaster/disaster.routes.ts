import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// Mock Disaster Data - In a real app, this would fetch from a National Weather/Disaster API
const MOCK_ALERTS: any[] = [];

// ── GET /api/disaster/alerts ─────────────────────────────────────────────────
router.get('/alerts', async (req, res) => {
  try {
    // In production, fetch from external API and filter by user location
    sendSuccess(res, { alerts: MOCK_ALERTS });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch disaster alerts');
  }
});

// ── POST /api/disaster/sos ───────────────────────────────────────────────────
router.post('/sos', authenticate, async (req: AuthRequest, res) => {
  try {
    const { location, message } = req.body;
    
    // Broadcast SOS to all emergency contacts
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { trustedContacts: true }
    });

    if (user) {
      // Logic to send urgent SMS/Email to all legacy/emergency contacts
      console.log(`[SOS] User ${user.name} sent SOS from ${JSON.stringify(location)}: ${message}`);
      
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'SOS_TRIGGERED',
          details: `SOS sent to ${user.trustedContacts.length} contacts.`
        }
      });
    }

    sendSuccess(res, null, 'SOS broadcasted to emergency network.');
  } catch (err) {
    console.error(err);
    sendError(res, 'SOS broadcast failed');
  }
});

export default router;
