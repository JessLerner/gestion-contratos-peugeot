/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import express, { Request, Response } from 'express';

export function createApiRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '50mb' }));

  // Initialize Gemini if API key is provided
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  router.post('/gemini-extract', async (req: Request, res: Response) => {
    try {
      const { filename, mimeType, base64Data } = req.body;

      if (!base64Data) {
        return res.status(400).json({ error: 'Falta base64Data' });
      }

      // 1. If PDF, attempt local fast text extraction first
      let localExtractedText = '';
      if (mimeType === 'application/pdf' || (filename && filename.toLowerCase().endsWith('.pdf'))) {
        try {
          const buffer = Buffer.from(base64Data, 'base64');
          // Dynamically import pdf-parse
          const pdfParseModule = await import('pdf-parse');
          const PDFParseClass = (pdfParseModule as any).PDFParse;
          if (PDFParseClass) {
            const parser = new PDFParseClass({ data: new Uint8Array(buffer) });
            const parsed = await parser.getText();
            localExtractedText = parsed?.text || '';
            await parser.destroy?.();
          }
        } catch (pdfErr) {
          console.warn('PDF text extraction notice:', pdfErr);
        }
      }

      // If text is already extracted and extensive (> 200 chars), we can optionally still run Gemini or return
      // If we have Gemini available, use gemini-3.8-flash for perfect multimodal extraction
      if (ai) {
        const prompt = `Analiza este documento de una operación de suscripción de Plan de Ahorro automotor Peugeot (Argentina).
Nombre de archivo: "${filename || 'documento'}".
Texto extraído previamente (si lo hay):
"""
${localExtractedText.slice(0, 3000)}
"""

Extrae ÚNICAMENTE los datos que aparezcan de forma explícita y certera en el documento.
PRINCIPIO FUNDAMENTAL: NO INVENTES NINGÚN DATO. Si un dato no figura, devuelve cadena vacía "".
Si encuentras campos relevantes, asígnales confianza 'Alta', 'Media' o 'Baja' y el fragmento original.

Devuelve estrictamente un JSON con este formato:
{
  "documentType": "solicitud_adhesion" | "medio_pago_debito" | "comprobante_transferencia" | "comprobante_cbu_alias" | "dni_frente" | "dni_dorso" | "entrega_asegurada" | "confirmacion_suscripcion" | "otro_documento",
  "documentTypeLabel": "Nombre legible del tipo de documento",
  "extractedText": "Texto completo o resumen del documento",
  "fields": {
    "solicitud": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "titular": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "dni": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "cuil_cuit": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "fecha_venta": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "fecha_nacimiento": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "domicilio": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "ciudad": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "provincia": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "codigo_postal": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "telefono_1": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "telefono_2": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "email_1": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "modelo_vehiculo": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "modelo_plan": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "monto_abonado": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "forma_pago": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "tipo_pago": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "debito_automatico": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "cbu": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "banco": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "numero_cuenta": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "concesionario": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "vendedor": { "value": "", "confidence": "Alta", "originalSnippet": "" },
    "supervisor": { "value": "", "confidence": "Alta", "originalSnippet": "" }
  }
}`;

        try {
          const parts: any[] = [];
          if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
          parts.push({ text: prompt });

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const responseText = response.text || '{}';
          const parsedJson = JSON.parse(responseText);

          return res.json({
            success: true,
            data: {
              ...parsedJson,
              extractedText: parsedJson.extractedText || localExtractedText,
            },
          });
        } catch (geminiError: any) {
          console.error('Error al llamar a Gemini API:', geminiError?.message || geminiError);
          // Fall back to local text response if available
        }
      }

      // Fallback response with local text
      return res.json({
        success: true,
        data: {
          documentType: 'otro_documento',
          documentTypeLabel: 'Documento procesado localmente',
          extractedText: localExtractedText,
          fields: {},
        },
      });
    } catch (err: any) {
      console.error('API Error in /gemini-extract:', err);
      return res.status(500).json({ error: err.message || 'Error procesando documento' });
    }
  });

  return router;
}
