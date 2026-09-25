/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

export interface UnpackedFile {
  name: string;
  relativePath: string;
  size: number;
  mimeType: string;
  data: Uint8Array;
}

export class ZipExtractor {
  private static readonly MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100 MB max
  private static readonly MAX_FILES_COUNT = 150;
  private static readonly ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

  /**
   * Unpacks a ZIP file safely, preventing Zip Slip and ignoring system junk files.
   */
  public static async extractZip(zipBuffer: ArrayBuffer | Uint8Array): Promise<UnpackedFile[]> {
    if (zipBuffer.byteLength > this.MAX_ZIP_SIZE) {
      throw new Error(`El archivo ZIP supera el límite permitido de ${this.MAX_ZIP_SIZE / (1024 * 1024)}MB.`);
    }

    const zip = new JSZip();
    let loadedZip: JSZip;
    try {
      loadedZip = await zip.loadAsync(zipBuffer);
    } catch {
      throw new Error('No se pudo abrir el archivo ZIP. Asegúrese de que no esté corrupto ni protegido con contraseña.');
    }

    const entries = Object.keys(loadedZip.files);
    if (entries.length === 0) {
      throw new Error('El archivo ZIP está vacío.');
    }

    const unpacked: UnpackedFile[] = [];
    let fileCount = 0;

    for (const relativePath of entries) {
      // Security: Check for directory traversal / Zip Slip
      if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
        continue; // skip dangerous paths
      }

      const zipEntry = loadedZip.files[relativePath];
      if (zipEntry.dir) {
        continue;
      }

      // Filter out macOS metadata and Windows thumbnail artifacts
      const cleanPath = relativePath.replace(/\\/g, '/');
      const filename = cleanPath.split('/').pop() || '';

      if (
        cleanPath.startsWith('__MACOSX/') ||
        cleanPath.includes('/__MACOSX/') ||
        filename.startsWith('._') ||
        filename === '.DS_Store' ||
        filename.toLowerCase() === 'thumbs.db' ||
        filename === 'desktop.ini'
      ) {
        continue;
      }

      // Check allowed extensions
      const lowerName = filename.toLowerCase();
      const hasValidExt = this.ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      if (!hasValidExt) {
        continue;
      }

      fileCount++;
      if (fileCount > this.MAX_FILES_COUNT) {
        throw new Error(`El ZIP contiene demasiados archivos (máximo permitido: ${this.MAX_FILES_COUNT}).`);
      }

      const uint8 = await zipEntry.async('uint8array');
      const mimeType = this.detectMimeType(filename, uint8);

      unpacked.push({
        name: filename,
        relativePath: cleanPath,
        size: uint8.byteLength,
        mimeType,
        data: uint8,
      });
    }

    if (unpacked.length === 0) {
      throw new Error('No se encontraron documentos válidos (PDF, JPG, PNG) dentro del archivo ZIP.');
    }

    // Sort by name for deterministic order
    unpacked.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return unpacked;
  }

  public static detectMimeType(filename: string, bytes?: Uint8Array): string {
    const lower = filename.toLowerCase();
    if (bytes && bytes.length >= 4) {
      // Check magic numbers
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return 'application/pdf'; // %PDF
      }
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'image/jpeg';
      }
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return 'image/png';
      }
    }

    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';

    return 'application/octet-stream';
  }
}
