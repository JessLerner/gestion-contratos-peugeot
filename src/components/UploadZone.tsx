/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, FileArchive, CheckCircle2, ShieldAlert, Sparkles, FolderUp, AlertCircle } from 'lucide-react';
import { UnpackedFile, ZipExtractor } from '../services/zip/zipExtractor';

interface UploadZoneProps {
  onFilesSelected: (files: UnpackedFile[]) => void;
  onLoadSample: () => void;
  isLoading: boolean;
  loadingMessage?: string;
  loadingProgress?: number;
  error?: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onLoadSample,
  isLoading,
  loadingMessage,
  loadingProgress = 0,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setLocalError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFiles(Array.from(e.target.files));
    }
  };

  const processSelectedFiles = async (files: File[]) => {
    try {
      // If a single ZIP file was dropped/selected
      if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
        const zipFile = files[0];
        const arrayBuffer = await zipFile.arrayBuffer();
        const extracted = await ZipExtractor.extractZip(arrayBuffer);
        onFilesSelected(extracted);
        return;
      }

      // If multiple files or individual PDFs / images were selected
      const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
      const validFiles = files.filter((f) => {
        const lower = f.name.toLowerCase();
        return allowedExt.some((ext) => lower.endsWith(ext));
      });

      if (validFiles.length === 0) {
        throw new Error('Seleccione un archivo .zip o documentos individuales en formato PDF, JPG o PNG.');
      }

      const unpackedList: UnpackedFile[] = [];
      for (const f of validFiles) {
        const buffer = await f.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        unpackedList.push({
          name: f.name,
          relativePath: f.name,
          size: f.size,
          mimeType: ZipExtractor.detectMimeType(f.name, uint8),
          data: uint8,
        });
      }

      onFilesSelected(unpackedList);
    } catch (err: any) {
      setLocalError(err.message || 'Error al procesar los archivos seleccionados.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Procesador Integral de Operaciones Peugeot
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Generador Automático de Legajos Peugeot
        </h2>
        <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
          Cargue el archivo ZIP de la operación o los documentos sueltos. El sistema extraerá los datos, validará
          la coincidencia documental y generará la Minuta de Ventas 2026, la Planilla de Rendición y el PDF final unificado.
        </p>
      </div>

      {/* Main Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white shadow-sm ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="py-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {loadingMessage || 'Procesando legajo documental...'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              Descomprimiendo archivos, extrayendo textos, ejecutando OCR y validando consistencia...
            </p>
            {/* Progress Bar */}
            <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, loadingProgress)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-blue-600 mt-2">{loadingProgress}% completado</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="w-9 h-9" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Arrastre y suelte aquí el archivo ZIP de la operación
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-5">
              O seleccione los archivos individuales (PDF, JPG, JPEG, PNG). Se conservarán todos los originales en alta resolución.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition active:scale-95"
              >
                <FolderUp className="w-4 h-4" />
                <span>SELECCIONAR ARCHIVOS O ZIP</span>
              </button>

              <button
                type="button"
                onClick={onLoadSample}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold border border-slate-300 transition active:scale-95"
                title="Carga directa del caso de prueba real de Peugeot (Solicitud 6201257 - Juan Ramón Cabrera)"
              >
                <FileArchive className="w-4 h-4 text-blue-600" />
                <span>Cargar caso de prueba real</span>
              </button>
            </div>

            {/* Badges of accepted documents */}
            <div className="mt-8 pt-6 border-t border-slate-100 w-full flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Archivos soportados:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.ZIP</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.PDF (Digital y escaneado)</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.JPG / .JPEG</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.PNG</span>
            </div>
          </div>
        )}
      </div>

      {/* Errors display */}
      {(error || localError) && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aviso en la carga:</span> {error || localError}
          </div>
        </div>
      )}

      {/* Guarantee & Features Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Sin invención de datos</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cada dato extraído tiene origen y confianza trazables. Si un dato no figura en los documentos, se deja vacío o marcado como FALTANTE.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
            <FileArchive className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Plantillas Oficiales Peugeot</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Genera la Minuta de Ventas 2026 y la Planilla de Rendición Peugeot completas y con sus formatos y casilleros intactos.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Validación Cruzada & OCR</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Compara DNI vs Solicitud, CBU de débito vs Constancia bancaria y montos abonados para advertir cualquier discrepancia antes de generar.
          </p>
        </div>
      </div>
    </div>
  );
};
