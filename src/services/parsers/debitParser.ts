/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseParser, FieldExtractionResult } from './baseParser';

export class DebitParser extends BaseParser {
  public static parse(text: string, filename: string): FieldExtractionResult {
    const results: FieldExtractionResult = {};
    const clean = this.cleanText(text);

    // Débito automático is confirmed by the presence of this document
    results.debito_automatico = this.createField('SI', filename, 'Alta', 1, 'Anexo de adhesión a débito automático');

    // CBU
    const cbu = this.extractCbu(clean);
    if (cbu) {
      results.cbu = this.createField(cbu, filename, 'Alta', 1);
    }

    // Banco
    const bancoMatch = clean.match(/(?:banco|entidad\s*bancaria|entidad)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s.-]{3,30})(?=\n|sucursal|cbu|$)/i) ||
      clean.match(/\b(SANTANDER|GALICIA|BBVA|MACRO|NACION|PROVINCIA|CREDICOOP|ICBC|HSBC|CIUDAD|COMAFI|SUPERVIELLE|PATAGONIA|ITAU)\b/i);
    if (bancoMatch) {
      results.banco = this.createField(bancoMatch[1].trim(), filename, 'Alta', 1, bancoMatch[0]);
    }

    // Titular de la cuenta
    const titularMatch = clean.match(/(?:titular|apellido\s*y\s*nombre|titular\s*de\s*la\s*cuenta)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]{4,50})(?=\n|cuit|cuil|cbu|$)/i);
    if (titularMatch) {
      results.titular = this.createField(titularMatch[1].trim(), filename, 'Alta', 1, titularMatch[0]);
    }

    // Número de cuenta
    const ctaMatch = clean.match(/(?:n[°º]\s*de\s*cuenta|cuenta\s*n[°º]|n[°º]\s*cuenta)[\s.:]+([0-9/-]{5,20})/i);
    if (ctaMatch) {
      results.numero_cuenta = this.createField(ctaMatch[1].trim(), filename, 'Alta', 1, ctaMatch[0]);
    }

    // Solicitud (if cross-referenced in debit doc)
    const solMatch = clean.match(/(?:solicitud|n[°º]|sx)[\s.:#]*([1-9][0-9]{5,7})\b/i);
    if (solMatch) {
      results.solicitud = this.createField(solMatch[1], filename, 'Alta', 1, solMatch[0]);
    }

    return results;
  }
}
