/**
 * run.js - Executor Modular do Spike 01: Benchmark de Geometria & Fluxo
 */

const { GeometryEngine } = require('./slicer');

const erraticPoints = [
  { x: 140, y: 20 },
  { x: 180, y: 50 },
  { x: 250, y: 30 },
  { x: 220, y: 95 },
  { x: 280, y: 140 },
  { x: 210, y: 170 },
  { x: 260, y: 230 },
  { x: 180, y: 210 },
  { x: 160, y: 280 },
  { x: 120, y: 220 },
  { x: 50, y: 260 },
  { x: 80, y: 190 },
  { x: 20, y: 150 },
  { x: 75, y: 120 },
  { x: 40, y: 60 },
  { x: 110, y: 80 }
];

console.log('='.repeat(65));
console.log('🧪 SPIKE 01: BENCHMARK DO PIPELINE MODULAR (DESACOPLADO)');
console.log('='.repeat(65));

const container = { x: 30, y: 40, width: 380, height: 420 };
const shiftedErratic = erraticPoints.map(p => ({ x: p.x * 0.75 + 105, y: p.y * 0.75 + 125 }));

const t0 = process.hrtime.bigint();
const result = GeometryEngine.computeSlices(container, [
  { type: 'polygon', points: shiftedErratic }
], {
  lineHeight: 26,
  wrapMargin: 16,
  smoothing: 2,
  minWidth: 70,
  wrapMode: 'both'
});
const t1 = process.hrtime.bigint();
const timeMs = Number(t1 - t0) / 1e6;

console.log(`\n[Execução Modular de Fatiamento Geométrico]:`);
console.log(`    - Entrelinha: 26px | Largura Mínima: 70px`);
console.log(`    - Fatias geradas: ${result.slices.length}`);
console.log(`    - Tempo de cálculo: ${timeMs.toFixed(3)} ms`);
console.log(`\n✅ Arquivo interativo modular pronto: preview.html`);
console.log('='.repeat(65));
