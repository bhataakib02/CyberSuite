import cron from 'node-cron';
import prisma from '../lib/prisma';
import { sendEmail, sendSMS, sendWhatsApp } from '../lib/messenger';
import { getIo, getOnlineUserSocketId } from '../modules/chat/chat.socket';

export function startCronJobs() {
  // Run daily at 9am — check for warranties expiring within 30 days
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Checking expiring warranties...');
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiring = await prisma.warranty.findMany({
      where: {
        expiryDate: { lte: in30, gte: now },
        notified: false,
      },
      include: { user: true }
    });

    for (const w of expiring) {
      const title = 'Warranty Expiring Soon';
      const message = `Your warranty for "${w.productName}" expires on ${w.expiryDate.toLocaleDateString()}. Protocol: Renew or backup documentation.`;
      
      if (w.user.notifyApp) {
        const notification = await prisma.notification.create({
          data: {
            userId: w.userId,
            title,
            message,
            type: 'WARRANTY',
            priority: 'MEDIUM'
          }
        });

        // Real-time push
        const io = getIo();
        const socketId = getOnlineUserSocketId(w.userId);
        if (io && socketId) {
          io.to(socketId).emit('notification:new', notification);
        }
      }
      
      // Send external notifications
      if (w.user.notifyEmail && w.user.email) {
        await sendEmail(w.user.email, title, `<p>${message}</p>`);
      }
      if (w.user.phoneNumber) {
          if (w.user.notifySMS) await sendSMS(w.user.phoneNumber, `${title}: ${message}`);
          if (w.user.notifyWhatsApp) await sendWhatsApp(w.user.phoneNumber, `${title}: ${message}`);
      }

      await prisma.warranty.update({ where: { id: w.id }, data: { notified: true } });
    }
  });

  // Run every 15 minutes — check for active reminders (Medical, EMI, Medicines)
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Checking active reminders...');
    const now = new Date();
    const soon = new Date(now.getTime() + 20 * 60 * 1000); // Remind 20 mins early

    const reminders = await prisma.reminder.findMany({
      where: {
        remindAt: { lte: soon, gte: now },
        isActive: true,
      },
      include: { user: true }
    });

    for (const r of reminders) {
      const title = `Reminder: ${r.title}`;
      const message = r.description || `It is time for your ${r.category.toLowerCase()} protocol.`;

      if (r.user.notifyApp) {
        const notification = await prisma.notification.create({
          data: {
            userId: r.userId,
            title,
            message,
            type: r.category,
            priority: 'HIGH'
          }
        });

        // Real-time push
        const io = getIo();
        const socketId = getOnlineUserSocketId(r.userId);
        if (io && socketId) {
          io.to(socketId).emit('notification:new', notification);
        }
      }

      // Send external notifications
      if (r.user.notifyEmail && r.user.email) {
        await sendEmail(r.user.email, title, `<p>${message}</p>`);
      }
      if (r.user.phoneNumber) {
          if (r.user.notifySMS) await sendSMS(r.user.phoneNumber, `${title}: ${message}`);
          if (r.user.notifyWhatsApp) await sendWhatsApp(r.user.phoneNumber, `${title}: ${message}`);
      }

      await prisma.reminder.update({ where: { id: r.id }, data: { isActive: false } });
    }
  });

  // Run hourly — clean up expired self-destruct messages
  cron.schedule('0 * * * *', async () => {
    const deleted = await prisma.message.deleteMany({
      where: { selfDestruct: true, destructAt: { lte: new Date() } },
    });
    if (deleted.count > 0) {
      console.log(`[Cron] Cleaned ${deleted.count} self-destruct messages`);
    }
  });

  // Run hourly — clean expired doctor accesses
  cron.schedule('30 * * * *', async () => {
    const deleted = await prisma.doctorAccess.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    if (deleted.count > 0) {
      console.log(`[Cron] Removed ${deleted.count} expired doctor accesses`);
    }
  });

  // Run daily at 10am — check for subscriptions due in 3 days
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron] Checking upcoming subscriptions...');
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        nextBilling: { lte: in3Days, gte: now },
        remindMe: true,
      },
      include: { user: true }
    });

    for (const s of subscriptions) {
      const title = 'Upcoming Subscription Charge';
      const message = `Your subscription for "${s.name}" (${s.amount} ${s.currency}) is due on ${s.nextBilling.toLocaleDateString()}.`;

      if (s.user.notifyApp) {
        const notification = await prisma.notification.create({
          data: {
            userId: s.userId,
            title,
            message,
            type: 'FINANCE',
            priority: 'HIGH'
          }
        });

        const io = getIo();
        const socketId = getOnlineUserSocketId(s.userId);
        if (io && socketId) {
          io.to(socketId).emit('notification:new', notification);
        }
      }

      if (s.user.notifyEmail && s.user.email) {
        await sendEmail(s.user.email, title, `<p>${message}</p>`);
      }
    }
  });

  // Run daily at 11am — check for inactive users (Legacy Transfer)
  cron.schedule('0 11 * * *', async () => {
    console.log('[Cron] Checking for inactive users (Legacy Protocol)...');
    
    // Users who haven't been active for their specified duration
    // We check users where lastActiveAt + legacyInactivityDays < now
    const users = await prisma.user.findMany({
      include: { trustedContacts: true }
    });

    const now = new Date();

    for (const u of users) {
      const threshold = new Date(u.lastActiveAt.getTime() + u.legacyInactivityDays * 24 * 60 * 60 * 1000);
      
      if (now > threshold && u.trustedContacts.length > 0) {
        console.log(`[Legacy] Protocol initiated for user: ${u.email}`);
        
        for (const contact of u.trustedContacts) {
          if (!contact.accessGranted) {
            const title = 'CyberSuite Legacy Notification';
            const message = `The digital legacy protocol for ${u.name} has reached its inactivity threshold. You are a designated legacy contact. Please contact CyberSuite security to initiate the formal access request.`;
            
            await sendEmail(contact.email, title, `<p>${message}</p>`);
            
            // Optionally create a notification for the system/admin
            await prisma.notification.create({
              data: {
                userId: u.id,
                title: 'Legacy Protocol Initiated',
                message: `Legacy contacts have been notified due to ${u.legacyInactivityDays} days of inactivity.`,
                type: 'SECURITY',
                priority: 'CRITICAL'
              }
            });
          }
        }
      }
    }
  });

  console.log('[Cron] Jobs scheduled');
}
