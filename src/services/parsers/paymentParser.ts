/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseParser, FieldExtractionResult } from './baseParser';

export class PaymentParser extends BaseParser {
  public static parse(text: string, filename: string): FieldExtractionResult {
    const results: FieldExtractionResult = {};
    const clean = this.cleanText(text);

    // 1. Importe (Monto abonado)
    const amount = this.extractAmount(clean, 'transferido') ||
      this.extractAmount(clean, 'importe') ||
      this.extractAmount(clean, 'monto') ||
      this.extractAmount(clean);

    if (amount) {
      results.monto_abonado = this.createField(amount, filename, 'Alta', 1, `Importe detectado: ${amount}`);
      results.importe_rendicion = this.createField(amount, filename, 'Alta', 1, `Importe rendición: ${amount}`);
    }

    // 2. Fecha de transferencia
    const fecha = this.extractDate(clean, 'fecha') || this.extractDate(clean);
    if (fecha) {
      results.fecha_venta = this.createField(fecha, filename, 'Alta', 1);
    }

    // 3. Plataforma y Forma de Pago
    const lower = clean.toLowerCase();
    if (lower.includes('mercado pago') || lower.includes('mercadopago')) {
      results.forma_pago = this.createField('Mercado Pago', filename, 'Alta', 1);
      results.plataforma = this.createField('MERCADO PAGO', filename, 'Alta', 1);
      results.empresa_pago = this.createField('MERCADO PAGO', filename, 'Alta', 1);
    } else if (lower.includes('prisma') || lower.includes('lapos')) {
      results.forma_pago = this.createField('Tarjeta de débito', filename, 'Media', 1);
      results.plataforma = this.createField('PRISMA', filename, 'Alta', 1);
      results.empresa_pago = this.createField('PRISMA MEDIOS DE PAGO', filename, 'Alta', 1);
    } else if (lower.includes('clover')) {
      results.forma_pago = this.createField('Tarjeta de crédito', filename, 'Media', 1);
      results.plataforma = this.createField('CLOVER', filename, 'Alta', 1);
      results.empresa_pago = this.createField('FIRST DATA / CLOVER', filename, 'Alta', 1);
    } else if (lower.includes('transferencia') || lower.includes('coelsa') || lower.includes('cbu') || lower.includes('banco')) {
      results.forma_pago = this.createField('Transferencia', filename, 'Alta', 1);
      results.plataforma = this.createField('TRANF BANC', filename, 'Alta', 1);
      results.empresa_pago = this.createField('TRANSFERENCIA BANCARIA', filename, 'Alta', 1);
    }

    // 4. Tipo de Pago: Pago Completo vs Seña (Default to Seña or Pago Completo depending on context)
    if (lower.includes('seña') || lower.includes('reserva')) {
      results.tipo_pago = this.createField('Seña', filename, 'Alta', 1);
    } else if (lower.includes('completo') || lower.includes('suscripcion')) {
      results.tipo_pago = this.createField('Pago Completo', filename, 'Media', 1);
    }

    // 5. Banco emisor si figura
    const bancoMatch = clean.match(/(?:banco|entidad)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s.-]{3,25})(?=\n|cuenta|$)/i);
    if (bancoMatch && !results.banco) {
      results.banco = this.createField(bancoMatch[1].trim(), filename, 'Media', 1);
    }

    return results;
  }
}
