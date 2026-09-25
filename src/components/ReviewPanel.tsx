/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  Edit2,
  FileSpreadsheet,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { ExtractedField, InconsistencyItem, NormalizedOperationData, ValidationItem } from '../types/operation';
import { FieldAuditModal } from './FieldAuditModal';

interface ReviewPanelProps {
  operationData: NormalizedOperationData;
  validations: ValidationItem[];
  inconsistencies: InconsistencyItem[];
  onUpdateField: (fieldName: keyof NormalizedOperationData, newValue: string) => void;
  onResolveInconsistency: (index: number, chosenValue: string) => void;
  onGenerateDocumentation: () => void;
  isGenerating: boolean;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  operationData,
  validations,
  inconsistencies,
  onUpdateField,
  onResolveInconsistency,
  onGenerateDocumentation,
  isGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'extracted' | 'missing' | 'inconsistencies'>('extracted');
  const [selectedFieldForAudit, setSelectedFieldForAudit] = useState<{
    name: keyof NormalizedOperationData;
    label: string;
    field: ExtractedField;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Field definitions with friendly Spanish labels and category grouping
  const fieldDefinitions: Array<{
    key: keyof NormalizedOperationData;
    label: string;
    category: 'operacion' | 'titular' | 'pago' | 'banco' | 'usado';
    required?: boolean;
  }> = [
    // Operación
    { key: 'solicitud', label: 'N° de Solicitud (SX)', category: 'operacion', required: true },
    { key: 'modelo_vehiculo', label: 'Modelo de Vehículo', category: 'operacion', required: true },
    { key: 'modelo_plan', label: 'Modalidad de Plan', category: 'operacion', required: true },
    { key: 'fecha_venta', label: 'Fecha de Operación', category: 'operacion', required: true },
    { key: 'sucursal', label: 'Sucursal / Concesionario', category: 'operacion' },
    { key: 'vendedor', label: 'Vendedor / Asesor', category: 'operacion' },
    { key: 'supervisor', label: 'Supervisor', category: 'operacion' },

    // Titular
    { key: 'titular', label: 'Apellido y Nombre del Titular', category: 'titular', required: true },
    { key: 'dni', label: 'DNI Titular', category: 'titular', required: true },
    { key: 'cuil_cuit', label: 'CUIL / CUIT', category: 'titular', required: true },
    { key: 'fecha_nacimiento', label: 'Fecha de Nacimiento', category: 'titular' },
    { key: 'domicilio', label: 'Domicilio Completo', category: 'titular' },
    { key: 'ciudad', label: 'Ciudad / Localidad', category: 'titular' },
    { key: 'provincia', label: 'Provincia', category: 'titular' },
    { key: 'codigo_postal', label: 'Código Postal', category: 'titular' },
    { key: 'telefono_1', label: '1° Teléfono Celular', category: 'titular' },
    { key: 'telefono_2', label: '2° Teléfono', category: 'titular' },
    { key: 'email_1', label: 'Email Principal', category: 'titular' },

    // Pago & Rendición
    { key: 'monto_abonado', label: 'Monto Abonado ($)', category: 'pago', required: true },
    { key: 'forma_pago', label: 'Forma de Pago', category: 'pago', required: true },
    { key: 'tipo_pago', label: 'Pago Completo / Seña', category: 'pago' },
    { key: 'plataforma', label: 'Plataforma Rendición', category: 'pago' },
    { key: 'empresa_pago', label: 'Empresa de Pago', category: 'pago' },
    { key: 'empresa', label: 'Empresa Emisora', category: 'pago' },

    // Banco & Débito
    { key: 'debito_automatico', label: 'Débito Automático (SI/NO)', category: 'banco' },
    { key: 'banco', label: 'Entidad Bancaria', category: 'banco' },
    { key: 'cbu', label: 'CBU Bancario (22 dígitos)', category: 'banco' },
    { key: 'numero_cuenta', label: 'Número de Cuenta', category: 'banco' },
    { key: 'numero_tarjeta', label: 'Número de Tarjeta (si aplica)', category: 'banco' },

    // Usado & Subite
    { key: 'subite', label: 'Plan Subite / Reencause (SI/NO)', category: 'usado' },
    { key: 'grupo', label: 'Grupo', category: 'usado' },
    { key: 'orden', label: 'Orden', category: 'usado' },
    { key: 'entrega_usado', label: 'Entrega de Usado (SI/NO)', category: 'usado' },
    { key: 'usado_marca', label: 'Usado - Marca', category: 'usado' },
    { key: 'usado_modelo', label: 'Usado - Modelo', category: 'usado' },
    { key: 'usado_anio', label: 'Usado - Año', category: 'usado' },
    { key: 'usado_patente', label: 'Usado - Patente', category: 'usado' },
    { key: 'usado_valor_tasacion', label: 'Usado - Tasación Declarada', category: 'usado' },
    { key: 'observaciones', label: 'Observaciones Administrativas', category: 'usado' },
  ];

  // Derived counts
  const extractedList = fieldDefinitions.filter((def) => {
    const f = operationData[def.key];
    return f && f.value && f.value.trim().length > 0;
  });

  const missingList = fieldDefinitions.filter((def) => {
    const f = operationData[def.key];
    return !f || !f.value || f.value.trim().length === 0;
  });

  const unresolvedInconsistencies = inconsistencies.filter((i) => !i.resolved);

  // Filtered by search
  const filteredExtracted = extractedList.filter((item) => {
    const q = searchTerm.toLowerCase();
    const val = operationData[item.key]?.value || '';
    return item.label.toLowerCase().includes(q) || val.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Banner with Stats & Action */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Paso 2 de 3: Revisión Previa
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Solicitud: {operationData.solicitud.value || 'Pendiente'} - Titular:{' '}
                {operationData.titular.value || 'Pendiente'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Control de Calidad Documental
            </h2>
            <p className="text-xs text-slate-500 max-w-xl">
              Revise los datos extraídos por OCR y lectura directa antes de generar la Minuta de Ventas y la Planilla de Rendición.
              Puede hacer clic en cualquier campo para auditar su documento de origen o corregir su valor.
            </p>
          </div>

          <button
            onClick={onGenerateDocumentation}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isGenerating ? 'Generando PDF...' : 'GENERAR DOCUMENTACIÓN FINAL'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Validation check strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('extracted')}
            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
              activeTab === 'extracted'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Datos Extraídos
              </div>
              <div className="text-lg font-black text-slate-900">{extractedList.length}</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </button>

          <button
            onClick={() => setActiveTab('missing')}
            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
              activeTab === 'missing'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Datos Faltantes
              </div>
              <div className="text-lg font-black text-slate-900">{missingList.length}</div>
            </div>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </button>

          <button
            onClick={() => setActiveTab('inconsistencies')}
            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
              activeTab === 'inconsistencies'
                ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Inconsistencias
              </div>
              <div className="text-lg font-black text-slate-900">
                {unresolvedInconsistencies.length}
              </div>
            </div>
            <AlertTriangle
              className={`w-5 h-5 ${unresolvedInconsistencies.length > 0 ? 'text-red-600' : 'text-slate-400'}`}
            />
          </button>
        </div>
      </div>

      {/* Validation Checklist Card */}
      {validations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Validación Cruzada entre Documentos ({validations.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {validations.map((v) => {
              const isOk = v.status === 'valid';
              const isErr = v.status === 'error';
              return (
                <div
                  key={v.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                    isOk
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : isErr
                      ? 'bg-red-50/60 border-red-200 text-red-950'
                      : 'bg-amber-50/50 border-amber-200 text-amber-950'
                  }`}
                >
                  {isOk ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : isErr ? (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-[11px] truncate">{v.title}</div>
                    <div className="text-[10px] text-slate-600 leading-tight mt-0.5">{v.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: DATOS EXTRAÍDOS */}
      {activeTab === 'extracted' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Campos Extraídos de la Documentación ({filteredExtracted.length})
              </h3>
              <p className="text-xs text-slate-500">
                Haga clic en cualquier campo para auditar su documento de origen o editarlo
              </p>
            </div>

            <div className="relative w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar campo o valor..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredExtracted.map((item) => {
              const field = operationData[item.key];
              const isHigh = field?.confidence === 'Alta';
              const isMed = field?.confidence === 'Media';

              return (
                <div
                  key={item.key}
                  className="px-6 py-3 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      {item.required && (
                        <span className="text-[9px] text-red-600 font-bold uppercase">Requerido</span>
                      )}
                      {field?.isModifiedManually && (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Editado manual
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Origen: {field?.source || 'Automático'}</span>
                      {field?.page && <span>• Pág. {field.page}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isHigh
                          ? 'bg-emerald-100 text-emerald-800'
                          : isMed
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {field?.confidence || 'Alta'}
                    </span>

                    <div className="w-64 sm:w-80">
                      <input
                        type="text"
                        value={field?.value || ''}
                        onChange={(e) => onUpdateField(item.key, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <button
                      onClick={() =>
                        setSelectedFieldForAudit({
                          name: item.key,
                          label: item.label,
                          field: field!,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Auditar origen exacto"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DATOS FALTANTES */}
      {activeTab === 'missing' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Campos No Encontrados ({missingList.length})
              </h3>
              <p className="text-xs text-slate-600">
                Principio fundamental: No se inventan datos. Si desea incorporarlos, ingréselos aquí manualmente.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900">
              Opcionales / Manual
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {missingList.map((item) => (
              <div
                key={item.key}
                className="px-6 py-3 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.required && (
                      <span className="text-[9px] text-red-600 font-bold uppercase">Recomendado</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">No detectado en los documentos del ZIP</span>
                </div>

                <div className="w-64 sm:w-80">
                  <input
                    type="text"
                    placeholder="Ingresar manualmente si corresponde..."
                    value={operationData[item.key]?.value || ''}
                    onChange={(e) => onUpdateField(item.key, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INCONSISTENCIAS */}
      {activeTab === 'inconsistencies' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-red-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Discrepancias Documentales Detectadas ({unresolvedInconsistencies.length})
              </h3>
              <p className="text-xs text-slate-600">
                Cuando dos documentos presentan datos distintos, el sistema no decide arbitrariamente. Seleccione el valor correcto.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
              Control de Integridad
            </span>
          </div>

          {unresolvedInconsistencies.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800 text-sm">
                No se detectaron inconsistencias
              </div>
              <div className="text-xs text-slate-500">
                Los datos entre la Solicitud de Adhesión, DNI, CBU y Comprobantes son coherentes.
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {inconsistencies.map((inc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{inc.fieldLabel}</span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Requiere confirmación
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Option A */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          Documento A: {inc.sourceA}
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{inc.valueA}</div>
                      </div>
                      <button
                        onClick={() => onResolveInconsistency(idx, inc.valueA)}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition"
                      >
                        Utilizar Valor A
                      </button>
                    </div>

                    {/* Option B */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          Documento B: {inc.sourceB}
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{inc.valueB}</div>
                      </div>
                      <button
                        onClick={() => onResolveInconsistency(idx, inc.valueB)}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition"
                      >
                        Utilizar Valor B
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Field Audit Modal */}
      {selectedFieldForAudit && (
        <FieldAuditModal
          fieldName={selectedFieldForAudit.name as string}
          fieldLabel={selectedFieldForAudit.label}
          field={selectedFieldForAudit.field}
          isOpen={!!selectedFieldForAudit}
          onClose={() => setSelectedFieldForAudit(null)}
          onSaveManualValue={(fName, nVal) => {
            onUpdateField(fName as keyof NormalizedOperationData, nVal);
          }}
        />
      )}
    </div>
  );
};
