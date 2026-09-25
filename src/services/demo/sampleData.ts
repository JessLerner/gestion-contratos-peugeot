/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { UnpackedFile } from '../zip/zipExtractor';

export class SampleDataService {
  /**
   * Generates a realistic set of operational documents for testing the pipeline
   * based on the benchmark operation: Solicitud 6201257 - CABRERA JUAN RAMON.
   */
  public static async generateSampleFiles(): Promise<UnpackedFile[]> {
    const files: UnpackedFile[] = [];

    // Helper to generate a realistic PDF document
    const createSamplePdf = async (
      title: string,
      subtitle: string,
      lines: string[],
      primaryColor = rgb(0.1, 0.2, 0.4),
    ): Promise<Uint8Array> => {
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      let y = height - 50;

      // Header Banner
      page.drawRectangle({
        x: 40,
        y: y - 45,
        width: width - 80,
        height: 50,
        color: primaryColor,
      });

      page.drawText(title, {
        x: 55,
        y: y - 22,
        size: 13,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(subtitle, {
        x: 55,
        y: y - 38,
        size: 9,
        font: fontRegular,
        color: rgb(0.9, 0.95, 1),
      });

      y -= 75;

      // Body Content
      for (const line of lines) {
        if (line.startsWith('---')) {
          page.drawLine({
            start: { x: 40, y },
            end: { x: width - 40, y },
            thickness: 0.8,
            color: rgb(0.75, 0.75, 0.75),
          });
          y -= 14;
        } else if (line.startsWith('#')) {
          y -= 6;
          page.drawText(line.replace(/^#\s*/, ''), {
            x: 40,
            y,
            size: 11,
            font: fontBold,
            color: primaryColor,
          });
          y -= 16;
        } else {
          const isBold = line.includes(':');
          const [label, ...valParts] = line.split(':');
          const value = valParts.join(':').trim();

          if (valParts.length > 0) {
            page.drawText(`${label}:`, {
              x: 45,
              y,
              size: 9,
              font: fontBold,
              color: rgb(0.2, 0.2, 0.2),
            });
            page.drawText(value, {
              x: 190,
              y,
              size: 9,
              font: fontRegular,
              color: rgb(0.1, 0.1, 0.1),
            });
          } else {
            page.drawText(line, {
              x: 45,
              y,
              size: 8.5,
              font: fontRegular,
              color: rgb(0.2, 0.2, 0.2),
            });
          }
          y -= 17;
        }
      }

      // Footer
      page.drawText('Documento emitido y archivado electrónicamente. Validez según normativa aplicable.', {
        x: 40,
        y: 40,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });

      return await doc.save();
    };

    // 1. Solicitud de Adhesión Peugeot
    const solBytes = await createSamplePdf(
      'CIRCULO DE INVERSORES S.A.U. DE AHORRO PARA FINES DETERMINADOS',
      'SOLICITUD DE ADHESIÓN A PLAN DE AHORRO PREVIO PEUGEOT',
      [
        '# DATOS DE LA SOLICITUD',
        'SOLICITUD Nº: 6201257',
        'FECHA: 18/02/2026',
        'CONCESIONARIO: AUTOFRANCE S.A.',
        'CÓDIGO CONCESIONARIO: 0324',
        'SUCURSAL: CASA CENTRAL',
        'VENDEDOR: MARTIN RODRIGUEZ',
        'SUPERVISOR: GABRIEL LOPEZ',
        '---',
        '# DATOS DEL VEHÍCULO Y PLAN',
        'MODELO: NUEVO PEUGEOT 208 ACTIVE 1.6',
        'PLAN: 84 MESES (100% FINANCIADO)',
        'VALOR MÓVIL: $ 28.500.000,00',
        'CUOTA TOTAL: $ 345.200,00',
        '---',
        '# DATOS DEL TITULAR',
        'APELLIDO Y NOMBRES: CABRERA, JUAN RAMON',
        'DNI: 24798197',
        'CUIL / CUIT: 20-24798197-3',
        'FECHA DE NACIMIENTO: 14/06/1975',
        'ESTADO CIVIL: CASADO',
        'NACIONALIDAD: ARGENTINA',
        'GÉNERO: MASCULINO',
        'DOMICILIO: AV. CORRIENTES 4560 PISO 4 DTO B',
        'LOCALIDAD: CAPITAL FEDERAL',
        'PROVINCIA: BUENOS AIRES',
        'CÓDIGO POSTAL: 1195',
        'TELÉFONO CELULAR: 11-4567-8901',
        'TELÉFONO PARTICULAR: 11-4862-3344',
        'EMAIL 1: juan.cabrera@gmail.com',
        'EMAIL 2: jrcabrera_ventas@outlook.com',
      ],
      rgb(0.06, 0.16, 0.38),
    );
    files.push({
      name: '01_Solicitud_Adhesion_6201257.pdf',
      relativePath: '01_Solicitud_Adhesion_6201257.pdf',
      size: solBytes.byteLength,
      mimeType: 'application/pdf',
      data: solBytes,
    });

    // 2. Anexo Débito Automático
    const debitoBytes = await createSamplePdf(
      'PEUGEOT PLAN DE AHORRO S.A.',
      'ANEXO PAGO AUTOMÁTICO CON DÉBITO EN CUENTA BANCARIA',
      [
        '# AUTORIZACIÓN DE DÉBITO EN CUENTA',
        'N° DE SOLICITUD ASOCIADA: 6201257',
        'TITULAR DE LA CUENTA: CABRERA JUAN RAMON',
        'ENTIDAD BANCARIA: BANCO SANTANDER ARGENTINA S.A.',
        'SUCURSAL: 072 - ALMAGRO',
        'TIPO DE CUENTA: CAJA DE AHORROS EN PESOS',
        'N° DE CUENTA: 072-350333/9',
        'CBU: 0720704688000035033390',
        'FECHA AUTORIZACIÓN: 18/02/2026',
        '---',
        'Por la presente autorizo a Círculo de Inversores S.A.U. a debitar mensualmente',
        'las cuotas correspondientes al plan de ahorro contratado.',
      ],
      rgb(0.12, 0.24, 0.45),
    );
    files.push({
      name: '02_Anexo_Debito_Automatico_Santander.pdf',
      relativePath: '02_Anexo_Debito_Automatico_Santander.pdf',
      size: debitoBytes.byteLength,
      mimeType: 'application/pdf',
      data: debitoBytes,
    });

    // 3. Comprobante de Transferencia / Pago
    const transferBytes = await createSamplePdf(
      'SANTANDER RÍO - HOME BANKING',
      'COMPROBANTE DE TRANSFERENCIA BANCARIA INMEDIATA',
      [
        '# DETALLE DE LA OPERACIÓN',
        'ESTADO: TRANSFERENCIA REALIZADA EXITOSAMENTE',
        'FECHA DE OPERACIÓN: 18/02/2026 - 15:42 HS',
        'NÚMERO DE OPERACIÓN: 8492015882',
        '---',
        '# CUENTA ORIGEN',
        'TITULAR: JUAN RAMON CABRERA',
        'CUIL: 20-24798197-3',
        'CBU ORIGEN: 0720704688000035033390',
        'BANCO: BANCO SANTANDER',
        '---',
        '# CUENTA DESTINO',
        'DESTINATARIO: AUTOFRANCE S.A. / PEUGEOT OFICIAL',
        'CUIT DESTINO: 30-68945123-8',
        'CBU DESTINO: 0140000201500002345678',
        'BANCO DESTINO: BANCO PROVINCIA',
        'CONCEPTO: CUOTA / SUSCRIPCION PLAN 6201257',
        '---',
        '# IMPORTE TRANSFERIDO',
        'IMPORTE: $ 960.000,00',
        'SON PESOS NOVECIENTOS SESENTA MIL CON 00/100',
      ],
      rgb(0.7, 0.1, 0.1),
    );
    files.push({
      name: '03_Comprobante_Transferencia_960000.pdf',
      relativePath: '03_Comprobante_Transferencia_960000.pdf',
      size: transferBytes.byteLength,
      mimeType: 'application/pdf',
      data: transferBytes,
    });

    // 4. Constancia de CBU / Alias
    const cbuBytes = await createSamplePdf(
      'BANCO SANTANDER ARGENTINA',
      'CONSTANCIA OFICIAL DE CBU / ALIAS BANCARIO',
      [
        '# INFORMACIÓN DEL CLIENTE Y CUENTA',
        'TITULAR DE LA CUENTA: CABRERA JUAN RAMON',
        'CUIT / CUIL: 20-24798197-3',
        'ENTIDAD BANCARIA: BANCO SANTANDER',
        'SUCURSAL: 072',
        'CUENTA: 072-350333/9',
        'TIPO: CAJA DE AHORRO EN PESOS',
        'CBU: 0720704688000035033390',
        'ALIAS CBU: CABRERA.PEUGEOT.PLAN',
        'FECHA DE EMISIÓN: 17/02/2026',
      ],
      rgb(0.65, 0.1, 0.1),
    );
    files.push({
      name: '04_Constancia_CBU_Santander.pdf',
      relativePath: '04_Constancia_CBU_Santander.pdf',
      size: cbuBytes.byteLength,
      mimeType: 'application/pdf',
      data: cbuBytes,
    });

    // 5. DNI Frente
    const dniFrenteBytes = await createSamplePdf(
      'REPÚBLICA ARGENTINA - REGISTRO NACIONAL DE LAS PERSONAS',
      'DOCUMENTO NACIONAL DE IDENTIDAD (FRENTE)',
      [
        '# DATOS FILIATORIOS',
        'APELLIDO: CABRERA',
        'NOMBRES: JUAN RAMON',
        'DOCUMENTO / DNI: 24.798.197',
        'NACIONALIDAD: ARGENTINA',
        'SEXO: M',
        'FECHA DE NACIMIENTO: 14 JUN 1975',
        'EJEMPLAR: B',
      ],
      rgb(0.2, 0.45, 0.7),
    );
    files.push({
      name: '05_DNI_Frente_Cabrera_Juan_Ramon.pdf',
      relativePath: '05_DNI_Frente_Cabrera_Juan_Ramon.pdf',
      size: dniFrenteBytes.byteLength,
      mimeType: 'application/pdf',
      data: dniFrenteBytes,
    });

    // 6. DNI Dorso
    const dniDorsoBytes = await createSamplePdf(
      'REPÚBLICA ARGENTINA - REGISTRO NACIONAL DE LAS PERSONAS',
      'DOCUMENTO NACIONAL DE IDENTIDAD (DORSO)',
      [
        '# REGISTRO Y DOMICILIO',
        'CUIL: 20-24798197-3',
        'DOMICILIO: AV. CORRIENTES 4560 4 B',
        'LOCALIDAD: CIUDAD AUTONOMA DE BUENOS AIRES',
        'PROVINCIA: BUENOS AIRES',
        'FECHA DE EMISIÓN: 10/04/2021',
      ],
      rgb(0.2, 0.45, 0.7),
    );
    files.push({
      name: '06_DNI_Dorso_Cabrera_Juan_Ramon.pdf',
      relativePath: '06_DNI_Dorso_Cabrera_Juan_Ramon.pdf',
      size: dniDorsoBytes.byteLength,
      mimeType: 'application/pdf',
      data: dniDorsoBytes,
    });

    // 7. Anexo Entrega Asegurada
    const anexoEntregaBytes = await createSamplePdf(
      'PEUGEOT PLAN DE AHORRO',
      'ANEXO BONIFICACIÓN Y ENTREGA ASEGURADA PACTADA',
      [
        '# CONDICIONES ESPECIALES DE ADJUDICACIÓN',
        'SOLICITUD ASOCIADA: 6201257',
        'TITULAR: JUAN RAMON CABRERA',
        'MODELO: NUEVO PEUGEOT 208 ACTIVE',
        'BENEFICIO: ENTREGA PACTADA EN CUOTA 3',
        'INTEGRACIÓN MÍNIMA REQUERIDA: 20% DEL VALOR MÓVIL',
        'FECHA: 18/02/2026',
      ],
      rgb(0.08, 0.22, 0.42),
    );
    files.push({
      name: '07_Anexo_Entrega_Asegurada.pdf',
      relativePath: '07_Anexo_Entrega_Asegurada.pdf',
      size: anexoEntregaBytes.byteLength,
      mimeType: 'application/pdf',
      data: anexoEntregaBytes,
    });

    // 8. Confirmación de Suscripción
    const confBytes = await createSamplePdf(
      'PEUGEOT ARGENTINA - PLAN DE AHORRO',
      'CONFIRMACIÓN DE INGRESO DE SOLICITUD',
      [
        '# ESTADO DE OPERACIÓN',
        'SOLICITUD: 6201257',
        'ESTADO: INGRESADA - EN REVISIÓN ADMINISTRATIVA',
        'TITULAR: CABRERA JUAN RAMON',
        'CONCESIONARIO: AUTOFRANCE S.A.',
        'FECHA INGRESO: 18/02/2026',
      ],
      rgb(0.1, 0.3, 0.5),
    );
    files.push({
      name: '08_Confirmacion_Suscripcion.pdf',
      relativePath: '08_Confirmacion_Suscripcion.pdf',
      size: confBytes.byteLength,
      mimeType: 'application/pdf',
      data: confBytes,
    });

    return files;
  }

  /**
   * Generates a downloadable ZIP containing the sample operational documents.
   */
  public static async generateSampleZip(): Promise<Blob> {
    const files = await this.generateSampleFiles();
    const zip = new JSZip();

    for (const f of files) {
      zip.file(f.name, f.data);
    }

    return await zip.generateAsync({ type: 'blob' });
  }
}
