/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, Image as ImageIcon, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { ProcessedDocument } from '../types/operation';

interface DocumentListProps {
  documents: ProcessedDocument[];
  onInspectDocument?: (doc: ProcessedDocument) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onInspectDocument }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Documentos Detectados ({documents.length})
          </h3>
          <p className="text-xs text-slate-500">
            Archivos clasificados por contenido e integrados al expediente unificado
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          ✓ Todos conservados íntegros
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {documents.map((doc, idx) => {
          const isPdf = doc.mimeType === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf');
          return (
            <div
              key={doc.id || idx}
              className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 truncate" title={doc.name}>
                      {doc.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600 border border-slate-200 shrink-0">
                      {doc.typeLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>{Math.round(doc.size / 1024)} KB</span>
                    <span>•</span>
                    <span>{doc.pagesCount || 1} pág.</span>
                    {doc.extractedSnippet && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs text-slate-500 italic">
                          "{doc.extractedSnippet.substring(0, 50)}..."
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {doc.status === 'processed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Leído</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Revisión</span>
                  </span>
                )}

                {onInspectDocument && (
                  <button
                    onClick={() => onInspectDocument(doc)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                    title="Inspeccionar texto extraído"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
