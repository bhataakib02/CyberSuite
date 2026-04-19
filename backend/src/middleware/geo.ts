import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../lib/prisma';
import axios from 'axios';

export async function geoFence(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next();

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { allowedCountries: true }
    });

    if (!user || user.allowedCountries.includes('*')) return next();

    // In production, use a library like 'geoip-lite' or a service like IP-API
    // Here we mock the check for demonstration
    const clientIp = req.ip || '127.0.0.1';
    
    // Mocking a check: Assume 127.0.0.1 is always allowed for dev
    if (clientIp === '127.0.0.1' || clientIp === '::1') return next();

    // Actual check would look like this:
    // const geo = await axios.get(`http://ip-api.com/json/${clientIp}`);
    // if (!user.allowedCountries.includes(geo.data.countryCode)) {
    //   return res.status(403).json({ error: 'Access denied from this location.' });
    // }

    next();
  } catch (err) {
    console.error('Geo-fence error:', err);
    next(); // Fail-open to avoid locking users out due to API failures
  }
}
