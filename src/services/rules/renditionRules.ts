/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RenditionMapping {
  plataforma: string;
  empresaPago: string;
}

export class RenditionRules {
  public static mapPlatformToEmpresaPago(plataforma: string): string {
    const p = (plataforma || '').toUpperCase().trim();
    if (p.includes('TRANF') || p.includes('TRANSFERENCIA') || p.includes('BANCO')) {
      return 'TRANSFERENCIA BANCARIA';
    }
    if (p.includes('MERCADO PAGO') || p.includes('MP')) {
      return 'MERCADO LIBRE S.R.L. / MERCADO PAGO';
    }
    if (p.includes('PRISMA') || p.includes('LAPOS')) {
      return 'PRISMA MEDIOS DE PAGO S.A.';
    }
    if (p.includes('CLOVER') || p.includes('FIRST DATA')) {
      return 'FIRST DATA CONO SUR / CLOVER';
    }
    if (p.includes('EFECTIVO') || p.includes('CAJA')) {
      return 'COBRANZA EN CAJA CENTRAL';
    }
    return 'TRANSFERENCIA BANCARIA';
  }

  public static defaultMarca(): string {
    return 'PEUGEOT';
  }

  public static defaultEmpresa(): string {
    return 'CIRCULO DE INVERSORES S.A.U. / PEUGEOT PLAN';
  }
}
