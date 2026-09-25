/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocumentType =
  | 'solicitud_adhesion'
  | 'medio_pago_debito'
  | 'comprobante_transferencia'
  | 'comprobante_cbu_alias'
  | 'dni_frente'
  | 'dni_dorso'
  | 'entrega_asegurada'
  | 'confirmacion_suscripcion'
  | 'otro_documento';

export interface ExtractedField<T = string> {
  value: T;
  source: string; // document filename or 'manual'
  confidence: 'Alta' | 'Media' | 'Baja';
  page?: number;
  originalSnippet?: string;
  isModifiedManually?: boolean;
}

export interface InconsistencyItem {
  field: string;
  fieldLabel: string;
  valueA: string;
  sourceA: string;
  valueB: string;
  sourceB: string;
  resolvedValue?: string;
  resolved: boolean;
}

export interface NormalizedOperationData {
  solicitud: ExtractedField;
  modelo_plan: ExtractedField;
  modelo_vehiculo: ExtractedField;
  fecha_venta: ExtractedField;
  sucursal: ExtractedField;
  vendedor: ExtractedField;
  supervisor: ExtractedField;
  titular: ExtractedField;
  fecha_nacimiento: ExtractedField;
  domicilio: ExtractedField;
  ciudad: ExtractedField;
  provincia: ExtractedField;
  codigo_postal: ExtractedField;
  cuil_cuit: ExtractedField;
  dni: ExtractedField;
  telefono_1: ExtractedField;
  telefono_2: ExtractedField;
  email_1: ExtractedField;
  email_2: ExtractedField;
  monto_abonado: ExtractedField;
  tipo_pago: ExtractedField; // 'Pago Completo' | 'Seña' | ''
  forma_pago: ExtractedField; // 'Transferencia' | 'Tarjeta de crédito' | 'Tarjeta de débito' | 'Efectivo' | 'Mercado Pago' | 'Otro'
  sucursal_cobro: ExtractedField;
  subite: ExtractedField; // 'SI' | 'NO' | ''
  grupo: ExtractedField;
  orden: ExtractedField;
  debito_automatico: ExtractedField; // 'SI' | 'NO' | ''
  numero_tarjeta: ExtractedField;
  cbu: ExtractedField;
  banco: ExtractedField;
  numero_cuenta: ExtractedField;
  franja_contacto: ExtractedField;
  entrega_usado: ExtractedField; // 'SI' | 'NO' | ''
  usado_marca: ExtractedField;
  usado_modelo: ExtractedField;
  usado_version: ExtractedField;
  usado_anio: ExtractedField;
  usado_patente: ExtractedField;
  usado_kilometraje: ExtractedField;
  usado_valor_tasacion: ExtractedField;
  observaciones: ExtractedField;
  origen_dato: ExtractedField;
  forma_venta: ExtractedField;
  empresa: ExtractedField;
  sx: ExtractedField;
  cliente: ExtractedField;
  plataforma: ExtractedField;
  importe_rendicion: ExtractedField;
  empresa_pago: ExtractedField;
  // Extra fields for rich Peugeot plan details
  valor_movil?: ExtractedField;
  cuota_pura?: ExtractedField;
  cuota_total?: ExtractedField;
  concesionario?: ExtractedField;
  estado_civil?: ExtractedField;
  nacionalidad?: ExtractedField;
  genero?: ExtractedField;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  type: DocumentType;
  typeLabel: string;
  rawText: string;
  pagesCount: number;
  status: 'pending' | 'processing' | 'processed' | 'error';
  errorMessage?: string;
  binaryData: Uint8Array; // Original file bytes preserved
  previewUrl?: string;
  extractedSnippet?: string;
}

export interface ValidationItem {
  id: string;
  title: string;
  status: 'valid' | 'warning' | 'error';
  message: string;
  documentsInvolved: string[];
}

export interface TraceabilityReport {
  timestamp: string;
  operationId: string;
  solicitud: string;
  titular: string;
  fields: Record<string, {
    value: string;
    source: string;
    confidence: string;
    isModifiedManually?: boolean;
    history?: Array<{ value: string; source: string; timestamp: string }>;
  }>;
  documents: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  validations: ValidationItem[];
}
