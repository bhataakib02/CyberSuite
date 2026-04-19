import { apiFetch } from './api';
import { db } from './db';

export async function syncVault() {
  try {
    const res = await apiFetch('/vault');
    if (res.ok) {
      const data = await res.json();
      await db.vault.clear();
      const items = data.items || [];
      if (items.length > 0) {
        await db.vault.bulkPut(items.map((item: any) => ({
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
    const res = await apiFetch('/medical');
    if (res.ok) {
      const data = await res.json();
      await db.medical.clear();
      const records = data.records || [];
      if (records.length > 0) {
        await db.medical.bulkPut(records.map((record: any) => ({
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
    if (res.ok) {
      const data = await res.json();
      await db.files.clear();
      const files = data.files || [];
      if (files.length > 0) {
        await db.files.bulkPut(files.map((file: any) => ({
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
