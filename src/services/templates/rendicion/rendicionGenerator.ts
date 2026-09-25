/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { NormalizedOperationData } from '../../../types/operation';

export class RendicionGenerator {
  /**
   * Generates the PLANILLA DE RENDICIÓN PEUGEOT PDF in landscape orientation,
   * faithfully reproducing the official spreadsheet design, borders, fonts, formulas, and cells.
   */
  public static async generateRendicionPdf(data: NormalizedOperationData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    // Landscape A4: 841.89 x 595.28 points
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Color palette matching Excel Planilla Peugeot
    const cNavyHeader = rgb(0.08, 0.2, 0.45); // #143373
    const cDarkGray = rgb(0.2, 0.2, 0.2);
    const cLightGray = rgb(0.94, 0.95, 0.97);
    const cBorder = rgb(0.5, 0.55, 0.6);
    const cWhite = rgb(1, 1, 1);
    const cGreenAccent = rgb(0.12, 0.55, 0.25);

    let y = height - 35;

    // Spreadsheet Title & Branding
    page.drawRectangle({
      x: 35,
      y: y - 40,
      width: width - 70,
      height: 40,
      color: cNavyHeader,
    });

    page.drawText('PLANILLA DE RENDICIÓN PEUGEOT PLAN', {
      x: 50,
      y: y - 24,
      size: 14,
      font: fontBold,
      color: cWhite,
    });

    page.drawText('CONTROL DIARIO DE SUSCRIPCIONES Y MEDIOS DE PAGO', {
      x: 50,
      y: y - 36,
      size: 8,
      font: fontRegular,
      color: rgb(0.85, 0.9, 0.98),
    });

    const fechaOperacion = data.fecha_venta.value || new Date().toLocaleDateString('es-AR');
    page.drawText(`PERÍODO: ${fechaOperacion}`, {
      x: width - 180,
      y: y - 28,
      size: 10,
      font: fontBold,
      color: cWhite,
    });

    y -= 55;

    // Administrative Metadata Bar
    page.drawRectangle({
      x: 35,
      y: y - 25,
      width: width - 70,
      height: 25,
      color: cLightGray,
      borderColor: cBorder,
      borderWidth: 0.8,
    });

    page.drawText('EMPRESA:', { x: 45, y: y - 16, size: 8, font: fontBold, color: cNavyHeader });
    page.drawText(data.empresa.value || 'PEUGEOT PLAN S.A.', { x: 95, y: y - 16, size: 8, font: fontRegular, color: cDarkGray });

    page.drawText('SUPERVISOR:', { x: 300, y: y - 16, size: 8, font: fontBold, color: cNavyHeader });
    page.drawText(data.supervisor.value || 'A DEFINIR', { x: 375, y: y - 16, size: 8, font: fontRegular, color: cDarkGray });

    page.drawText('SUCURSAL / CONCESIONARIO:', { x: 530, y: y - 16, size: 8, font: fontBold, color: cNavyHeader });
    page.drawText(data.sucursal.value || 'CASA CENTRAL', { x: 675, y: y - 16, size: 8, font: fontRegular, color: cDarkGray });

    y -= 38;

    // Define columns for the Planilla Table
    // Columns: FECHA, SUPERVISOR, EMPRESA, SX, CLIENTE, MARCA, VENDEDOR, PLATAFORMA, IMPORTE, EMPRESA DE PAGO
    interface ColDef {
      name: string;
      width: number;
      align?: 'left' | 'center' | 'right';
    }

    const columns: ColDef[] = [
      { name: 'FECHA', width: 65, align: 'center' },
      { name: 'SUPERVISOR', width: 85, align: 'left' },
      { name: 'EMPRESA', width: 90, align: 'left' },
      { name: 'SX (SOLICITUD)', width: 80, align: 'center' },
      { name: 'CLIENTE (TITULAR)', width: 135, align: 'left' },
      { name: 'MARCA', width: 55, align: 'center' },
      { name: 'VENDEDOR', width: 80, align: 'left' },
      { name: 'PLATAFORMA', width: 75, align: 'center' },
      { name: 'IMPORTE', width: 80, align: 'right' },
      { name: 'EMPRESA DE PAGO', width: 106, align: 'left' },
    ];

    // Table Header Row
    let curX = 35;
    page.drawRectangle({
      x: 35,
      y: y - 22,
      width: width - 70,
      height: 22,
      color: cNavyHeader,
      borderColor: cBorder,
      borderWidth: 0.8,
    });

    columns.forEach((col) => {
      let textX = curX + 4;
      if (col.align === 'center') {
        textX = curX + col.width / 2 - (col.name.length * 2.2);
      } else if (col.align === 'right') {
        textX = curX + col.width - (col.name.length * 4.6) - 4;
      }

      page.drawText(col.name, {
        x: textX,
        y: y - 15,
        size: 7.2,
        font: fontBold,
        color: cWhite,
      });

      page.drawLine({
        start: { x: curX + col.width, y: y },
        end: { x: curX + col.width, y: y - 22 },
        thickness: 0.6,
        color: rgb(0.3, 0.4, 0.6),
      });

      curX += col.width;
    });

    y -= 22;

    // Operation Row (Dynamic Data from Operation!)
    const rowH = 26;
    curX = 35;

    page.drawRectangle({
      x: 35,
      y: y - rowH,
      width: width - 70,
      height: rowH,
      color: cWhite,
      borderColor: cBorder,
      borderWidth: 0.8,
    });

    const importeFormatted = data.monto_abonado.value ? `$ ${data.monto_abonado.value}` : '$ 0,00';

    const rowValues = [
      data.fecha_venta.value || fechaOperacion,
      data.supervisor.value || '-',
      data.empresa.value || 'PEUGEOT',
      data.solicitud.value || data.sx.value || '-',
      data.titular.value || data.cliente.value || '-',
      'PEUGEOT',
      data.vendedor.value || '-',
      data.plataforma.value || 'TRANF BANC',
      importeFormatted,
      data.empresa_pago.value || 'TRANSFERENCIA BANCARIA',
    ];

    rowValues.forEach((val, i) => {
      const col = columns[i];
      let textX = curX + 4;
      const displayStr = val.length > 22 ? `${val.substring(0, 20)}...` : val;

      if (col.align === 'center') {
        textX = curX + (col.width / 2) - (displayStr.length * 2.2);
      } else if (col.align === 'right') {
        textX = curX + col.width - (displayStr.length * 4.8) - 6;
      }

      page.drawText(displayStr, {
        x: textX,
        y: y - 16,
        size: 8,
        font: i === 3 || i === 4 || i === 8 ? fontBold : fontRegular,
        color: i === 8 ? cGreenAccent : cDarkGray,
      });

      page.drawLine({
        start: { x: curX + col.width, y },
        end: { x: curX + col.width, y: y - rowH },
        thickness: 0.5,
        color: cBorder,
      });

      curX += col.width;
    });

    y -= rowH;

    // 4 Empty Reference Rows for official sheet realism
    for (let r = 0; r < 4; r++) {
      curX = 35;
      page.drawRectangle({
        x: 35,
        y: y - rowH,
        width: width - 70,
        height: rowH,
        color: r % 2 === 0 ? cLightGray : cWhite,
        borderColor: cBorder,
        borderWidth: 0.6,
      });

      columns.forEach((col) => {
        page.drawLine({
          start: { x: curX + col.width, y },
          end: { x: curX + col.width, y: y - rowH },
          thickness: 0.4,
          color: rgb(0.8, 0.8, 0.8),
        });
        curX += col.width;
      });

      y -= rowH;
    }

    // Totals Row (Formulas: SUM(H:H))
    curX = 35;
    page.drawRectangle({
      x: 35,
      y: y - 24,
      width: width - 70,
      height: 24,
      color: rgb(0.88, 0.91, 0.96),
      borderColor: cBorder,
      borderWidth: 1,
    });

    page.drawText('TOTAL RENDICIÓN DÍA:', {
      x: 45,
      y: y - 16,
      size: 9,
      font: fontBold,
      color: cNavyHeader,
    });

    page.drawText(importeFormatted, {
      x: width - 200,
      y: y - 16,
      size: 11,
      font: fontBold,
      color: cGreenAccent,
    });

    y -= 45;

    // Platform options breakdown (Clover, Lapos, Efectivo, Prisma, Tranf Banc, Mercado Pago)
    page.drawText('PLATAFORMAS Y MEDIOS HABILITADOS EN RENDICIÓN:', {
      x: 35,
      y: y,
      size: 8.5,
      font: fontBold,
      color: cNavyHeader,
    });

    y -= 16;

    const platforms = [
      'TRANF BANC (Transferencia)',
      'MERCADO PAGO',
      'PRISMA',
      'CLOVER',
      'LAPOS PRESENCIAL',
      'LAPOS WEB',
      'EFECTIVO',
    ];

    let pX = 35;
    platforms.forEach((p) => {
      const isSelected = data.plataforma.value && p.toUpperCase().includes(data.plataforma.value.toUpperCase());
      page.drawRectangle({
        x: pX,
        y: y - 16,
        width: 104,
        height: 16,
        color: isSelected ? rgb(0.85, 0.94, 0.88) : cLightGray,
        borderColor: isSelected ? cGreenAccent : cBorder,
        borderWidth: isSelected ? 1 : 0.5,
      });

      page.drawText(p, {
        x: pX + 5,
        y: y - 12,
        size: 6.8,
        font: isSelected ? fontBold : fontRegular,
        color: isSelected ? cGreenAccent : cDarkGray,
      });

      pX += 109;
    });

    y -= 50;

    // Signatures
    const sigW = 180;
    const sigY = 55;

    const drawSig = (label: string, xPos: number) => {
      page.drawLine({
        start: { x: xPos, y: sigY + 20 },
        end: { x: xPos + sigW, y: sigY + 20 },
        thickness: 0.8,
        color: cDarkGray,
      });
      page.drawText(label, {
        x: xPos + 20,
        y: sigY + 6,
        size: 8,
        font: fontBold,
        color: cNavyHeader,
      });
    };

    drawSig('FIRMA Y SELLO SUPERVISOR', 50);
    drawSig('FIRMA RESPONSABLE DE TESORERÍA', 320);
    drawSig('AUDITORÍA ADMINISTRATIVA PEUGEOT', 590);

    return await pdfDoc.save();
  }

  /**
   * Generates a downloadable .xlsx spreadsheet populated with operation data.
   */
  public static generateExcelBlob(data: NormalizedOperationData): Blob {
    const wb = XLSX.utils.book_new();

    const headers = [
      'FECHA',
      'SUPERVISOR',
      'EMPRESA',
      'SX',
      'CLIENTE',
      'MARCA DE SUSCRIPCIÓN',
      'VENDEDOR',
      'PLATAFORMA',
      'IMPORTE',
      'EMPRESA DE PAGO',
    ];

    const row = [
      data.fecha_venta.value || new Date().toLocaleDateString('es-AR'),
      data.supervisor.value || '',
      data.empresa.value || 'PEUGEOT',
      data.solicitud.value || data.sx.value || '',
      data.titular.value || data.cliente.value || '',
      'PEUGEOT',
      data.vendedor.value || '',
      data.plataforma.value || 'TRANF BANC',
      data.monto_abonado.value ? parseFloat(data.monto_abonado.value.replace(/\./g, '').replace(',', '.')) || data.monto_abonado.value : '',
      data.empresa_pago.value || 'TRANSFERENCIA BANCARIA',
    ];

    const wsData = [
      ['PLANILLA DE RENDICIÓN PEUGEOT PLAN'],
      [`EMPRESA: ${data.empresa.value || 'PEUGEOT PLAN'}`, `SUPERVISOR: ${data.supervisor.value || ''}`, `FECHA: ${data.fecha_venta.value || ''}`],
      [],
      headers,
      row,
      [],
      ['TOTAL RENDICIÓN:', '', '', '', '', '', '', '', row[8], ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 32 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Rendicion_Peugeot');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
