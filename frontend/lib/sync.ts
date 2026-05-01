import { apiFetch, ApiResponse } from './api';
import { db } from './db';

interface SyncItem {
  id: string;
  category: string;
  encryptedData: string;
  createdAt: string;
}

interface SyncFile {
  id: string;
  fileName: string;
  category: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export async function syncVault() {
  try {
    const res = await apiFetch('/vault');
    const data: ApiResponse<{ entries: SyncItem[] }> = await res.json();
    if (res.ok && data.success) {
      await db.vault.clear();
      const items = data.data?.entries || [];
      if (items.length > 0) {
        await db.vault.bulkPut(items.map((item: SyncItem) => ({
          id: item.id,
          category: item.category,
          encryptedData: item.encryptedData,
          updatedAt: item.createdAt
        })));
      }
    }
  } catch (err) {
    console.error('Vault sync failed', err);
  }
}

export async function syncMedical() {
  try {
    const res = await apiFetch('/medical/records');
    const data: ApiResponse<{ records: SyncItem[] }> = await res.json();
    if (res.ok && data.success) {
      await db.medical.clear();
      const records = data.data?.records || [];
      if (records.length > 0) {
        await db.medical.bulkPut(records.map((record: SyncItem) => ({
          id: record.id,
          category: record.category,
          encryptedData: record.encryptedData,
          updatedAt: record.createdAt
        })));
      }
    }
  } catch (err) {
    console.error('Medical sync failed', err);
  }
}

export async function syncFiles() {
  try {
    const res = await apiFetch('/files');
    const data: ApiResponse<{ files: SyncFile[] }> = await res.json();
    if (res.ok && data.success) {
      await db.files.clear();
      const files = data.data?.files || [];
      if (files.length > 0) {
        await db.files.bulkPut(files.map((file: SyncFile) => ({
          id: file.id,
          fileName: file.fileName,
          category: file.category,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          updatedAt: file.createdAt
        })));
      }
    }
  } catch (err) {
    console.error('Files sync failed', err);
  }
}

export async function syncAll() {
  if (typeof window !== 'undefined' && navigator.onLine) {
    await Promise.all([syncVault(), syncMedical(), syncFiles()]);
    console.log('All data synchronized for offline use.');
  }
}
