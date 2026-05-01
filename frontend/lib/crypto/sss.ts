import secrets from 'secrets.js-grempe';

/**
 * CyberSuite Legacy 2.0 - Shamir's Secret Sharing
 * Used to shard a master key across trusted contacts.
 */
export class SSSService {
  /**
   * Split a secret into N shares, requiring T shares to reconstruct.
   */
  static shardSecret(secret: string, totalShares: number, threshold: number): string[] {
    if (threshold > totalShares) throw new Error('Threshold cannot be greater than total shares');
    
    // Convert secret to hex string
    const secretHex = secrets.str2hex(secret);
    const shares = secrets.share(secretHex, totalShares, threshold);
    
    return shares;
  }

  /**
   * Reconstruct a secret from a list of shares.
   */
  static combineShares(shares: string[]): string {
    const combinedHex = secrets.combine(shares);
    const secret = secrets.hex2str(combinedHex);
    return secret;
  }
}
