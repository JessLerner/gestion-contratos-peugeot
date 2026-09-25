/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { DocumentList } from './components/DocumentList';
import { ReviewPanel } from './components/ReviewPanel';
import { GenerationModal } from './components/GenerationModal';
import { ResultView } from './components/ResultView';
import {
  InconsistencyItem,
  NormalizedOperationData,
  ProcessedDocument,
  TraceabilityReport,
  ValidationItem,
} from './types/operation';
import { PipelineCoordinator } from './services/pipelineCoordinator';
import { SampleDataService } from './services/demo/sampleData';
import { PdfMerger } from './services/merger/pdfMerger';
import { RendicionGenerator } from './services/templates/rendicion/rendicionGenerator';
import { UnpackedFile } from './services/zip/zipExtractor';

export default function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'result'>('upload');

  // Operational State
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [operationData, setOperationData] = useState<NormalizedOperationData>(
    PipelineCoordinator.createEmptyOperationData(),
  );
  const [validations, setValidations] = useState<ValidationItem[]>([]);
  const [inconsistencies, setInconsistencies] = useState<InconsistencyItem[]>([]);

  // Processing & Loading State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  // Final Output
  const [finalPdfBytes, setFinalPdfBytes] = useState<Uint8Array | null>(null);
  const [finalFilename, setFinalFilename] = useState('');
  const [traceabilityReport, setTraceabilityReport] = useState<TraceabilityReport | null>(null);

  // Sample downloading state
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);

  // Handlers
  const handleFilesSelected = async (unpackedFiles: UnpackedFile[]) => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(5);
    setProcessingMessage('Iniciando extracción y clasificación...');

    try {
      const result = await PipelineCoordinator.processFiles(
        unpackedFiles,
        (msg, pct) => {
          setProcessingMessage(msg);
          setProcessingProgress(pct);
        },
      );

      setDocuments(result.documents);
      setOperationData(result.operationData);
      setValidations(result.validations);
      setInconsistencies(result.inconsistencies);

      setCurrentStep('review');
    } catch (err: any) {
      console.error('Error durante el procesamiento:', err);
      setError(err.message || 'Error inesperado al procesar los documentos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(10);
    setProcessingMessage('Cargando expediente real de prueba (Peugeot 208 - Solicitud 6201257)...');

    try {
      const sampleFiles = await SampleDataService.generateSampleFiles();
      await handleFilesSelected(sampleFiles);
    } catch (err: any) {
      setError('No se pudo cargar el caso de ejemplo: ' + (err.message || err));
      setIsProcessing(false);
    }
  };

  const handleDownloadSampleZip = async () => {
    setIsDownloadingSample(true);
    try {
      const zipBlob = await SampleDataService.generateSampleZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LEGAJO_PEUGEOT_EJEMPLO_6201257.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const handleUpdateField = (fieldName: keyof NormalizedOperationData, newValue: string) => {
    setOperationData((prev) => {
      const updated = { ...prev };
      updated[fieldName] = {
        value: newValue,
        source: 'manual',
        confidence: 'Alta',
        isModifiedManually: true,
      };

      // Synchronize associated fields
      if (fieldName === 'solicitud') {
        updated.sx = { ...updated[fieldName] };
      }
      if (fieldName === 'titular') {
        updated.cliente = { ...updated[fieldName] };
      }
      if (fieldName === 'monto_abonado') {
        updated.importe_rendicion = { ...updated[fieldName] };
      }

      return updated;
    });
  };

  const handleResolveInconsistency = (index: number, chosenValue: string) => {
    setInconsistencies((prev) => {
      const copy = [...prev];
      const inc = copy[index];
      inc.resolved = true;
      inc.resolvedValue = chosenValue;

      // Update in operation data
      if (inc.field in operationData) {
        handleUpdateField(inc.field as keyof NormalizedOperationData, chosenValue);
      }

      return copy;
    });
  };

  const handleGenerateDocumentation = async () => {
    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationMessage('Iniciando consolidación de documentación...');

    try {
      const { pdfBytes, filename } = await PdfMerger.generateConsolidatedPdf(
        operationData,
        documents,
        validations,
        (msg, pct) => {
          setGenerationMessage(msg);
          setGenerationProgress(pct);
        },
      );

      const report = PipelineCoordinator.buildTraceabilityReport(
        operationData,
        documents,
        validations,
      );

      setFinalPdfBytes(pdfBytes);
      setFinalFilename(filename);
      setTraceabilityReport(report);

      setCurrentStep('result');
    } catch (err: any) {
      console.error('Error al generar documentación:', err);
      alert('Error al generar PDF consolidado: ' + (err.message || err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      const blob = RendicionGenerator.generateExcelBlob(operationData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sol = operationData.solicitud.value || '6201257';
      a.download = `PLANILLA_RENDICION_PEUGEOT_${sol}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Error descargando Excel: ' + e.message);
    }
  };

  const handleDownloadTraceabilityJson = () => {
    if (!traceabilityReport) return;
    const jsonStr = JSON.stringify(traceabilityReport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sol = operationData.solicitud.value || '6201257';
    a.download = `TRAZABILIDAD_OPERACION_${sol}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setDocuments([]);
    setOperationData(PipelineCoordinator.createEmptyOperationData());
    setValidations([]);
    setInconsistencies([]);
    setFinalPdfBytes(null);
    setFinalFilename('');
    setTraceabilityReport(null);
    setError(null);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      <Header
        currentStep={currentStep}
        onReset={handleReset}
        onDownloadSampleZip={handleDownloadSampleZip}
        isDownloadingSample={isDownloadingSample}
      />

      <main className="flex-1">
        {currentStep === 'upload' && (
          <UploadZone
            onFilesSelected={handleFilesSelected}
            onLoadSample={handleLoadSample}
            isLoading={isProcessing}
            loadingMessage={processingMessage}
            loadingProgress={processingProgress}
            error={error}
          />
        )}

        {currentStep === 'review' && (
          <div className="py-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-2">
              <DocumentList documents={documents} />
            </div>

            <ReviewPanel
              operationData={operationData}
              validations={validations}
              inconsistencies={inconsistencies}
              onUpdateField={handleUpdateField}
              onResolveInconsistency={handleResolveInconsistency}
              onGenerateDocumentation={handleGenerateDocumentation}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {currentStep === 'result' && finalPdfBytes && traceabilityReport && (
          <ResultView
            pdfBytes={finalPdfBytes}
            filename={finalFilename}
            operationData={operationData}
            documents={documents}
            traceabilityReport={traceabilityReport}
            onDownloadExcel={handleDownloadExcel}
            onDownloadTraceabilityJson={handleDownloadTraceabilityJson}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Live Generation Progress Modal */}
      <GenerationModal
        isOpen={isGenerating}
        stepMessage={generationMessage}
        progressPercent={generationProgress}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        AutoDoc Peugeot • Automatización administrativa conforme a especificaciones oficiales de Plan de Ahorro Peugeot 2026.
      </footer>
    </div>
  );
}
