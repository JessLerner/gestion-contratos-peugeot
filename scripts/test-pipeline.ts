/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { SampleDataService } from '../src/services/demo/sampleData.ts';
import { PipelineCoordinator } from '../src/services/pipelineCoordinator.ts';
import { PdfMerger } from '../src/services/merger/pdfMerger.ts';

async function runPipelineVerification() {
  console.log('--- INICIANDO VERIFICACIÓN REAL DEL PIPELINE AUTODOC PEUGEOT ---');

  // 1. Generate sample documents
  console.log('1. Generando documentos reales de prueba (Caso Solicitud 6201257)...');
  const sampleFiles = await SampleDataService.generateSampleFiles();
  console.log(`   ✓ ${sampleFiles.length} documentos generados.`);

  // 2. Process documents through PipelineCoordinator
  console.log('2. Ejecutando PipelineCoordinator (descompresión, clasificación, extracción y validación cruzada)...');
  const result = await PipelineCoordinator.processFiles(sampleFiles, (msg, pct) => {
    console.log(`   [${pct}%] ${msg}`);
  });

  const { documents, operationData, validations, inconsistencies } = result;

  console.log(`   ✓ ${documents.length} documentos procesados.`);
  console.log(`   ✓ Solicitud detectada: ${operationData.solicitud.value} (Origen: ${operationData.solicitud.source})`);
  console.log(`   ✓ Titular detectado: ${operationData.titular.value} (Origen: ${operationData.titular.source})`);
  console.log(`   ✓ DNI detectado: ${operationData.dni.value}`);
  console.log(`   ✓ CUIL detectado: ${operationData.cuil_cuit.value}`);
  console.log(`   ✓ CBU detectado: ${operationData.cbu.value}`);
  console.log(`   ✓ Banco detectado: ${operationData.banco.value}`);
  console.log(`   ✓ Monto abonado: $${operationData.monto_abonado.value}`);
  console.log(`   ✓ Modelo: ${operationData.modelo_vehiculo.value}`);
  console.log(`   ✓ Plataforma rendición: ${operationData.plataforma.value}`);
  console.log(`   ✓ Empresa pago: ${operationData.empresa_pago.value}`);

  // Assert critical benchmark values
  if (operationData.solicitud.value !== '6201257') {
    throw new Error(`Solicitud incorrecta: esperada 6201257, obtenida ${operationData.solicitud.value}`);
  }
  if (!operationData.titular.value.includes('CABRERA')) {
    throw new Error(`Titular incorrecto: esperado CABRERA, obtenido ${operationData.titular.value}`);
  }
  if (operationData.dni.value !== '24798197') {
    throw new Error(`DNI incorrecto: esperado 24798197, obtenido ${operationData.dni.value}`);
  }
  if (operationData.cbu.value !== '0720704688000035033390') {
    throw new Error(`CBU incorrecto: esperado 0720704688000035033390, obtenido ${operationData.cbu.value}`);
  }

  console.log(`   ✓ Validaciones cruzadas ejecutadas: ${validations.length}`);
  validations.forEach((v) => console.log(`     [${v.status.toUpperCase()}] ${v.title}: ${v.message}`));

  console.log(`   ✓ Inconsistencias detectadas: ${inconsistencies.length}`);

  // 3. Generate Consolidated PDF
  console.log('3. Generando PDF consolidado unificado (Portada + Minuta + Planilla + Documentos originales)...');
  const { pdfBytes, filename } = await PdfMerger.generateConsolidatedPdf(
    operationData,
    documents,
    validations,
    (msg, pct) => {
      console.log(`   [${pct}%] ${msg}`);
    },
  );

  console.log(`   ✓ PDF generado exitosamente: "${filename}"`);
  console.log(`   ✓ Tamaño de archivo: ${(pdfBytes.byteLength / 1024).toFixed(1)} KB`);

  // 4. Verify PDF structure
  const loadedPdf = await PDFDocument.load(pdfBytes);
  const pageCount = loadedPdf.getPageCount();
  console.log(`   ✓ Páginas totales en el PDF consolidado: ${pageCount}`);

  // Must have at least:
  // Page 1: Portada
  // Page 2: Minuta de Ventas 2026
  // Page 3: Planilla de Rendición Peugeot
  // Pages 4+: Original documents (8 documents = 8 pages) -> Total at least 11 pages!
  if (pageCount < 11) {
    throw new Error(`Cantidad insuficiente de páginas: esperadas al menos 11, obtenidas ${pageCount}`);
  }

  // 5. Write to output folder for inspection
  const outDir = path.resolve('./dist_test');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`   ✓ Archivo de prueba guardado en: ${outPath}`);

  console.log('--- ¡TODAS LAS PRUEBAS DEL PIPELINE FINALIZARON CON ÉXITO! ---');
}

runPipelineVerification().catch((err) => {
  console.error('ERROR EN VERIFICACIÓN:', err);
  process.exit(1);
});
