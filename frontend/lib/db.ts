import Dexie, { Table } from 'dexie';

export interface OfflineVaultItem {
  id: string;
  category: string;
  encryptedData: string;
  updatedAt: string;
}

export interface OfflineMedicalRecord {
  id: string;
  category: string;
  encryptedData: string;
  updatedAt: string;
}

export interface OfflineFileRecord {
  id: string;
  fileName: string;
  category: string;
  mimeType: string;
  fileSize: number;
  updatedAt: string;
}

export class CyberSuiteDB extends Dexie {
  vault!: Table<OfflineVaultItem>;
  medical!: Table<OfflineMedicalRecord>;
  files!: Table<OfflineFileRecord>;

  constructor() {
    super('CyberSuiteDB');
    this.version(1).stores({
      vault: 'id, category, updatedAt',
      medical: 'id, category, updatedAt',
      files: 'id, category, fileName, updatedAt'
    });
  }
}

export const db = new CyberSuiteDB();
