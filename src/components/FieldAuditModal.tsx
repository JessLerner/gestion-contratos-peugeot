/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, FileText, CheckCircle, Edit3, ShieldAlert } from 'lucide-react';
import { ExtractedField } from '../types/operation';

interface FieldAuditModalProps {
  fieldName: string;
  fieldLabel: string;
  field: ExtractedField;
  isOpen: boolean;
  onClose: () => void;
  onSaveManualValue: (fieldName: string, newValue: string) => void;
}

export const FieldAuditModal: React.FC<FieldAuditModalProps> = ({
  fieldName,
  fieldLabel,
  field,
  isOpen,
  onClose,
  onSaveManualValue,
}) => {
  const [val, setVal] = useState(field?.value || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveManualValue(fieldName, val);
    onClose();
  };

  const isHigh = field?.confidence === 'Alta';
  const isMed = field?.confidence === 'Media';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Auditoría de Origen de Dato</h3>
              <p className="text-xs text-slate-500">{fieldLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Valor actual editable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Valor para Minuta y Planilla:</span>
              {field?.isModifiedManually && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Modificado manualmente
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-900 shadow-inner"
              />
              <Edit3 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Provenance Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Documento de Origen:</span>
              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {field?.source || 'No identificado / Manual'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Nivel de Confianza:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isHigh
                    ? 'bg-emerald-100 text-emerald-800'
                    : isMed
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {field?.confidence || 'Baja'}
              </span>
            </div>

            {field?.page && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Página:</span>
                <span className="font-semibold text-slate-700">{field.page}</span>
              </div>
            )}
          </div>

          {/* Snippet from original document */}
          {field?.originalSnippet && (
            <div>
              <span className="block text-slate-500 font-medium mb-1">
                Fragmento de texto detectado en el documento original:
              </span>
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed max-h-28 overflow-y-auto border border-slate-800">
                "{field.originalSnippet}"
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Cualquier cambio manual prevalecerá en la generación final y quedará registrado internamente con{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-semibold">source: "manual"</code>.
            </span>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Guardar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};
