/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { NormalizedOperationData, ProcessedDocument, ValidationItem } from '../../../types/operation';

export class CoverGenerator {
  /**
   * Generates the official Cover Page (Portada / Resumen de Operación).
   */
  public static async generateCover(
    data: NormalizedOperationData,
    documents: ProcessedDocument[],
    validations: ValidationItem[],
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Color palette - Peugeot Dark Navy & Accent Blue
    const primaryNavy = rgb(0.05, 0.15, 0.35); // #0d2759
    const secondaryBlue = rgb(0.12, 0.45, 0.85); // #1f73d9
    const darkGray = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.93, 0.94, 0.96);
    const borderGray = rgb(0.8, 0.82, 0.85);
    const white = rgb(1, 1, 1);
    const green = rgb(0.1, 0.6, 0.3);
    const red = rgb(0.85, 0.2, 0.2);

    let y = height - 40;

    // Header Bar
    page.drawRectangle({
      x: 35,
      y: y - 55,
      width: width - 70,
      height: 60,
      color: primaryNavy,
    });

    page.drawText('PEUGEOT PLAN DE AHORRO', {
      x: 50,
      y: y - 22,
      size: 11,
      font: fontBold,
      color: white,
    });

    page.drawText('LEGAJO DIGITAL DE OPERACIÓN', {
      x: 50,
      y: y - 42,
      size: 16,
      font: fontBold,
      color: white,
    });

    const todayStr = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    page.drawText(`Fecha emisión: ${todayStr}`, {
      x: width - 200,
      y: y - 32,
      size: 9,
      font: fontRegular,
      color: white,
    });

    y -= 85;

    // Summary Card
    page.drawRectangle({
      x: 35,
      y: y - 130,
      width: width - 70,
      height: 130,
      color: lightGray,
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText('DATOS GENERALES DE LA SUSCRIPCIÓN', {
      x: 50,
      y: y - 20,
      size: 11,
      font: fontBold,
      color: primaryNavy,
    });

    const drawField = (label: string, value: string, xPos: number, yPos: number, isImportant = false) => {
      page.drawText(`${label}:`, {
        x: xPos,
        y: yPos,
        size: 9,
        font: fontBold,
        color: darkGray,
      });
      page.drawText(value || 'No informado', {
        x: xPos + 105,
        y: yPos,
        size: isImportant ? 10 : 9,
        font: isImportant ? fontBold : fontRegular,
        color: isImportant ? primaryNavy : darkGray,
      });
    };

    drawField('N° DE SOLICITUD', data.solicitud.value, 50, y - 42, true);
    drawField('TITULAR', data.titular.value, 50, y - 62, true);
    drawField('DNI / DOC', data.dni.value, 50, y - 82);
    drawField('CUIL / CUIT', data.cuil_cuit.value, 50, y - 102);
    drawField('FECHA VENTA', data.fecha_venta.value, 50, y - 120);

    const col2X = 310;
    drawField('MODELO', data.modelo_vehiculo.value, col2X, y - 42);
    drawField('PLAN', data.modelo_plan.value, col2X, y - 62);
    drawField('VENDEDOR', data.vendedor.value, col2X, y - 82);
    drawField('SUPERVISOR', data.supervisor.value, col2X, y - 102);
    drawField('MONTO ABONADO', data.monto_abonado.value ? `$${data.monto_abonado.value}` : 'No informado', col2X, y - 120, true);

    y -= 155;

    // Table of Documents Included
    page.drawText('DOCUMENTOS ORIGINALES INCLUIDOS EN ESTE LEGAJO', {
      x: 35,
      y: y,
      size: 11,
      font: fontBold,
      color: primaryNavy,
    });

    y -= 20;

    // Table Header
    page.drawRectangle({
      x: 35,
      y: y - 18,
      width: width - 70,
      height: 20,
      color: primaryNavy,
    });

    page.drawText('N°', { x: 42, y: y - 13, size: 8, font: fontBold, color: white });
    page.drawText('NOMBRE DE ARCHIVO', { x: 65, y: y - 13, size: 8, font: fontBold, color: white });
    page.drawText('TIPO CLASIFICADO', { x: 235, y: y - 13, size: 8, font: fontBold, color: white });
    page.drawText('TAMAÑO', { x: 440, y: y - 13, size: 8, font: fontBold, color: white });
    page.drawText('PÁG', { x: 505, y: y - 13, size: 8, font: fontBold, color: white });

    y -= 20;

    // List up to 10-12 documents
    documents.slice(0, 12).forEach((doc, idx) => {
      const isEven = idx % 2 === 0;
      page.drawRectangle({
        x: 35,
        y: y - 16,
        width: width - 70,
        height: 18,
        color: isEven ? white : lightGray,
        borderColor: borderGray,
        borderWidth: 0.5,
      });

      page.drawText(`${idx + 1}`, { x: 42, y: y - 11, size: 8, font: fontRegular, color: darkGray });

      const truncatedName = doc.name.length > 32 ? `${doc.name.substring(0, 29)}...` : doc.name;
      page.drawText(truncatedName, { x: 65, y: y - 11, size: 8, font: fontRegular, color: darkGray });

      const truncatedType = doc.typeLabel.length > 36 ? `${doc.typeLabel.substring(0, 33)}...` : doc.typeLabel;
      page.drawText(truncatedType, { x: 235, y: y - 11, size: 8, font: fontBold, color: secondaryBlue });

      const kb = `${Math.round(doc.size / 1024)} KB`;
      page.drawText(kb, { x: 440, y: y - 11, size: 8, font: fontRegular, color: darkGray });

      page.drawText(`${doc.pagesCount || 1}`, { x: 512, y: y - 11, size: 8, font: fontRegular, color: darkGray });

      y -= 18;
    });

    if (documents.length > 12) {
      page.drawText(`... y ${documents.length - 12} documentos adicionales adjuntos`, {
        x: 45,
        y: y - 10,
        size: 8,
        font: fontRegular,
        color: darkGray,
      });
      y -= 15;
    }

    y -= 25;

    // Cross-Validation Results
    page.drawText('CONTROL DE VALIDACIÓN Y COINCIDENCIA DOCUMENTAL', {
      x: 35,
      y: y,
      size: 11,
      font: fontBold,
      color: primaryNavy,
    });

    y -= 18;

    validations.slice(0, 5).forEach((val) => {
      const isOk = val.status === 'valid';
      const markColor = isOk ? green : val.status === 'error' ? red : secondaryBlue;
      const markText = isOk ? '[OK]' : val.status === 'error' ? '[ALERTA]' : '[INFO]';

      page.drawText(markText, {
        x: 45,
        y: y - 9,
        size: 8,
        font: fontBold,
        color: markColor,
      });

      page.drawText(`${val.title}: ${val.message}`, {
        x: 95,
        y: y - 9,
        size: 8,
        font: fontRegular,
        color: darkGray,
      });

      y -= 16;
    });

    // Footer with security notice and digital seal
    page.drawLine({
      start: { x: 35, y: 55 },
      end: { x: width - 35, y: 55 },
      thickness: 1,
      color: borderGray,
    });

    page.drawText('Expediente generado por Sistema AutoDoc Peugeot. Documentación administrativa consolidada.', {
      x: 35,
      y: 40,
      size: 8,
      font: fontRegular,
      color: darkGray,
    });

    page.drawText('Documento administrativo con trazabilidad verificable.', {
      x: 35,
      y: 28,
      size: 7,
      font: fontRegular,
      color: darkGray,
    });

    return await pdfDoc.save();
  }
}
