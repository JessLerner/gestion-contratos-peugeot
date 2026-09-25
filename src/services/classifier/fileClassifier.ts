/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentType } from '../../types/operation';

export interface ClassificationResult {
  type: DocumentType;
  label: string;
  confidence: number;
  matchedKeywords: string[];
}

export class FileClassifier {
  /**
   * Classifies a document using text content first, falling back to filename hints if text is sparse.
   */
  public static classify(text: string, filename: string): ClassificationResult {
    const normText = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normName = (filename || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Solicitud de Adhesión / Suscripción
    const suscripcionScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'solicitud de adhesion',
        'solicitud de suscripcion',
        'circulo de inversores',
        'peugeot plan',
        'plan de ahorro',
        'valor movil',
        'cuota pura',
        'adjudicacion',
        'alicuota',
        'concesionario',
        'plazo del plan',
      ],
      nameKeywords: ['solicitud', 'adhesion', 'suscripcion', 'contrato', 'legajo'],
      textWeight: 2.0,
      nameWeight: 1.0,
    });

    // 2. Anexo de Débito Automático / Medio de Pago
    const debitoScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'debito automatico',
        'pago automatico con debito',
        'anexo pago automatico',
        'adhesion al debito',
        'autorizacion de debito',
        'titular de la cuenta',
        'cbu',
        'entidad bancaria',
        'sucursal bancaria',
        'tipo de cuenta',
      ],
      nameKeywords: ['debito', 'medio de pago', 'pago automatico', 'anexo debito', 'banco'],
      textWeight: 2.0,
      nameWeight: 1.2,
    });

    // 3. Comprobante de Transferencia / Pago
    const transferScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'comprobante de transferencia',
        'transferencia realizada',
        'transferencia bancaria',
        'comprobante de pago',
        'monto transferido',
        'importe transferido',
        'cuenta origen',
        'cuenta destino',
        'destinatario',
        'ordenante',
        'coelsa',
        'numero de operacion',
        'transferencia exitosa',
      ],
      nameKeywords: ['transferencia', 'comprobante', 'pago', 'ticket', 'recibo', 'ticket_pago'],
      textWeight: 2.2,
      nameWeight: 1.2,
    });

    // 4. Constancia de CBU / Alias
    const cbuScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'constancia de cbu',
        'comprobante de cbu',
        'alias cbu',
        'alias:',
        'cbu:',
        'clave bancaria uniforme',
        'datos de la cuenta',
        'titular de la cuenta',
        'banco santander',
        'banco galicia',
        'banco provincia',
        'banco nacion',
        'banco bbva',
        'banco macro',
        'banco credicoop',
        'banco comafi',
      ],
      nameKeywords: ['cbu', 'alias', 'constancia_cbu', 'banco_cbu'],
      textWeight: 2.0,
      nameWeight: 1.3,
    });

    // 5. Anexo Entrega Asegurada / Pactada
    const entregaScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'entrega asegurada',
        'anexo entrega asegurada',
        'entrega pactada',
        'adjudicacion asegurada',
        'licitacion pactada',
        'cuota 2',
        'cuota 3',
        'cuota 4',
        'cuota 5',
      ],
      nameKeywords: ['entrega', 'asegurada', 'pactada', 'anexo_entrega'],
      textWeight: 2.5,
      nameWeight: 1.5,
    });

    // 6. DNI Frente y Dorso
    const dniFrenteScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'republica argentina',
        'registro nacional de las personas',
        'documento nacional de identidad',
        'mercosur',
        'apellido',
        'nombres',
        'nacionalidad',
        'sexo',
        'fecha de nacimiento',
      ],
      nameKeywords: ['dni frente', 'dnifrente', 'frente', 'dni_frente', 'dni1'],
      textWeight: 2.0,
      nameWeight: 1.5,
    });

    const dniDorsoScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'domicilio',
        'fecha de emision',
        'cuil',
        'ministro del interior',
        'registro civil',
        'huella',
        'tramite',
      ],
      nameKeywords: ['dni dorso', 'dnidorso', 'dorso', 'dni_dorso', 'dni2', 'reverso'],
      textWeight: 2.0,
      nameWeight: 1.5,
    });

    // General DNI if neither frente nor dorso is distinctive
    const generalDniScore = this.evaluateRules(normText, normName, {
      textKeywords: ['documento nacional de identidad', 'dni', 'renaper'],
      nameKeywords: ['dni', 'documento', 'identidad'],
      textWeight: 1.5,
      nameWeight: 1.0,
    });

    // 7. Confirmación de Suscripción / Mensaje oficial
    const confirmacionScore = this.evaluateRules(normText, normName, {
      textKeywords: [
        'confirmacion de suscripcion',
        'bienvenido a peugeot',
        'estado de solicitud',
        'operacion confirmada',
        'felicitaciones',
      ],
      nameKeywords: ['confirmacion', 'bienvenida', 'resumen'],
      textWeight: 2.0,
      nameWeight: 1.2,
    });

    const scores: Array<{ type: DocumentType; label: string; score: number }> = [
      { type: 'solicitud_adhesion', label: 'Solicitud de Adhesión Peugeot', score: suscripcionScore.score },
      { type: 'medio_pago_debito', label: 'Anexo Débito Automático / Medio de Pago', score: debitoScore.score },
      { type: 'comprobante_transferencia', label: 'Comprobante de Transferencia / Pago', score: transferScore.score },
      { type: 'comprobante_cbu_alias', label: 'Constancia de CBU / Alias Bancario', score: cbuScore.score },
      { type: 'entrega_asegurada', label: 'Anexo Entrega Asegurada', score: entregaScore.score },
      { type: 'dni_frente', label: 'DNI (Frente)', score: Math.max(dniFrenteScore.score, normName.includes('frente') ? generalDniScore.score + 1 : 0) },
      { type: 'dni_dorso', label: 'DNI (Dorso)', score: Math.max(dniDorsoScore.score, (normName.includes('dorso') || normName.includes('reverso')) ? generalDniScore.score + 1 : 0) },
      { type: 'confirmacion_suscripcion', label: 'Confirmación de Suscripción', score: confirmacionScore.score },
    ];

    scores.sort((a, b) => b.score - a.score);
    const top = scores[0];

    if (top && top.score >= 1.5) {
      return {
        type: top.type,
        label: top.label,
        confidence: Math.min(top.score / 5, 0.99),
        matchedKeywords: [],
      };
    }

    // Fallback if DNI general
    if (generalDniScore.score > 0.8) {
      return {
        type: 'dni_frente',
        label: 'DNI / Documento de Identidad',
        confidence: 0.7,
        matchedKeywords: [],
      };
    }

    return {
      type: 'otro_documento',
      label: 'Documento Adicional',
      confidence: 0.5,
      matchedKeywords: [],
    };
  }

  private static evaluateRules(
    text: string,
    filename: string,
    rules: { textKeywords: string[]; nameKeywords: string[]; textWeight: number; nameWeight: number },
  ): { score: number; matches: string[] } {
    let score = 0;
    const matches: string[] = [];

    for (const kw of rules.textKeywords) {
      if (text.includes(kw)) {
        score += rules.textWeight;
        matches.push(kw);
      }
    }

    for (const kw of rules.nameKeywords) {
      if (filename.includes(kw)) {
        score += rules.nameWeight;
        matches.push(`name:${kw}`);
      }
    }

    return { score, matches };
  }
}
