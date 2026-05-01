import fs from 'fs';
import crypto from 'crypto';

/**
 * Securely shreds a file by overwriting it with random data before deletion.
 * Implements a basic 3-pass overwrite.
 */
export async function shredFile(filePath: string, passes: number = 3): Promise<void> {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const stats = fs.statSync(filePath);
  const size = stats.size;
  const fd = fs.openSync(filePath, 'r+');

  try {
    for (let i = 0; i < passes; i++) {
      // Create random buffer of same size
      // For very large files, we should do this in chunks, but for vault files it's usually fine
      const buffer = crypto.randomBytes(Math.min(size, 1024 * 1024)); // Max 1MB chunks for safety
      let offset = 0;
      
      while (offset < size) {
        const bytesToWrite = Math.min(buffer.length, size - offset);
        // If the remaining size is less than buffer, we need a smaller random buffer or slice
        const chunk = bytesToWrite === buffer.length ? buffer : crypto.randomBytes(bytesToWrite);
        fs.writeSync(fd, chunk, 0, bytesToWrite, offset);
        offset += bytesToWrite;
      }
      
      // Ensure data is flushed to disk
      fs.fsyncSync(fd);
    }
  } finally {
    fs.closeSync(fd);
  }

  // Final deletion
  fs.unlinkSync(filePath);
}
