/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedField } from '../../types/operation';

export interface FieldExtractionResult {
  [key: string]: ExtractedField | undefined;
}

export class BaseParser {
  public static cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  public static createField(
    value: string,
    source: string,
    confidence: 'Alta' | 'Media' | 'Baja' = 'Alta',
    page?: number,
    originalSnippet?: string,
  ): ExtractedField {
    return {
      value: (value || '').trim(),
      source,
      confidence,
      page,
      originalSnippet: originalSnippet ? originalSnippet.trim() : undefined,
    };
  }

  /**
   * Extracts CBU (22 consecutive digits or spaced digits).
   */
  public static extractCbu(text: string): string | null {
    // 22 digits, sometimes formatted as 07207046-88000035033390 or 07207046 88000035033390
    const match = text.match(/\b(\d{8})[\s-]?(\d{14})\b/);
    if (match) {
      return `${match[1]}${match[2]}`;
    }
    const match22 = text.match(/\b\d{22}\b/);
    return match22 ? match22[0] : null;
  }

  /**
   * Extracts CUIL/CUIT (e.g., 20-24798197-3 or 20247981973).
   */
  public static extractCuil(text: string): string | null {
    const formattedMatch = text.match(/\b(20|23|24|27|30|33|34)-(\d{7,8})-(\d)\b/);
    if (formattedMatch) {
      return `${formattedMatch[1]}-${formattedMatch[2]}-${formattedMatch[3]}`;
    }
    const plainMatch = text.match(/\b(20|23|24|27|30|33|34)(\d{7,8})(\d)\b/);
    if (plainMatch) {
      return `${plainMatch[1]}-${plainMatch[2]}-${plainMatch[3]}`;
    }
    return null;
  }

  /**
   * Extracts DNI (7 or 8 digits).
   */
  public static extractDni(text: string): string | null {
    // Look specifically for DNI: 24.798.197 or D.N.I. 24798197 or Documento Nº 24.798.197
    // Explicitly exclude "solicitud"
    const dniContextMatch = text.match(/(?<!solicitud[\s\S]{0,10})(?:dni|d\.n\.i|documento(?:\s*de\s*identidad)?|documento\s*n[°º]|doc\.?)[\s.:]*([1-9][0-9]{0,1}\.?[0-9]{3}\.?[0-9]{3})\b/i);
    if (dniContextMatch) {
      const clean = dniContextMatch[1].replace(/\./g, '');
      if (clean.length >= 7 && clean.length <= 8) {
        return clean;
      }
    }
    return null;
  }

  /**
   * Extracts dates in DD/MM/YYYY or DD-MM-YYYY format.
   */
  public static extractDate(text: string, contextKeyword?: string): string | null {
    if (contextKeyword) {
      const regex = new RegExp(`${contextKeyword}[^0-9]{0,30}(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})`, 'i');
      const m = text.match(regex);
      if (m) return this.standardizeDate(m[1]);
    }
    const generalMatch = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2})\b/);
    if (generalMatch) {
      return this.standardizeDate(generalMatch[1]);
    }
    return null;
  }

  private static standardizeDate(d: string): string {
    const parts = d.replace(/-/g, '/').split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) {
        year = parseInt(year, 10) > 40 ? `19${year}` : `20${year}`;
      }
      return `${day}/${month}/${year}`;
    }
    return d;
  }

  /**
   * Extracts currency amount (e.g., $960.000,00 or 960000 or $ 960.000).
   */
  public static extractAmount(text: string, contextKeyword?: string): string | null {
    const patterns = contextKeyword
      ? [
          new RegExp(`${contextKeyword}[^0-9$]{0,25}\\$?\\s*([0-9]{1,3}(?:\\.[0-9]{3})*(?:,[0-9]{2})?)`, 'i'),
          new RegExp(`${contextKeyword}[^0-9$]{0,25}\\$?\\s*([0-9]{4,9}(?:,[0-9]{2})?)`, 'i'),
        ]
      : [
          /\$\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{2})?)/,
          /(?:importe|monto|total|abonado|transferido)[\s.:$]*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i,
        ];

    for (const pat of patterns) {
      const m = text.match(pat);
      if (m && m[1]) {
        return m[1].trim();
      }
    }
    return null;
  }

  /**
   * Extracts email addresses.
   */
  public static extractEmail(text: string): string | null {
    const m = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    return m ? m[0].toLowerCase() : null;
  }

  /**
   * Extracts phone number.
   */
  public static extractPhone(text: string): string | null {
    const m = text.match(/(?:tel|cel|telefono|celular|movil)[\s.:]*([+0-9()\s-]{8,20})/i);
    if (m) {
      const cleaned = m[1].replace(/[^\d+]/g, '');
      if (cleaned.length >= 8) return m[1].trim();
    }
    return null;
  }
}
