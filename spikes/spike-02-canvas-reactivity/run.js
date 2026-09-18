const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { GeometryEngine, FlowEngine, Hyphenator } = require('../../src/core');

// 1. Carrega texto editorial
const rawText = fs.readFileSync(path.join(__dirname, '../../samples/texts/editorial-story.md'), 'utf-8');
const words = rawText.split(/\r?\n/).filter(line => !line.trim().startsWith('#')).join(' ').trim().split(/\s+/);

// 2. Mock de medição rápida
const measureFn = (w) => w.length * 8.5;
const spaceWidth = 4.5;
const lineHeight = 22;

// 3. Configuração de 2 Frames Vinculados (Spread de 2 Páginas)
const frame1 = { type: 'rect', x: 50, y: 50, width: 340, height: 440 };
const frame2 = { type: 'rect', x: 440, y: 50, width: 340, height: 440 };

// 4. Polígono Obstáculo Côncavo (16 Vértices)
const erraticTemplate = [
  {x:140,y:20},{x:180,y:50},{x:250,y:30},{x:220,y:95},{x:280,y:140},
  {x:210,y:170},{x:260,y:230},{x:180,y:210},{x:160,y:280},{x:120,y:220},
  {x:50,y:260},{x:80,y:190},{x:20,y:150},{x:75,y:120},{x:40,y:60},{x:110,y:80}
];

const geomConfig = {
  lineHeight,
  wrapMargin: 16,
  smoothing: 2,
  minWidth: 50,
  wrapMode: 'both'
};

const hyphenOptions = {
  enabled: true,
  minWordLength: 5,
  minBefore: 2,
  minAfter: 2,
  hyphenLimit: 3
};

const ITERATIONS = 1000;
const frameTimes = [];
const geometryTimes = [];
const flowTimes = [];

console.log('=================================================================');
console.log('🧪 SPIKE 02: BENCHMARK DE REATIVIDADE DO LAÇO CANVAS (60 FPS)');
console.log('=================================================================');
console.log('Testando ' + ITERATIONS + ' iterações de recálculo contínuo de arrasto...');

for (let i = 0; i < ITERATIONS; i++) {
  const progress = i / ITERATIONS;
  const obsX = 100 + Math.sin(progress * Math.PI * 6) * 350 + 200;
  const obsY = 150 + Math.cos(progress * Math.PI * 4) * 120;

  const obsPolygon = erraticTemplate.map(p => ({
    x: p.x * 0.65 + obsX - 70,
    y: p.y * 0.65 + obsY - 70
  }));
  const obstacles = [{ type: 'polygon', points: obsPolygon }];

  const tStart = performance.now();

  const tGeom0 = performance.now();
  const res1 = GeometryEngine.computeSlices(frame1, obstacles, geomConfig);
  const res2 = GeometryEngine.computeSlices(frame2, obstacles, geomConfig);
  const tGeom1 = performance.now();

  const tFlow0 = performance.now();
  const page1Flow = FlowEngine.fitWordsToSlices(words, res1.slices, measureFn, spaceWidth, hyphenOptions);
  const page2Flow = FlowEngine.fitWordsToSlices(page1Flow.remainingWords, res2.slices, measureFn, spaceWidth, hyphenOptions);
  const tFlow1 = performance.now();

  const tEnd = performance.now();

  frameTimes.push(tEnd - tStart);
  geometryTimes.push(tGeom1 - tGeom0);
  flowTimes.push(tFlow1 - tFlow0);
}

frameTimes.sort((a, b) => a - b);
geometryTimes.sort((a, b) => a - b);
flowTimes.sort((a, b) => a - b);

const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);
const avg = sum(frameTimes) / ITERATIONS;
const min = frameTimes[0];
const max = frameTimes[frameTimes.length - 1];
const p50 = frameTimes[Math.floor(ITERATIONS * 0.50)];
const p95 = frameTimes[Math.floor(ITERATIONS * 0.95)];
const p99 = frameTimes[Math.floor(ITERATIONS * 0.99)];

const avgGeom = sum(geometryTimes) / ITERATIONS;
const avgFlow = sum(flowTimes) / ITERATIONS;

console.log('\n📊 RESULTADOS DA TELEMETRIA DE REATIVIDADE:');
console.log('    - Total de frames processados: ' + ITERATIONS);
console.log('    - Tempo Médio por Frame:        ' + avg.toFixed(3) + ' ms');
console.log('    - Mínimo / Mediana (P50):      ' + min.toFixed(3) + ' ms / ' + p50.toFixed(3) + ' ms');
console.log('    - P95 (95% dos frames abaixo): ' + p95.toFixed(3) + ' ms');
console.log('    - P99 (99% dos frames abaixo): ' + p99.toFixed(3) + ' ms');
console.log('    - Pior Caso (Max Latência):     ' + max.toFixed(3) + ' ms');
console.log('\n⏱️ DECOMPOSIÇÃO DE TEMPO MÉDIO POR FASE:');
console.log('    - Geometria (Scanline + Chaikin + Boolean): ' + avgGeom.toFixed(3) + ' ms (' + ((avgGeom/avg)*100).toFixed(1) + '%)');
console.log('    - Fluxo & Hifenização Silábica Liang/ABL:    ' + avgFlow.toFixed(3) + ' ms (' + ((avgFlow/avg)*100).toFixed(1) + '%)');

console.log('\n🎯 ANÁLISE DE ORÇAMENTO 60 FPS (Budget: 16.667 ms):');
const headroom = 16.667 - avg;
const theoreticalFps = 1000 / avg;
console.log('    - Margem livre de CPU (Headroom): ' + headroom.toFixed(3) + ' ms (' + ((headroom/16.667)*100).toFixed(1) + '% livre)');
console.log('    - Taxa teórica máxima de cálculo: ' + theoreticalFps.toFixed(0) + ' FPS');

if (p99 < 16.667) {
  console.log('\n🟢 STATUS: APROVADO! O pipeline reativo roda com folga folgada dentro do orçamento de 60 FPS!');
} else {
  console.log('\n🔴 STATUS: ALERTA! O P99 excedeu 16.667 ms.');
}
console.log('=================================================================\n');
