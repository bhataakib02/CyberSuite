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

    if (!user || !user.allowedCountries || user.allowedCountries.length === 0 || user.allowedCountries.includes('*')) {
      return next();
    }

    const clientIp = req.ip;

    // Allow local/dev access
    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      return next();
    }

    try {
      const { data } = await axios.get(`http://ip-api.com/json/${clientIp}?fields=countryCode`, { timeout: 3000 });
      if (data?.countryCode && !user.allowedCountries.includes(data.countryCode)) {
        return res.status(403).json({ error: 'Access denied from this location.' });
      }
    } catch {
      // Geo lookup failed — fail-open
      console.warn(`Geo-fence: Could not lookup IP ${clientIp}. Allowing access.`);
    }

    next();
  } catch (err) {
    console.error('Geo-fence error:', err);
    next();
  }
}
