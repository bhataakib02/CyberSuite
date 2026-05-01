import Dexie, { type Table } from 'dexie';
import { aesEncrypt, aesDecrypt } from '../crypto';

export interface OfflineVaultEntry {
  id: string;
  category: string;
  encryptedData: string;
  strength: number;
  updatedAt: number;
}

export class OfflineVaultDB extends Dexie {
  entries!: Table<OfflineVaultEntry>;

  constructor() {
    super('CyberSuiteOfflineVault');
    this.version(1).stores({
      entries: 'id, category, updatedAt'
    });
  }

  /**
   * Sync remote entries to local IndexedDB
   */
  async syncRemoteEntries(remoteEntries: any[]) {
    const localEntries = remoteEntries.map(entry => ({
      id: entry.id,
      category: entry.category,
      encryptedData: entry.encryptedData,
      strength: entry.strength,
      updatedAt: Date.now()
    }));

    await this.entries.bulkPut(localEntries);
  }

  /**
   * Get all local entries
   */
  async getAllEntries(): Promise<OfflineVaultEntry[]> {
    return await this.entries.toArray();
  }

  /**
   * Clear all local data (on logout)
   */
  async clearVault() {
    await this.entries.clear();
  }
}

export const offlineVault = new OfflineVaultDB();
