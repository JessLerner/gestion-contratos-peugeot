/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeminiExtractionResult {
  documentType?: string;
  documentTypeLabel?: string;
  extractedText?: string;
  fields?: Record<
    string,
    {
      value: string;
      confidence: 'Alta' | 'Media' | 'Baja';
      originalSnippet?: string;
    }
  >;
}

export class GeminiOcrService {
  /**
   * Sends file binary to the server-side Gemini OCR/multimodal parser.
   */
  public static async analyzeDocument(
    filename: string,
    mimeType: string,
    data: Uint8Array,
  ): Promise<GeminiExtractionResult | null> {
    try {
      // If running in Node.js without a base URL, skip browser endpoint fetch
      if (typeof window === 'undefined') {
        return null;
      }

      const base64Data = this.uint8ArrayToBase64(data);

      const response = await fetch('/api/gemini-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          mimeType,
          base64Data,
        }),
      });

      if (!response.ok) {
        console.warn(`Respuesta no exitosa de /api/gemini-extract para ${filename}: ${response.status}`);
        return null;
      }

      const json = await response.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (err) {
      console.warn(`No se pudo conectar con el servicio OCR para ${filename}. Se utilizará análisis local.`, err);
      return null;
    }
  }

  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    // Chunking to avoid stack overflow with large files
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  }
}
