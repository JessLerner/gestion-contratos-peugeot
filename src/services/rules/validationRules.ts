/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InconsistencyItem, NormalizedOperationData, ProcessedDocument, ValidationItem } from '../../types/operation';

export class ValidationRules {
  /**
   * Cross-validates fields across all ingested documents and generates validations + inconsistency items.
   */
  public static runCrossValidation(
    data: NormalizedOperationData,
    docs: ProcessedDocument[],
    rawDocExtractions: Map<string, Record<string, string>>,
  ): { validations: ValidationItem[]; inconsistencies: InconsistencyItem[] } {
    const validations: ValidationItem[] = [];
    const inconsistencies: InconsistencyItem[] = [];

    // Helper to find documents of given type
    const findDoc = (type: string) => docs.find((d) => d.type === type);

    // 1. Solicitud cross-check
    const solValues: Array<{ doc: string; val: string }> = [];
    rawDocExtractions.forEach((ext, docName) => {
      if (ext.solicitud) solValues.push({ doc: docName, val: ext.solicitud });
    });

    if (solValues.length > 1) {
      const first = solValues[0].val;
      const mismatch = solValues.find((s) => s.val !== first);
      if (mismatch) {
        validations.push({
          id: 'v_solicitud_mismatch',
          title: 'N° de Solicitud en Documentos',
          status: 'error',
          message: `Inconsistencia en número de solicitud: "${first}" (${solValues[0].doc}) vs "${mismatch.val}" (${mismatch.doc})`,
          documentsInvolved: [solValues[0].doc, mismatch.doc],
        });
        inconsistencies.push({
          field: 'solicitud',
          fieldLabel: 'N° de Solicitud',
          valueA: first,
          sourceA: solValues[0].doc,
          valueB: mismatch.val,
          sourceB: mismatch.doc,
          resolved: false,
        });
      } else {
        validations.push({
          id: 'v_solicitud_ok',
          title: 'N° de Solicitud Verificado',
          status: 'valid',
          message: `Coincide en todos los documentos (${first})`,
          documentsInvolved: solValues.map((s) => s.doc),
        });
      }
    } else if (solValues.length === 1) {
      validations.push({
        id: 'v_solicitud_single',
        title: 'N° de Solicitud Detectado',
        status: 'valid',
        message: `Detectado en ${solValues[0].doc}: ${solValues[0].val}`,
        documentsInvolved: [solValues[0].doc],
      });
    } else {
      validations.push({
        id: 'v_solicitud_missing',
        title: 'N° de Solicitud Faltante',
        status: 'warning',
        message: 'No se detectó número de solicitud explícito en los documentos.',
        documentsInvolved: [],
      });
    }

    // 2. Titular cross-check (DNI vs Solicitud vs CBU vs Débito)
    const titValues: Array<{ doc: string; val: string }> = [];
    rawDocExtractions.forEach((ext, docName) => {
      if (ext.titular) titValues.push({ doc: docName, val: ext.titular });
    });

    if (titValues.length > 1) {
      const norm = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '');
      const firstNorm = norm(titValues[0].val);
      const mismatch = titValues.find((t) => {
        const tNorm = norm(t.val);
        // Compare similarity
        return tNorm !== firstNorm && !tNorm.includes(firstNorm) && !firstNorm.includes(tNorm);
      });

      if (mismatch) {
        validations.push({
          id: 'v_titular_mismatch',
          title: 'Titular / Apellido y Nombre',
          status: 'warning',
          message: `Discrepancia en nombre de titular: "${titValues[0].val}" (${titValues[0].doc}) vs "${mismatch.val}" (${mismatch.doc})`,
          documentsInvolved: [titValues[0].doc, mismatch.doc],
        });
        inconsistencies.push({
          field: 'titular',
          fieldLabel: 'Titular de la Operación',
          valueA: titValues[0].val,
          sourceA: titValues[0].doc,
          valueB: mismatch.val,
          sourceB: mismatch.doc,
          resolved: false,
        });
      } else {
        validations.push({
          id: 'v_titular_ok',
          title: 'Titular Validado',
          status: 'valid',
          message: `Titular coincidente: ${titValues[0].val}`,
          documentsInvolved: titValues.map((t) => t.doc),
        });
      }
    }

    // 3. DNI cross-check (Solicitud vs DNI imagen)
    const dniDoc = findDoc('dni_frente') || findDoc('dni_dorso');
    const solDoc = findDoc('solicitud_adhesion');
    if (dniDoc && solDoc && rawDocExtractions.get(dniDoc.name)?.dni && rawDocExtractions.get(solDoc.name)?.dni) {
      const d1 = rawDocExtractions.get(dniDoc.name)!.dni;
      const d2 = rawDocExtractions.get(solDoc.name)!.dni;
      if (d1 === d2) {
        validations.push({
          id: 'v_dni_match',
          title: 'DNI Validado con Documento de Identidad',
          status: 'valid',
          message: `DNI ${d1} verificado contra fotografía de DNI y Solicitud`,
          documentsInvolved: [dniDoc.name, solDoc.name],
        });
      } else {
        validations.push({
          id: 'v_dni_mismatch',
          title: 'DNI Discrepante',
          status: 'error',
          message: `DNI en foto (${d1}) difiere del DNI en Solicitud (${d2})`,
          documentsInvolved: [dniDoc.name, solDoc.name],
        });
        inconsistencies.push({
          field: 'dni',
          fieldLabel: 'DNI del Titular',
          valueA: d1,
          sourceA: dniDoc.name,
          valueB: d2,
          sourceB: solDoc.name,
          resolved: false,
        });
      }
    }

    // 4. CBU cross-check (Medio de Pago vs Constancia CBU)
    const cbuValues: Array<{ doc: string; val: string }> = [];
    rawDocExtractions.forEach((ext, docName) => {
      if (ext.cbu) cbuValues.push({ doc: docName, val: ext.cbu });
    });

    if (cbuValues.length > 1) {
      const firstCbu = cbuValues[0].val;
      const mismatch = cbuValues.find((c) => c.val !== firstCbu);
      if (mismatch) {
        validations.push({
          id: 'v_cbu_mismatch',
          title: 'CBU Bancario',
          status: 'error',
          message: `CBU en ${cbuValues[0].doc} (${firstCbu}) difiere de ${mismatch.doc} (${mismatch.val})`,
          documentsInvolved: [cbuValues[0].doc, mismatch.doc],
        });
        inconsistencies.push({
          field: 'cbu',
          fieldLabel: 'Clave Bancaria Uniforme (CBU)',
          valueA: firstCbu,
          sourceA: cbuValues[0].doc,
          valueB: mismatch.val,
          sourceB: mismatch.doc,
          resolved: false,
        });
      } else {
        validations.push({
          id: 'v_cbu_ok',
          title: 'CBU Bancario Validado',
          status: 'valid',
          message: `CBU coincidente en débito y constancia bancaria (${firstCbu})`,
          documentsInvolved: cbuValues.map((c) => c.doc),
        });
      }
    }

    // 5. Comprobante de pago vs Monto abonado
    if (data.monto_abonado.value) {
      validations.push({
        id: 'v_pago_detected',
        title: 'Monto Abonado Detectado',
        status: 'valid',
        message: `$${data.monto_abonado.value} respaldado por ${data.monto_abonado.source}`,
        documentsInvolved: [data.monto_abonado.source],
      });
    } else {
      validations.push({
        id: 'v_pago_missing',
        title: 'Comprobante de Pago',
        status: 'warning',
        message: 'No se detectó comprobante de pago o monto abonado en el legajo.',
        documentsInvolved: [],
      });
    }

    return { validations, inconsistencies };
  }
}
