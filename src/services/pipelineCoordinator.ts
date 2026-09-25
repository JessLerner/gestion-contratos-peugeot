/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExtractedField,
  InconsistencyItem,
  NormalizedOperationData,
  ProcessedDocument,
  TraceabilityReport,
  ValidationItem,
} from '../types/operation';
import { UnpackedFile, ZipExtractor } from './zip/zipExtractor';
import { FileClassifier } from './classifier/fileClassifier';
import { SubscriptionParser } from './parsers/subscriptionParser';
import { DebitParser } from './parsers/debitParser';
import { PaymentParser } from './parsers/paymentParser';
import { BankParser } from './parsers/bankParser';
import { DniParser } from './parsers/dniParser';
import { ConfirmationParser } from './parsers/confirmationParser';
import { ValidationRules } from './rules/validationRules';
import { RenditionRules } from './rules/renditionRules';
import { GeminiOcrService } from './ai/geminiOcrService';
import { PdfMerger } from './merger/pdfMerger';

export class PipelineCoordinator {
  /**
   * Initializes empty normalized operation data.
   */
  public static createEmptyOperationData(): NormalizedOperationData {
    const emptyField = (): ExtractedField => ({
      value: '',
      source: '',
      confidence: 'Baja',
    });

    return {
      solicitud: emptyField(),
      modelo_plan: emptyField(),
      modelo_vehiculo: emptyField(),
      fecha_venta: emptyField(),
      sucursal: emptyField(),
      vendedor: emptyField(),
      supervisor: emptyField(),
      titular: emptyField(),
      fecha_nacimiento: emptyField(),
      domicilio: emptyField(),
      ciudad: emptyField(),
      provincia: emptyField(),
      codigo_postal: emptyField(),
      cuil_cuit: emptyField(),
      dni: emptyField(),
      telefono_1: emptyField(),
      telefono_2: emptyField(),
      email_1: emptyField(),
      email_2: emptyField(),
      monto_abonado: emptyField(),
      tipo_pago: emptyField(),
      forma_pago: emptyField(),
      sucursal_cobro: emptyField(),
      subite: emptyField(),
      grupo: emptyField(),
      orden: emptyField(),
      debito_automatico: emptyField(),
      numero_tarjeta: emptyField(),
      cbu: emptyField(),
      banco: emptyField(),
      numero_cuenta: emptyField(),
      franja_contacto: emptyField(),
      entrega_usado: emptyField(),
      usado_marca: emptyField(),
      usado_modelo: emptyField(),
      usado_version: emptyField(),
      usado_anio: emptyField(),
      usado_patente: emptyField(),
      usado_kilometraje: emptyField(),
      usado_valor_tasacion: emptyField(),
      observaciones: emptyField(),
      origen_dato: emptyField(),
      forma_venta: emptyField(),
      empresa: emptyField(),
      sx: emptyField(),
      cliente: emptyField(),
      plataforma: emptyField(),
      importe_rendicion: emptyField(),
      empresa_pago: emptyField(),
      valor_movil: emptyField(),
      cuota_pura: emptyField(),
      cuota_total: emptyField(),
      concesionario: emptyField(),
      estado_civil: emptyField(),
      nacionalidad: emptyField(),
      genero: emptyField(),
    };
  }

  /**
   * Processes a list of raw unpacked files (from ZIP or multi-file upload),
   * performs classification, text extraction, OCR, data extraction, and cross-validation.
   */
  public static async processFiles(
    files: UnpackedFile[],
    onProgress?: (step: string, percent: number) => void,
  ): Promise<{
    documents: ProcessedDocument[];
    operationData: NormalizedOperationData;
    validations: ValidationItem[];
    inconsistencies: InconsistencyItem[];
    rawDocExtractions: Map<string, Record<string, string>>;
  }> {
    const documents: ProcessedDocument[] = [];
    const operationData = this.createEmptyOperationData();
    const rawDocExtractions = new Map<string, Record<string, string>>();

    const total = files.length;

    // Step 1: Initial text extraction and classification
    for (let i = 0; i < total; i++) {
      const file = files[i];
      const percent = Math.round(((i + 1) / total) * 60);
      onProgress?.(`Analizando documento (${i + 1}/${total}): ${file.name}`, percent);

      let rawText = '';
      let pagesCount = 1;

      // Extract client-side text if PDF
      if (file.mimeType === 'application/pdf') {
        const textFromBytes = await this.extractTextFromPdfBytes(file.data);
        rawText = textFromBytes.text;
        pagesCount = textFromBytes.pagesCount || 1;
      }

      // Initial classification by content + filename
      let classification = FileClassifier.classify(rawText, file.name);

      // OCR / AI extraction via server API
      // If it's an image or scanned PDF (sparse text), run OCR
      const needsOcr = file.mimeType.startsWith('image/') || (file.mimeType === 'application/pdf' && rawText.length < 50);

      let docFields: Record<string, ExtractedField> = {};

      try {
        const ocrResult = await GeminiOcrService.analyzeDocument(file.name, file.mimeType, file.data);
        if (ocrResult) {
          if (ocrResult.extractedText && ocrResult.extractedText.length > rawText.length) {
            rawText = ocrResult.extractedText;
          }
          if (ocrResult.documentType && ocrResult.documentType !== 'otro_documento') {
            classification.type = ocrResult.documentType as any;
            classification.label = ocrResult.documentTypeLabel || classification.label;
          }
          if (ocrResult.fields) {
            Object.entries(ocrResult.fields).forEach(([k, f]) => {
              if (f.value) {
                docFields[k] = {
                  value: f.value,
                  source: file.name,
                  confidence: f.confidence || 'Alta',
                  originalSnippet: f.originalSnippet,
                };
              }
            });
          }
        }
      } catch (err) {
        console.warn(`Aviso: Error durante análisis OCR para ${file.name}:`, err);
      }

      // Re-classify if rawText changed
      if (classification.type === 'otro_documento') {
        classification = FileClassifier.classify(rawText, file.name);
      }

      // Run specialized parser based on document type
      const parsedFields = this.runSpecializedParser(classification.type, rawText, file.name);

      // Merge specialized parser fields with OCR fields (specialized rule-based fields take priority on exact match)
      const combinedFields: Record<string, string> = {};

      Object.entries(docFields).forEach(([k, v]) => {
        if (v.value) combinedFields[k] = v.value;
      });

      Object.entries(parsedFields).forEach(([k, fieldObj]) => {
        if (fieldObj && fieldObj.value) {
          combinedFields[k] = fieldObj.value;
          docFields[k] = fieldObj;
        }
      });

      rawDocExtractions.set(file.name, combinedFields);

      // Merge into operationData with provenance
      this.mergeDocumentFieldsIntoOperation(operationData, docFields, classification.type);

      documents.push({
        id: `doc_${i}_${Date.now()}`,
        name: file.name,
        originalName: file.name,
        size: file.size,
        mimeType: file.mimeType,
        type: classification.type,
        typeLabel: classification.label,
        rawText,
        pagesCount,
        status: 'processed',
        binaryData: file.data,
        extractedSnippet: rawText.slice(0, 180),
      });
    }

    onProgress?.('Realizando validación cruzada entre documentos...', 80);

    // Apply rendition rules
    if (!operationData.empresa.value) {
      operationData.empresa = {
        value: RenditionRules.defaultEmpresa(),
        source: 'regla_peugeot',
        confidence: 'Alta',
      };
    }
    if (operationData.plataforma.value && !operationData.empresa_pago.value) {
      operationData.empresa_pago = {
        value: RenditionRules.mapPlatformToEmpresaPago(operationData.plataforma.value),
        source: 'regla_plataforma',
        confidence: 'Alta',
      };
    }

    // Step 2: Cross-validation and inconsistency detection
    const { validations, inconsistencies } = ValidationRules.runCrossValidation(
      operationData,
      documents,
      rawDocExtractions,
    );

    onProgress?.('Extracción completada con éxito', 100);

    return {
      documents,
      operationData,
      validations,
      inconsistencies,
      rawDocExtractions,
    };
  }

  /**
   * Runs the domain parser corresponding to the classified document type.
   */
  private static runSpecializedParser(type: string, text: string, filename: string): Record<string, ExtractedField | undefined> {
    switch (type) {
      case 'solicitud_adhesion':
        return SubscriptionParser.parse(text, filename);
      case 'medio_pago_debito':
        return DebitParser.parse(text, filename);
      case 'comprobante_transferencia':
        return PaymentParser.parse(text, filename);
      case 'comprobante_cbu_alias':
        return BankParser.parse(text, filename);
      case 'dni_frente':
      case 'dni_dorso':
        return DniParser.parse(text, filename);
      case 'confirmacion_suscripcion':
      case 'entrega_asegurada':
        return ConfirmationParser.parse(text, filename);
      default:
        // Run subscription parser as fallback if text is substantial
        if (text.length > 200) {
          return SubscriptionParser.parse(text, filename);
        }
        return {};
    }
  }

  /**
   * Merges extracted fields into the normalized operation record, respecting priority rules.
   */
  private static mergeDocumentFieldsIntoOperation(
    target: NormalizedOperationData,
    fields: Record<string, ExtractedField>,
    docType: string,
  ) {
    const keys = Object.keys(fields) as Array<keyof NormalizedOperationData>;

    for (const key of keys) {
      const field = fields[key];
      if (!field || !field.value) continue;

      const current = target[key];

      // Priority 1: User manual changes are never overwritten
      if (current && current.isModifiedManually) {
        continue;
      }

      // Priority 2: Solicitud de Adhesión is primary for titular, solicitud, plan, modelo, domicilio
      const isPrimaryDoc = docType === 'solicitud_adhesion';

      if (!current || !current.value) {
        target[key] = field;
      } else if (isPrimaryDoc) {
        target[key] = field;
      } else if (field.confidence === 'Alta' && current.confidence !== 'Alta') {
        target[key] = field;
      }
    }
  }

  /**
   * Robust text extractor for digital PDFs.
   * Leverages pdf-parse in Node/SSR and DecompressionStream in modern browsers.
   */
  private static async extractTextFromPdfBytes(bytes: Uint8Array): Promise<{ text: string; pagesCount: number }> {
    let pagesCount = 1;

    // 1. Try pdf-parse
    try {
      const pdfParseModule = await import('pdf-parse');
      const PDFParseClass = (pdfParseModule as any).PDFParse;
      if (PDFParseClass) {
        // Clone bytes so underlying buffer is never detached by PDFParse worker
        const bytesCopy = new Uint8Array(bytes);
        const parser = new PDFParseClass({ data: bytesCopy });
        const res = await parser.getText();
        if (res && res.text) {
          await parser.destroy?.();
          return { text: res.text.trim(), pagesCount: res.total || 1 };
        }
      }
    } catch {
      // Continue to stream decompression fallback
    }

    let text = '';

    try {
      const latin1 = new TextDecoder('latin1').decode(bytes);

      // Count pages
      const pageMatches = latin1.match(/\/Type\s*\/Page\b/g);
      if (pageMatches) {
        pagesCount = Math.max(1, pageMatches.length);
      }

      // 2. Extract literal Tj and TJ
      const tjMatches = latin1.match(/\((.*?)\)\s*Tj/g);
      if (tjMatches) {
        const extractedLines = tjMatches.map((m) => {
          return m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').replace(/\\([()\\])/g, '$1');
        });
        text += extractedLines.join(' ');
      }

      // 3. Decompress FlateDecode streams if DecompressionStream is available
      if (typeof DecompressionStream !== 'undefined') {
        const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
        let match: RegExpExecArray | null;

        while ((match = streamRegex.exec(latin1)) !== null) {
          try {
            const rawBytes = bytes.subarray(match.index + match[0].indexOf('\n') + 1, match.index + match[0].lastIndexOf('\n'));
            const ds = new DecompressionStream('deflate');
            const writer = ds.writable.getWriter();
            writer.write(rawBytes as any);
            writer.close();
            const reader = ds.readable.getReader();
            let decompressed = new Uint8Array(0);
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const next = new Uint8Array(decompressed.length + value.length);
              next.set(decompressed);
              next.set(value, decompressed.length);
              decompressed = next;
            }

            const streamText = new TextDecoder('latin1').decode(decompressed);

            // Extract hex-encoded Tj: <534F4C494349545544> Tj
            const hexMatches = streamText.match(/<([0-9A-Fa-f]+)>\s*Tj/g);
            if (hexMatches) {
              for (const hm of hexMatches) {
                const hex = hm.replace(/^</, '').replace(/>\s*Tj$/, '');
                let decoded = '';
                for (let c = 0; c < hex.length; c += 2) {
                  decoded += String.fromCharCode(parseInt(hex.substr(c, 2), 16));
                }
                text += ' ' + decoded;
              }
            }

            // Extract literal Tj: (Hello) Tj
            const litMatches = streamText.match(/\((.*?)\)\s*Tj/g);
            if (litMatches) {
              for (const lm of litMatches) {
                text += ' ' + lm.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
              }
            }
          } catch {
            // Non-deflate or malformed stream, ignore
          }
        }
      }
    } catch (e) {
      console.warn('Extracción básica de texto PDF:', e);
    }

    return { text: text.trim(), pagesCount };
  }

  /**
   * Builds the internal traceability audit report JSON.
   */
  public static buildTraceabilityReport(
    operationData: NormalizedOperationData,
    documents: ProcessedDocument[],
    validations: ValidationItem[],
  ): TraceabilityReport {
    const fieldsRecord: TraceabilityReport['fields'] = {};

    Object.entries(operationData).forEach(([k, f]) => {
      if (f && typeof f === 'object' && 'value' in f) {
        fieldsRecord[k] = {
          value: f.value,
          source: f.source,
          confidence: f.confidence,
          isModifiedManually: f.isModifiedManually,
        };
      }
    });

    return {
      timestamp: new Date().toISOString(),
      operationId: operationData.solicitud.value || `OP_${Date.now()}`,
      solicitud: operationData.solicitud.value,
      titular: operationData.titular.value,
      fields: fieldsRecord,
      documents: documents.map((d) => ({
        name: d.name,
        type: d.typeLabel,
        size: d.size,
      })),
      validations,
    };
  }
}
