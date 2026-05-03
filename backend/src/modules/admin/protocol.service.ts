import { getIo } from '../chat/chat.socket';

export type SystemProtocol = 'NORMAL' | 'MAINTENANCE' | 'LOCKDOWN' | 'STEALTH';

export class ProtocolService {
  private static currentProtocol: SystemProtocol = 'NORMAL';
  private static protocolReason: string = 'System operating under normal parameters.';
  private static updatedBy: string = 'SYSTEM';
  private static updatedAt: Date = new Date();
  private static autoMitigation: boolean = true;

  static getProtocol() {
    return {
      protocol: this.currentProtocol,
      reason: this.protocolReason,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt,
      autoMitigation: this.autoMitigation
    };
  }

  static setProtocol(protocol: SystemProtocol, reason: string, adminId: string) {
    this.currentProtocol = protocol;
    this.protocolReason = reason;
    this.updatedBy = adminId;
    this.updatedAt = new Date();
    
    console.log(`[Protocol] System state changed to ${protocol} by ${adminId}. Reason: ${reason}`);
    
    // Broadcast to all clients
    const io = getIo();
    if (io) {
      io.emit('protocol:change', this.getProtocol());
    }
    
    return this.getProtocol();
  }

  static setAutoMitigation(enabled: boolean, adminId: string) {
    this.autoMitigation = enabled;
    console.log(`[Protocol] Auto-mitigation ${enabled ? 'ENABLED' : 'DISABLED'} by ${adminId}`);
    
    const io = getIo();
    if (io) io.emit('protocol:change', this.getProtocol());
    
    return this.getProtocol();
  }

  static isLockdown() {
    return this.currentProtocol === 'LOCKDOWN';
  }

  static isMaintenance() {
    return this.currentProtocol === 'MAINTENANCE';
  }

  static isStealth() {
    return this.currentProtocol === 'STEALTH';
  }
}
