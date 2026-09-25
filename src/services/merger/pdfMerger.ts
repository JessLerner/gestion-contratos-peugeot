/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument } from 'pdf-lib';
import { NormalizedOperationData, ProcessedDocument, ValidationItem } from '../../types/operation';
import { CoverGenerator } from '../templates/portada/coverGenerator';
import { MinutaGenerator } from '../templates/minuta/minutaGenerator';
import { RendicionGenerator } from '../templates/rendicion/rendicionGenerator';

export class PdfMerger {
  /**
   * Merges Portada + Minuta + Planilla + Original Documents (PDFs & Images) into a single consolidated PDF document.
   */
  public static async generateConsolidatedPdf(
    data: NormalizedOperationData,
    documents: ProcessedDocument[],
    validations: ValidationItem[],
    onProgress?: (step: string, progress: number) => void,
  ): Promise<{ pdfBytes: Uint8Array; filename: string }> {
    onProgress?.('Iniciando consolidación de expediente...', 5);
    const finalDoc = await PDFDocument.create();

    // 1. Generate & Append Cover Page
    onProgress?.('Generando portada y resumen de operación...', 15);
    const coverBytes = await CoverGenerator.generateCover(data, documents, validations);
    const coverDoc = await PDFDocument.load(coverBytes);
    const [coverPage] = await finalDoc.copyPages(coverDoc, [0]);
    finalDoc.addPage(coverPage);

    // 2. Generate & Append Minuta de Ventas 2026
    onProgress?.('Generando Minuta de Ventas 2026...', 35);
    const minutaBytes = await MinutaGenerator.generateMinuta(data);
    const minutaDoc = await PDFDocument.load(minutaBytes);
    const [minutaPage] = await finalDoc.copyPages(minutaDoc, [0]);
    finalDoc.addPage(minutaPage);

    // 3. Generate & Append Planilla de Rendición Peugeot
    onProgress?.('Generando Planilla de Rendición Peugeot...', 55);
    const rendicionBytes = await RendicionGenerator.generateRendicionPdf(data);
    const rendicionDoc = await PDFDocument.load(rendicionBytes);
    const [rendicionPage] = await finalDoc.copyPages(rendicionDoc, [0]);
    finalDoc.addPage(rendicionPage);

    // 4. Append Original Documents
    const totalDocs = documents.length;
    for (let i = 0; i < totalDocs; i++) {
      const doc = documents[i];
      const percent = 55 + Math.round(((i + 1) / totalDocs) * 40);
      onProgress?.(`Incorporando documento original (${i + 1}/${totalDocs}): ${doc.name}`, percent);

      try {
        if (doc.mimeType === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf')) {
          const loadedDoc = await PDFDocument.load(doc.binaryData, { ignoreEncryption: true });
          const pageIndices = loadedDoc.getPageIndices();
          const copiedPages = await finalDoc.copyPages(loadedDoc, pageIndices);
          copiedPages.forEach((p) => finalDoc.addPage(p));
        } else if (
          doc.mimeType.startsWith('image/') ||
          doc.name.toLowerCase().endsWith('.jpg') ||
          doc.name.toLowerCase().endsWith('.jpeg') ||
          doc.name.toLowerCase().endsWith('.png')
        ) {
          // Convert image to a high-resolution A4 PDF page without distortion
          const isPng = doc.mimeType === 'image/png' || doc.name.toLowerCase().endsWith('.png');
          const embeddedImage = isPng
            ? await finalDoc.embedPng(doc.binaryData)
            : await finalDoc.embedJpg(doc.binaryData);

          const imgDims = embeddedImage.scale(1);
          // Standard A4 portrait: 595.28 x 841.89
          const a4Width = 595.28;
          const a4Height = 841.89;
          const margin = 36; // 0.5 inch margin

          const maxWidth = a4Width - margin * 2;
          const maxHeight = a4Height - margin * 2;

          // Calculate aspect ratio fit
          const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height, 1);
          const scaledWidth = imgDims.width * scale;
          const scaledHeight = imgDims.height * scale;

          const imgPage = finalDoc.addPage([a4Width, a4Height]);
          // Center image on the page
          const xPos = (a4Width - scaledWidth) / 2;
          const yPos = (a4Height - scaledHeight) / 2;

          imgPage.drawImage(embeddedImage, {
            x: xPos,
            y: yPos,
            width: scaledWidth,
            height: scaledHeight,
          });
        }
      } catch (err) {
        console.error(`Error al incorporar documento ${doc.name} al PDF final:`, err);
        // Do not crash the entire process, continue with remaining documents
      }
    }

    onProgress?.('Guardando PDF unificado...', 98);
    const pdfBytes = await finalDoc.save();

    const filename = this.generateFilename(data);
    onProgress?.('¡PDF consolidado generado con éxito!', 100);

    return { pdfBytes, filename };
  }

  /**
   * Generates sanitized standard filename: DOCUMENTACION_[SOLICITUD]_[TITULAR].pdf
   */
  public static generateFilename(data: NormalizedOperationData): string {
    const rawSol = data.solicitud.value || data.sx.value || 'SIN_SOLICITUD';
    const rawTit = data.titular.value || data.cliente.value || 'SIN_TITULAR';

    const cleanSol = rawSol.replace(/[^A-Za-z0-9_-]/g, '').trim() || 'SOLICITUD';
    const cleanTit = rawTit
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'TITULAR';

    return `DOCUMENTACION_${cleanSol}_${cleanTit}.pdf`;
  }
}
