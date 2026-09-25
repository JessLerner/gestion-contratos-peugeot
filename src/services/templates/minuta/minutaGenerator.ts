/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { NormalizedOperationData } from '../../../types/operation';

export class MinutaGenerator {
  /**
   * Generates the MINUTA DE VENTAS 2026 PDF adhering faithfully to the official Peugeot template structure.
   */
  public static async generateMinuta(data: NormalizedOperationData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Color definitions
    const cNavy = rgb(0.05, 0.15, 0.35);
    const cHeaderBg = rgb(0.12, 0.22, 0.42);
    const cBorder = rgb(0.2, 0.2, 0.2);
    const cText = rgb(0.1, 0.1, 0.1);
    const cFill = rgb(0.96, 0.97, 0.98);
    const cWhite = rgb(1, 1, 1);
    const cChecked = rgb(0.05, 0.15, 0.35);

    let y = height - 32;

    // Header Title Box
    page.drawRectangle({
      x: 30,
      y: y - 28,
      width: width - 60,
      height: 30,
      color: cHeaderBg,
    });

    page.drawText('PEUGEOT PLAN - MINUTA DE VENTAS 2026', {
      x: width / 2 - 130,
      y: y - 20,
      size: 13,
      font: fontBold,
      color: cWhite,
    });

    y -= 36;

    // Helper to draw a section header
    const drawSectionHeader = (title: string) => {
      page.drawRectangle({
        x: 30,
        y: y - 16,
        width: width - 60,
        height: 18,
        color: rgb(0.85, 0.88, 0.92),
        borderColor: cBorder,
        borderWidth: 0.8,
      });
      page.drawText(title, {
        x: 36,
        y: y - 12,
        size: 9,
        font: fontBold,
        color: cNavy,
      });
      y -= 17;
    };

    // Helper to draw a labeled cell
    const drawCell = (
      label: string,
      val: string,
      x: number,
      yPos: number,
      w: number,
      h: number,
      highlight = false,
    ) => {
      page.drawRectangle({
        x,
        y: yPos - h,
        width: w,
        height: h,
        color: highlight ? rgb(0.98, 0.98, 1) : cWhite,
        borderColor: cBorder,
        borderWidth: 0.6,
      });

      page.drawText(label.toUpperCase(), {
        x: x + 4,
        y: yPos - 9,
        size: 7,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.3),
      });

      const displayVal = val || '';
      if (displayVal) {
        page.drawText(displayVal, {
          x: x + 4,
          y: yPos - 19,
          size: 8.5,
          font: fontRegular,
          color: cText,
        });
      }
    };

    // Helper for checkbox
    const drawCheckbox = (label: string, checked: boolean, x: number, yPos: number) => {
      page.drawRectangle({
        x,
        y: yPos - 9,
        width: 9,
        height: 9,
        borderColor: cBorder,
        borderWidth: 0.8,
        color: checked ? cFill : cWhite,
      });

      if (checked) {
        page.drawText('X', {
          x: x + 2,
          y: yPos - 8,
          size: 8,
          font: fontBold,
          color: cChecked,
        });
      }

      page.drawText(label, {
        x: x + 13,
        y: yPos - 8,
        size: 8,
        font: checked ? fontBold : fontRegular,
        color: cText,
      });
    };

    // 1. DATOS DE LA OPERACIÓN
    drawSectionHeader('1. DATOS DE LA OPERACIÓN');
    const rowH = 24;

    // Row 1: Solicitud, Modelo, Plan, Fecha Venta
    drawCell('N° DE SOLICITUD', data.solicitud.value, 30, y, 110, rowH, true);
    drawCell('MODELO DE AHORRO Y FINANCIACIÓN', data.modelo_vehiculo.value, 140, y, 220, rowH);
    drawCell('PLAN', data.modelo_plan.value, 360, y, 85, rowH);
    drawCell('FECHA DE VENTA', data.fecha_venta.value, 445, y, 120, rowH);
    y -= rowH;

    // Row 2: Sucursal, Vendedor, Supervisor
    drawCell('SUCURSAL DE VENTA', data.sucursal.value, 30, y, 160, rowH);
    drawCell('NOMBRE COMPLETO DEL VENDEDOR / COMERCIALIZADORA', data.vendedor.value, 190, y, 210, rowH);
    drawCell('NOMBRE Y APELLIDO DEL SUPERVISOR', data.supervisor.value, 400, y, 165, rowH);
    y -= rowH + 6;

    // 2. DATOS DEL TITULAR DEL PLAN
    drawSectionHeader('2. DATOS DEL TITULAR DEL PLAN');
    // Row 1: Titular, Fecha Nacimiento, DNI, CUIL
    drawCell('APELLIDO Y NOMBRE DEL TITULAR DEL PLAN', data.titular.value, 30, y, 240, rowH, true);
    drawCell('FECHA DE NACIMIENTO', data.fecha_nacimiento.value, 270, y, 100, rowH);
    drawCell('DNI', data.dni.value, 370, y, 85, rowH);
    drawCell('CUIL / CUIT', data.cuil_cuit.value, 455, y, 110, rowH);
    y -= rowH;

    // Row 2: Domicilio, Ciudad, Provincia, Código Postal
    drawCell('DOMICILIO', data.domicilio.value, 30, y, 240, rowH);
    drawCell('CIUDAD / LOCALIDAD', data.ciudad.value, 270, y, 120, rowH);
    drawCell('PROVINCIA', data.provincia.value, 390, y, 100, rowH);
    drawCell('CÓDIGO POSTAL', data.codigo_postal.value, 490, y, 75, rowH);
    y -= rowH;

    // Row 3: Teléfono 1, Teléfono 2, Mail 1, Mail 2
    drawCell('1° TELÉFONO', data.telefono_1.value, 30, y, 130, rowH);
    drawCell('2° TELÉFONO', data.telefono_2.value, 160, y, 130, rowH);
    drawCell('MAIL 1', data.email_1.value, 290, y, 145, rowH);
    drawCell('MAIL 2', data.email_2.value, 435, y, 130, rowH);
    y -= rowH + 6;

    // 3. FORMA DE PAGO DE SUSCRIPCIÓN Y PRIMERA CUOTA
    drawSectionHeader('3. FORMA DE PAGO DE SUSCRIPCIÓN Y PRIMERA CUOTA');
    // Row 1: Monto abonado, Pago completo / Seña, Monto restante, Sucursal de cobro
    const montoText = data.monto_abonado.value ? `$ ${data.monto_abonado.value}` : '';
    drawCell('MONTO ABONADO', montoText, 30, y, 120, rowH, true);
    drawCell('PAGO COMPLETO / SEÑA', data.tipo_pago.value, 150, y, 140, rowH);
    drawCell('MONTO RESTANTE A ABONAR', '', 290, y, 135, rowH);
    drawCell('SUCURSAL DE COBRO', data.sucursal_cobro.value || data.sucursal.value, 425, y, 140, rowH);
    y -= rowH;

    // Row 2: Payment method checkboxes
    page.drawRectangle({
      x: 30,
      y: y - 22,
      width: width - 60,
      height: 22,
      color: cWhite,
      borderColor: cBorder,
      borderWidth: 0.6,
    });

    const isTarjCred = data.forma_pago.value.toLowerCase().includes('crédito') || data.forma_pago.value.toLowerCase().includes('credito');
    const isTarjDeb = data.forma_pago.value.toLowerCase().includes('débito') || data.forma_pago.value.toLowerCase().includes('debito');
    const isEfectivo = data.forma_pago.value.toLowerCase().includes('efectivo');
    const isMP = data.forma_pago.value.toLowerCase().includes('mercado');
    const isTransf = data.forma_pago.value.toLowerCase().includes('transferencia') || data.forma_pago.value.toLowerCase().includes('tranf');
    const isOtro = !isTarjCred && !isTarjDeb && !isEfectivo && !isMP && !isTransf && !!data.forma_pago.value;

    let cbX = 36;
    drawCheckbox('Tarjeta de Crédito', isTarjCred, cbX, y - 6);
    cbX += 95;
    drawCheckbox('Tarjeta de Débito', isTarjDeb, cbX, y - 6);
    cbX += 90;
    drawCheckbox('Efectivo', isEfectivo, cbX, y - 6);
    cbX += 70;
    drawCheckbox('Mercado Pago', isMP, cbX, y - 6);
    cbX += 90;
    drawCheckbox('Transferencia', isTransf, cbX, y - 6);
    cbX += 85;
    drawCheckbox('Otro', isOtro, cbX, y - 6);
    y -= 22 + 6;

    // 4. DÉBITO AUTOMÁTICO / MEDIO DE PAGO
    drawSectionHeader('4. DÉBITO AUTOMÁTICO DE CUOTA MENSUAL');
    const isDebitoSi = data.debito_automatico.value.toUpperCase() === 'SI' || !!data.cbu.value;
    const isDebitoNo = data.debito_automatico.value.toUpperCase() === 'NO';

    page.drawRectangle({
      x: 30,
      y: y - rowH,
      width: 140,
      height: rowH,
      color: cWhite,
      borderColor: cBorder,
      borderWidth: 0.6,
    });
    page.drawText('DÉBITO AUTOMÁTICO:', { x: 34, y: y - 9, size: 7, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    drawCheckbox('SÍ', isDebitoSi, 36, y - 12);
    drawCheckbox('NO', isDebitoNo, 80, y - 12);

    drawCell('BANCO', data.banco.value, 170, y, 140, rowH);
    drawCell('CBU (22 DÍGITOS)', data.cbu.value, 310, y, 155, rowH);
    drawCell('N° CUENTA', data.numero_cuenta.value, 465, y, 100, rowH);
    y -= rowH;

    drawCell('N° TARJETA (SI APLICA)', data.numero_tarjeta.value, 30, y, 280, rowH);
    drawCell('FRANJA HORARIA DE CONTACTO', data.franja_contacto.value || '9 a 18 hs', 310, y, 255, rowH);
    y -= rowH + 6;

    // 5. PLAN SUBITE / REENCAUSE
    drawSectionHeader('5. PLAN SUBITE / REENCAUSE');
    const isSubiteSi = data.subite.value.toUpperCase() === 'SI';
    const isSubiteNo = data.subite.value.toUpperCase() === 'NO' || (!isSubiteSi && !data.grupo.value);

    page.drawRectangle({
      x: 30,
      y: y - rowH,
      width: 180,
      height: rowH,
      color: cWhite,
      borderColor: cBorder,
      borderWidth: 0.6,
    });
    page.drawText('PLAN SUBITE / REENCAUSE:', { x: 34, y: y - 9, size: 7, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    drawCheckbox('SÍ', isSubiteSi, 36, y - 12);
    drawCheckbox('NO', isSubiteNo, 95, y - 12);

    drawCell('GRUPO', data.grupo.value, 210, y, 170, rowH);
    drawCell('ORDEN', data.orden.value, 380, y, 185, rowH);
    y -= rowH + 6;

    // 6. ENTREGA DE USADO
    drawSectionHeader('6. ENTREGA DE UNIDAD USADA');
    const isUsadoSi = data.entrega_usado.value.toUpperCase() === 'SI' || !!data.usado_marca.value;
    const isUsadoNo = data.entrega_usado.value.toUpperCase() === 'NO' || (!isUsadoSi && !data.usado_marca.value);

    page.drawRectangle({
      x: 30,
      y: y - rowH,
      width: 130,
      height: rowH,
      color: cWhite,
      borderColor: cBorder,
      borderWidth: 0.6,
    });
    page.drawText('TOMA DE USADO:', { x: 34, y: y - 9, size: 7, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    drawCheckbox('SÍ', isUsadoSi, 36, y - 12);
    drawCheckbox('NO', isUsadoNo, 75, y - 12);

    drawCell('MARCA', data.usado_marca.value, 160, y, 80, rowH);
    drawCell('MODELO', data.usado_modelo.value, 240, y, 100, rowH);
    drawCell('VERSIÓN', data.usado_version.value, 340, y, 90, rowH);
    drawCell('AÑO', data.usado_anio.value, 430, y, 50, rowH);
    drawCell('PATENTE', data.usado_patente.value, 480, y, 85, rowH);
    y -= rowH;

    drawCell('KILOMETRAJE', data.usado_kilometraje.value, 30, y, 180, rowH);
    drawCell('VALOR DE TASACIÓN DECLARADO AL CLIENTE', data.usado_valor_tasacion.value ? `$ ${data.usado_valor_tasacion.value}` : '', 210, y, 355, rowH);
    y -= rowH + 6;

    // 7. OBSERVACIONES, ORIGEN DEL DATO Y FORMA DE VENTA
    drawSectionHeader('7. OBSERVACIONES GENERALES Y CANAL DE VENTA');
    drawCell('ORIGEN DEL DATO', data.origen_dato.value || 'Campaña Digital / Web', 30, y, 170, rowH);
    drawCell('FORMA DE VENTA', data.forma_venta.value || 'Venta Telefónica / Digital', 200, y, 180, rowH);
    drawCell('CANAL', 'PEUGEOT OFICIAL', 380, y, 185, rowH);
    y -= rowH;

    // Observaciones multiline area
    page.drawRectangle({
      x: 30,
      y: y - 36,
      width: width - 60,
      height: 36,
      color: cWhite,
      borderColor: cBorder,
      borderWidth: 0.6,
    });
    page.drawText('OBSERVACIONES:', { x: 34, y: y - 9, size: 7, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    const obsText = data.observaciones.value || 'Documentación verificada conforme a normas de suscripción de Peugeot Plan de Ahorro.';
    page.drawText(obsText, {
      x: 34,
      y: y - 22,
      size: 8,
      font: fontRegular,
      color: cText,
    });
    y -= 36 + 10;

    // 8. FIRMAS ADMINISTRATIVAS
    const sigBoxW = (width - 60 - 20) / 3;
    const sigBoxH = 45;

    const drawSigBox = (title: string, xPos: number) => {
      page.drawRectangle({
        x: xPos,
        y: y - sigBoxH,
        width: sigBoxW,
        height: sigBoxH,
        color: cWhite,
        borderColor: cBorder,
        borderWidth: 0.6,
      });
      page.drawLine({
        start: { x: xPos + 10, y: y - 30 },
        end: { x: xPos + sigBoxW - 10, y: y - 30 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(title, {
        x: xPos + 12,
        y: y - 40,
        size: 7.5,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
    };

    drawSigBox('FIRMA Y ACLARACIÓN VENDEDOR', 30);
    drawSigBox('FIRMA Y ACLARACIÓN SUPERVISOR', 30 + sigBoxW + 10);
    drawSigBox('FIRMA CONTROL ADMINISTRATIVO', 30 + (sigBoxW + 10) * 2);

    return await pdfDoc.save();
  }
}
