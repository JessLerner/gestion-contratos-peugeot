/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  FileCheck,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { NormalizedOperationData, ProcessedDocument, TraceabilityReport } from '../types/operation';

interface ResultViewProps {
  pdfBytes: Uint8Array;
  filename: string;
  operationData: NormalizedOperationData;
  documents: ProcessedDocument[];
  traceabilityReport: TraceabilityReport;
  onDownloadExcel: () => void;
  onDownloadTraceabilityJson: () => void;
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  pdfBytes,
  filename,
  operationData,
  documents,
  traceabilityReport,
  onDownloadExcel,
  onDownloadTraceabilityJson,
  onReset,
}) => {
  const [showViewer, setShowViewer] = useState(true);

  // Create Blob and object URL for PDF
  const pdfBlob = React.useMemo(() => {
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }, [pdfBytes]);

  const pdfUrl = React.useMemo(() => {
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob]);

  const handleDownloadPdf = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fileSizeMb = (pdfBytes.byteLength / (1024 * 1024)).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Success Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-1.5">
                ✓ Proceso Finalizado con Éxito
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Expediente Administrativo Consolidado
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Se generó un único PDF final listo para revisar, guardar o enviar, reuniendo la portada, la Minuta de Ventas 2026, la Planilla de Rendición y todos los documentos originales.
              </p>
            </div>
          </div>

          {/* Master 1-Click Download Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div>DESCARGAR PDF FINAL</div>
              <div className="text-[11px] font-normal opacity-90">{filename} ({fileSizeMb} MB)</div>
            </div>
          </button>
        </div>

        {/* Breakdown of what's inside the PDF */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Página 1</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              Portada y Resumen
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Página 2</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              Minuta de Ventas 2026
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Página 3</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Planilla de Rendición
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Páginas siguientes</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              {documents.length} Docs Originales
            </span>
          </div>
        </div>

        {/* Secondary download options */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
              title="Descargar la planilla de rendición en formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descargar Planilla (.xlsx)</span>
            </button>

            <button
              onClick={onDownloadTraceabilityJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
              title="Descargar informe técnico de auditoría y trazabilidad en JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Informe de Trazabilidad (.json)</span>
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Abrir en nueva pestaña</span>
            </a>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Procesar otra operación</span>
          </button>
        </div>
      </div>

      {/* Embedded PDF Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Vista Previa del PDF Consolidado</span>
            <span className="text-slate-400">({filename})</span>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>
        </div>

        <div className="w-full h-[750px] bg-slate-100">
          <iframe
            src={pdfUrl}
            title="Vista previa del PDF de operación"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
