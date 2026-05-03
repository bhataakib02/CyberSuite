import { Request, Response, NextFunction } from 'express';
import { SentinelService } from '../modules/sentinel/sentinel.service';

const HONEYPOT_PATHS = [
  '/wp-admin',
  '/wp-login.php',
  '/.env',
  '/config.php',
  '/admin/config.php',
  '/api/.env',
  '/.git/config',
  '/phpmyadmin',
  '/xmlrpc.php'
];

/**
 * Honeypot Middleware
 * Traps bot scrapers and malicious scanners.
 */
export function honeypot(req: Request, res: Response, next: NextFunction) {
  const path = req.path.toLowerCase();
  
  if (HONEYPOT_PATHS.some(p => path.startsWith(p))) {
    const ip = (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || req.ip || 'unknown';
    
    console.warn(`[Honeypot] Malicious scan detected from ${ip} targeting ${path}`);
    
    // Trigger a CRITICAL alert in Sentinel
    SentinelService.triggerAlert({
      type: 'HONEYPOT_TRAP_HIT',
      severity: 'CRITICAL',
      message: `Source ${ip} attempted to access restricted shadow path: ${path}`,
      ipAddress: ip,
      metadata: { 
        path, 
        userAgent: req.headers['user-agent'],
        method: req.method
      }
    }).catch(err => console.error('Honeypot alert failed', err));

    // Return a fake 404 or just hang for a bit (tarpitting)
    return res.status(404).send('Not Found');
  }

  next();
}
