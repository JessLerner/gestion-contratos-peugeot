/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseParser, FieldExtractionResult } from './baseParser';

export class BankParser extends BaseParser {
  public static parse(text: string, filename: string): FieldExtractionResult {
    const results: FieldExtractionResult = {};
    const clean = this.cleanText(text);

    // CBU
    const cbu = this.extractCbu(clean);
    if (cbu) {
      results.cbu = this.createField(cbu, filename, 'Alta', 1);
    }

    // Banco
    const bancoMatch = clean.match(/(?:banco|entidad)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s.-]{3,30})(?=\n|cbu|cuenta|$)/i) ||
      clean.match(/\b(SANTANDER|GALICIA|BBVA|MACRO|NACION|PROVINCIA|CREDICOOP|ICBC|HSBC|CIUDAD|COMAFI|SUPERVIELLE|PATAGONIA|ITAU)\b/i);
    if (bancoMatch) {
      results.banco = this.createField(bancoMatch[1].trim(), filename, 'Alta', 1, bancoMatch[0]);
    }

    // Titular
    const titularMatch = clean.match(/(?:titular|apellido\s*y\s*nombre|nombre)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]{4,50})(?=\n|cuit|cuil|cbu|$)/i);
    if (titularMatch) {
      results.titular = this.createField(titularMatch[1].trim(), filename, 'Alta', 1, titularMatch[0]);
    }

    // CUIT / CUIL
    const cuil = this.extractCuil(clean);
    if (cuil) {
      results.cuil_cuit = this.createField(cuil, filename, 'Alta', 1);
    }

    // Número de cuenta
    const ctaMatch = clean.match(/(?:cuenta|n[°º]\s*cuenta|n[°º]\s*de\s*cuenta)[\s.:]+([0-9/-]{5,20})/i);
    if (ctaMatch) {
      results.numero_cuenta = this.createField(ctaMatch[1].trim(), filename, 'Alta', 1, ctaMatch[0]);
    }

    return results;
  }
}
