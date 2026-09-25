/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileSpreadsheet, Check, Sparkles } from 'lucide-react';

interface GenerationModalProps {
  isOpen: boolean;
  stepMessage: string;
  progressPercent: number;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({
  isOpen,
  stepMessage,
  progressPercent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <FileSpreadsheet className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2">
          Construyendo Expediente Unificado
        </h3>
        <p className="text-xs text-slate-500 mb-6">{stepMessage}</p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3 border border-slate-200">
          <div
            className="bg-emerald-600 h-3 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
          <span>Progreso de ensamble</span>
          <span className="text-emerald-700 font-bold">{progressPercent}%</span>
        </div>

        {/* Checklist */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-left text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${progressPercent >= 20 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              ✓
            </span>
            <span>1. Portada y resumen general de la operación</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${progressPercent >= 45 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              ✓
            </span>
            <span>2. Minuta de Ventas 2026 completada</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${progressPercent >= 65 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              ✓
            </span>
            <span>3. Planilla de Rendición Peugeot completada</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${progressPercent >= 90 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-100 text-slate-400'}`}>
              ✓
            </span>
            <span>4. Documentos originales (PDFs directos e imágenes A4)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
