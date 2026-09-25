/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseParser, FieldExtractionResult } from './baseParser';

export class ConfirmationParser extends BaseParser {
  public static parse(text: string, filename: string): FieldExtractionResult {
    const results: FieldExtractionResult = {};
    const clean = this.cleanText(text);

    // Solicitud / SX
    const solMatch = clean.match(/(?:solicitud|n[°º]|sx)[\s.:#]*([1-9][0-9]{5,7})\b/i);
    if (solMatch) {
      results.solicitud = this.createField(solMatch[1], filename, 'Alta', 1, solMatch[0]);
    }

    // Titular
    const titularMatch = clean.match(/(?:titular|cliente|suscripcion)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]{4,50})(?=\n|$)/i);
    if (titularMatch) {
      results.titular = this.createField(titularMatch[1].trim(), filename, 'Alta', 1, titularMatch[0]);
    }

    // Fecha
    const fecha = this.extractDate(clean, 'fecha') || this.extractDate(clean);
    if (fecha) {
      results.fecha_venta = this.createField(fecha, filename, 'Alta', 1);
    }

    return results;
  }
}
