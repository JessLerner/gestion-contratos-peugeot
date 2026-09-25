/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseParser, FieldExtractionResult } from './baseParser';

export class DniParser extends BaseParser {
  public static parse(text: string, filename: string): FieldExtractionResult {
    const results: FieldExtractionResult = {};
    const clean = this.cleanText(text);

    // 1. DNI number
    // In DNI cards: "DOCUMENTO / DOCUMENT Nº 24.798.197" or "24798197"
    const dni = this.extractDni(clean) || clean.match(/\b([1-9][0-9]{6,7})\b/)?.[1];
    if (dni && dni.length >= 7 && dni.length <= 8) {
      results.dni = this.createField(dni, filename, 'Alta', 1);
    }

    // 2. Apellido y Nombre
    const apeMatch = clean.match(/(?:apellido[s]?|surname)[\s.:]+([A-ZÁÉÍÓÚÑ\s]{3,30})/i);
    const nomMatch = clean.match(/(?:nombre[s]?|given\s*names?)[\s.:]+([A-ZÁÉÍÓÚÑ\s]{3,35})/i);

    if (apeMatch && nomMatch) {
      const full = `${apeMatch[1].trim()} ${nomMatch[1].trim()}`.replace(/\s+/g, ' ');
      results.titular = this.createField(full, filename, 'Alta', 1);
    } else {
      // Sometimes just "CABRERA JUAN RAMON"
      const nameMatch = clean.match(/(?:argentina|renaper)[\s\S]{0,60}\n([A-ZÁÉÍÓÚÑ\s,]{6,40})\n/i);
      if (nameMatch) {
        results.titular = this.createField(nameMatch[1].trim(), filename, 'Media', 1);
      }
    }

    // 3. Fecha de nacimiento
    const fechaNac = this.extractDate(clean, 'nacimiento') || this.extractDate(clean, 'date of birth');
    if (fechaNac) {
      results.fecha_nacimiento = this.createField(fechaNac, filename, 'Alta', 1);
    }

    // 4. CUIL / CUIT (on back of DNI)
    const cuil = this.extractCuil(clean);
    if (cuil) {
      results.cuil_cuit = this.createField(cuil, filename, 'Alta', 1);
    }

    // 5. Domicilio (on back of DNI)
    const domMatch = clean.match(/(?:domicilio|address)[\s.:]+([A-Z0-9ÁÉÍÓÚÑa-záéíóúñ\s.,°º#-]{5,50})/i);
    if (domMatch) {
      results.domicilio = this.createField(domMatch[1].trim(), filename, 'Alta', 1);
    }

    return results;
  }
}
