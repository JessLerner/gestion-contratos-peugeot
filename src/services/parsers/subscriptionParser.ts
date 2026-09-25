/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseParser, FieldExtractionResult } from './baseParser';

export class SubscriptionParser extends BaseParser {
  public static parse(text: string, filename: string): FieldExtractionResult {
    const results: FieldExtractionResult = {};
    const clean = this.cleanText(text);

    // 1. Solicitud Number (e.g. Solicitud Nº 6201257 or Solicitud: 6201257 or SX: 6201257)
    const solMatch = clean.match(/(?:solicitud|n[°º]|sx)[\s.:#]*([1-9][0-9]{5,7})\b/i) ||
      clean.match(/\b([1-9][0-9]{6})\b/);
    if (solMatch) {
      results.solicitud = this.createField(solMatch[1], filename, 'Alta', 1, solMatch[0]);
      results.sx = this.createField(solMatch[1], filename, 'Alta', 1, solMatch[0]);
    }

    // 2. Titular (Apellido y Nombre)
    // Often: "TITULAR: CABRERA JUAN RAMON" or "APELLIDO Y NOMBRES: CABRERA, JUAN RAMON"
    const titularMatch = clean.match(/(?:apellido\s*y\s*nombre[s]?|titular)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]{4,50})(?=\n|\s{3,}|dni|documento|cuit|domicilio|$)/i);
    if (titularMatch) {
      const name = titularMatch[1].trim().replace(/\s+/g, ' ');
      results.titular = this.createField(name, filename, 'Alta', 1, titularMatch[0]);
      results.cliente = this.createField(name, filename, 'Alta', 1, titularMatch[0]);
    }

    // 3. DNI
    const dni = this.extractDni(clean);
    if (dni) {
      results.dni = this.createField(dni, filename, 'Alta', 1);
    }

    // 4. CUIL / CUIT
    const cuil = this.extractCuil(clean);
    if (cuil) {
      results.cuil_cuit = this.createField(cuil, filename, 'Alta', 1);
    }

    // 5. Fecha de Nacimiento
    const fechaNac = this.extractDate(clean, 'nacimiento');
    if (fechaNac) {
      results.fecha_nacimiento = this.createField(fechaNac, filename, 'Alta', 1);
    }

    // 6. Fecha de venta / solicitud
    const fechaVenta = this.extractDate(clean, 'fecha') || this.extractDate(clean);
    if (fechaVenta) {
      results.fecha_venta = this.createField(fechaVenta, filename, 'Alta', 1);
    }

    // 7. Domicilio, Localidad, Provincia, CP
    const domMatch = clean.match(/(?:domicilio|calle|direccion)[\s.:]+([A-Z0-9ÁÉÍÓÚÑa-záéíóúñ\s.,°º#-]{5,60})(?=\n|localidad|ciudad|provincia|c\.?p\.?|$)/i);
    if (domMatch) {
      results.domicilio = this.createField(domMatch[1].trim(), filename, 'Alta', 1, domMatch[0]);
    }

    const locMatch = clean.match(/(?:localidad|ciudad)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,40})(?=\n|provincia|c\.?p\.?|$)/i);
    if (locMatch) {
      results.ciudad = this.createField(locMatch[1].trim(), filename, 'Alta', 1, locMatch[0]);
    }

    const provMatch = clean.match(/(?:provincia)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,35})(?=\n|c\.?p\.?|pais|$)/i);
    if (provMatch) {
      results.provincia = this.createField(provMatch[1].trim(), filename, 'Alta', 1, provMatch[0]);
    }

    const cpMatch = clean.match(/(?:c\.?p\.?|codigo\s*postal)[\s.:]+([A-Z0-9]{4,8})/i);
    if (cpMatch) {
      results.codigo_postal = this.createField(cpMatch[1].trim(), filename, 'Alta', 1, cpMatch[0]);
    }

    // 8. Teléfonos
    const phones = clean.match(/(?:(?:cel|tel|celular|particular)[\s.:]*|\b)([0-9()\s-]{8,15})\b/g);
    if (phones && phones.length > 0) {
      const p1 = phones[0].trim();
      results.telefono_1 = this.createField(p1, filename, 'Alta', 1);
      if (phones.length > 1) {
        results.telefono_2 = this.createField(phones[1].trim(), filename, 'Alta', 1);
      }
    }

    // 9. Emails
    const emailMatch = clean.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g);
    if (emailMatch && emailMatch.length > 0) {
      results.email_1 = this.createField(emailMatch[0], filename, 'Alta', 1);
      if (emailMatch.length > 1) {
        results.email_2 = this.createField(emailMatch[1], filename, 'Alta', 1);
      }
    }

    // 10. Modelo y Plan
    // Peugeot models: 208 (ACTIVE, LIKE, ALLURE, GT), 2008, PARTNER, 3008, EXPERT
    const modelMatch = clean.match(/(?:modelo|vehiculo|version)[\s.:]+((?:NUEVO\s+)?(?:PEUGEOT\s+)?(?:208|2008|PARTNER|3008|EXPERT)[A-Z0-9\s.-]{0,30}?)(?=\n|plan|modalidad|valor|cuota|$)/i) ||
      clean.match(/\b((?:NUEVO\s+)?PEUGEOT\s+(?:208|2008|PARTNER)[A-Z0-9\s.-]{0,25}?)(?=\n|plan|modalidad|valor|cuota|$)/i);
    if (modelMatch) {
      results.modelo_vehiculo = this.createField(modelMatch[1].trim(), filename, 'Alta', 1, modelMatch[0]);
    }

    const planMatch = clean.match(/(?:plan|modalidad)[\s.:]+([0-9]{2,3}\s*[/]\s*[0-9]{2,3}|100%|70\/30|80\/20)/i);
    if (planMatch) {
      results.modelo_plan = this.createField(planMatch[1].trim(), filename, 'Alta', 1, planMatch[0]);
    }

    // 11. Concesionario / Sucursal
    const concMatch = clean.match(/(?:concesionario|agente)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s.-]{4,40})(?=\n|codigo|$)/i);
    if (concMatch) {
      results.concesionario = this.createField(concMatch[1].trim(), filename, 'Alta', 1, concMatch[0]);
      results.sucursal = this.createField(concMatch[1].trim(), filename, 'Alta', 1, concMatch[0]);
    }

    // 12. Vendedor / Asesor comercial
    const vendMatch = clean.match(/(?:vendedor|asesor\s*comercial|comercializadora)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s.-]{4,40})(?=\n|supervisor|$)/i);
    if (vendMatch) {
      results.vendedor = this.createField(vendMatch[1].trim(), filename, 'Alta', 1, vendMatch[0]);
    }

    // 13. Supervisor
    const supMatch = clean.match(/(?:supervisor)[\s.:]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s.-]{4,40})(?=\n|$)/i);
    if (supMatch) {
      results.supervisor = this.createField(supMatch[1].trim(), filename, 'Alta', 1, supMatch[0]);
    }

    // 14. Valores móviles y cuotas
    const valorMovil = this.extractAmount(clean, 'valor movil');
    if (valorMovil) {
      results.valor_movil = this.createField(valorMovil, filename, 'Alta', 1);
    }

    const cuotaTotal = this.extractAmount(clean, 'total de cuota') || this.extractAmount(clean, 'cuota total');
    if (cuotaTotal) {
      results.cuota_total = this.createField(cuotaTotal, filename, 'Alta', 1);
    }

    return results;
  }
}
