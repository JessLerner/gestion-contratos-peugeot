/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, FileCheck, Layers, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentStep: 'upload' | 'review' | 'result';
  onReset: () => void;
  onDownloadSampleZip: () => void;
  isDownloadingSample?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onReset,
  onDownloadSampleZip,
  isDownloadingSample,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md border border-blue-400">
            <span className="text-xl tracking-tighter">P</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">AutoDoc Peugeot</h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-900/80 text-blue-300 border border-blue-700">
                Plan de Ahorro
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automatización de Minuta de Ventas 2026, Planilla de Rendición y PDF Consolidado
            </p>
          </div>
        </div>

        {/* Stepper tracker */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${currentStep === 'upload' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'}`}>
            <Layers className="w-3.5 h-3.5" />
            <span>1. Cargar ZIP</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${currentStep === 'review' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'}`}>
            <FileCheck className="w-3.5 h-3.5" />
            <span>2. Revisar Datos</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${currentStep === 'result' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400'}`}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>3. PDF Final</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadSampleZip}
            disabled={isDownloadingSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Descargar archivo ZIP de prueba con documentos reales para probar el sistema"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>{isDownloadingSample ? 'Preparando...' : 'Descargar ZIP de Ejemplo'}</span>
          </button>

          {currentStep !== 'upload' && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Iniciar nueva operación"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Nueva Operación</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/80">
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">Datos Seguros</span>
          </div>
        </div>
      </div>
    </header>
  );
};
