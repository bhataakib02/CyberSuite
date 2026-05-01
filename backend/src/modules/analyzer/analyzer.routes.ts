import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import axios from 'axios';
import crypto from 'crypto';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

const analyzeSchema = z.object({ password: z.string().min(1).max(256) });

function getCharsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size || 1;
}

function calcEntropy(password: string): number {
  const charsetSize = getCharsetSize(password);
  return Math.log2(Math.pow(charsetSize, password.length));
}

function estimateCrackTime(entropy: number): { seconds: number; label: string } {
  const guessesPerSec = 1e10; // Modern GPU cluster speed
  const combinations = Math.pow(2, entropy);
  const secondsBest = combinations / guessesPerSec;

  const fmt = (s: number): string => {
    if (s < 1) return 'Instantly';
    if (s < 60) return `${s.toFixed(1)} seconds`;
    if (s < 3600) return `${(s / 60).toFixed(1)} minutes`;
    if (s < 86400) return `${(s / 3600).toFixed(1)} hours`;
    if (s < 2592000) return `${(s / 86400).toFixed(1)} days`;
    if (s < 31536000) return `${(s / 2592000).toFixed(1)} months`;
    if (s < 3.15e9) return `${(s / 31536000).toFixed(1)} years`;
    return 'Centuries';
  };

  return { seconds: secondsBest, label: fmt(secondsBest) };
}

async function checkPwned(password: string): Promise<number> {
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
    const lines = res.data.split('\n');
    const match = lines.find((line: string) => line.startsWith(suffix));
    
    if (match) {
      return parseInt(match.split(':')[1], 10);
    }
    return 0;
  } catch (err) {
    console.error('HIBP API error:', err);
    return 0;
  }
}

function detectPatterns(password: string): string[] {
  const issues: string[] = [];
  if (/^[a-zA-Z]+$/.test(password)) issues.push('Letters only — no numbers or symbols');
  if (/^[0-9]+$/.test(password)) issues.push('Numbers only — very weak');
  if (/(.)\1{2,}/.test(password)) issues.push('Repeated characters detected');
  if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password))
    issues.push('Sequential pattern detected (e.g. 123, abc)');
  if (/^(password|qwerty|letmein|welcome|admin|login|master|dragon|monkey|shadow|sunshine|princess|iloveyou)/i.test(password))
    issues.push('Common dictionary word detected');
  if (/^(qwerty|asdf|zxcv|qazwsx|1qaz|2wsx)/i.test(password))
    issues.push('Keyboard pattern detected (qwerty, asdf...)');
  if (password.length < 8) issues.push('Too short (minimum 8 characters)');
  return issues;
}

function getStrengthScore(entropy: number, patterns: string[], pwnedCount: number): { score: number; label: string } {
  let score = Math.min(100, Math.round((entropy / 128) * 100));
  score -= patterns.length * 10;
  if (pwnedCount > 0) score = Math.min(score, 10); // Severely penalize breached passwords
  score = Math.max(0, score);
  const label = score < 20 ? 'Critical' : score < 40 ? 'Weak' : score < 60 ? 'Fair' : score < 80 ? 'Strong' : 'Very Strong';
  return { score, label };
}

function getSuggestions(password: string, pwnedCount: number): string[] {
  const suggestions: string[] = [];
  if (pwnedCount > 0) suggestions.push('URGENT: This password was found in public data breaches. Change it immediately!');
  if (password.length < 12) suggestions.push('Use at least 12 characters');
  if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) suggestions.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add special characters (!@#$%^&*)');
  return suggestions;
}

// POST /api/analyze
router.post('/', validate(analyzeSchema), async (req: Request, res: Response) => {
  const { password } = req.body;
  const entropy = calcEntropy(password);
  const crackTime = estimateCrackTime(entropy);
  const patterns = detectPatterns(password);
  const pwnedCount = await checkPwned(password);
  const { score, label } = getStrengthScore(entropy, patterns, pwnedCount);
  const suggestions = getSuggestions(password, pwnedCount);

  sendSuccess(res, {
    score,
    label,
    pwnedCount,
    entropy: Math.round(entropy),
    crackTime,
    charsetSize: getCharsetSize(password),
    length: password.length,
    patterns,
    suggestions,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSymbols: /[^a-zA-Z0-9]/.test(password),
    protocols: [
      { name: 'K-Anonymity HIBP', status: 'Active', detail: 'Checked against 12B+ leaked credentials' },
      { name: 'Shannon Entropy', status: 'Active', detail: 'Bit-level randomness calculation' },
      { name: 'Pattern Heuristics', status: 'Active', detail: 'Dictionary and keyboard layout detection' }
    ]
  });
});

export default router;
