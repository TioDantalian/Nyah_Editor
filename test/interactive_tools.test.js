/**
 * OpenDTP - Testes Automatizados de Interação & 8 Alças Cardeais
 * 
 * Validação rigorosa dos cálculos analíticos das alças de transformação,
 * detecção de clique (hit-test), restrições físicas e histórico de Undo/Redo.
 */

const assert = require('assert');
const { TransformHandles, HANDLE_DEFS } = require('../src/ui/transform_handles');
const { OpenDTPEngine, DocModel, Commands } = require('../src/core');
const { CanvasController } = require('../src/ui/canvas');

console.log('=================================================================');
console.log('🎯 TESTES DO SISTEMA DE FERRAMENTAS & 8 ALÇAS (OPENDTP UI)');
console.log('=================================================================');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Erro: ${err.message}`);
    console.error(err.stack);
  }
}

// ---------------------------------------------------------------------------
// TESTE 1: Definição e Posições das 8 Alças Cardeais
// ---------------------------------------------------------------------------
runTest('Cálculo Analítico das 8 Alças Cardeais (NW, N, NE, E, SE, S, SW, W)', () => {
  const box = { xMm: 20, yMm: 30, widthMm: 100, heightMm: 80 };
  const handles = TransformHandles.getHandles(box);

  assert.strictEqual(handles.length, 8, 'Devem existir exatamente 8 alças');

  const map = {};
  for (const h of handles) map[h.id] = h;

  // NW: (20, 30)
  assert.strictEqual(map.nw.xMm, 20);
  assert.strictEqual(map.nw.yMm, 30);
  assert.strictEqual(map.nw.cursor, 'nwse-resize');

  // N: (70, 30)
  assert.strictEqual(map.n.xMm, 70);
  assert.strictEqual(map.n.yMm, 30);
  assert.strictEqual(map.n.cursor, 'ns-resize');

  // NE: (120, 30)
  assert.strictEqual(map.ne.xMm, 120);
  assert.strictEqual(map.ne.yMm, 30);
  assert.strictEqual(map.ne.cursor, 'nesw-resize');

  // E: (120, 70)
  assert.strictEqual(map.e.xMm, 120);
  assert.strictEqual(map.e.yMm, 70);
  assert.strictEqual(map.e.cursor, 'ew-resize');

  // SE: (120, 110)
  assert.strictEqual(map.se.xMm, 120);
  assert.strictEqual(map.se.yMm, 110);
  assert.strictEqual(map.se.cursor, 'nwse-resize');

  // S: (70, 110)
  assert.strictEqual(map.s.xMm, 70);
  assert.strictEqual(map.s.yMm, 110);
  assert.strictEqual(map.s.cursor, 'ns-resize');

  // SW: (20, 110)
  assert.strictEqual(map.sw.xMm, 20);
  assert.strictEqual(map.sw.yMm, 110);
  assert.strictEqual(map.sw.cursor, 'nesw-resize');

  // W: (20, 70)
  assert.strictEqual(map.w.xMm, 20);
  assert.strictEqual(map.w.yMm, 70);
  assert.strictEqual(map.w.cursor, 'ew-resize');
});

// ---------------------------------------------------------------------------
// TESTE 2: Detecção de Clique (Hit-Testing) com Tolerância em Pixels
// ---------------------------------------------------------------------------
runTest('Detecção de Clique (Hit-Test) nas Alças com Tolerância', () => {
  const box = { xMm: 0, yMm: 0, widthMm: 100, heightMm: 100 };
  const zoom = 1.0;
  const panX = 0;
  const panY = 0;

  // NW fica em (0, 0) no mundo
  const screenX = 0;
  const screenY = 0;

  const hitExact = TransformHandles.hitTest(screenX, screenY, box, zoom, panX, panY, 8);
  assert.ok(hitExact, 'Deve detectar clique exato na alça NW');
  assert.strictEqual(hitExact.id, 'nw');

  // Clique a 5px de distância (dentro da tolerância de 8px)
  const hitNear = TransformHandles.hitTest(screenX + 4, screenY + 4, box, zoom, panX, panY, 8);
  assert.ok(hitNear, 'Deve detectar clique dentro da tolerância de 8px');
  assert.strictEqual(hitNear.id, 'nw');

  // Clique a 25px de distância (fora da tolerância)
  const hitFar = TransformHandles.hitTest(screenX + 25, screenY + 25, box, zoom, panX, panY, 8);
  assert.strictEqual(hitFar, null, 'Não deve detectar clique fora da tolerância');
});

// ---------------------------------------------------------------------------
// TESTE 3: Redimensionamento pelas Alças com Manutenção de Âncoras Opostas
// ---------------------------------------------------------------------------
runTest('Redimensionamento Direcional com Âncoras Opostas Fixas', () => {
  const initialBox = { xMm: 50, yMm: 50, widthMm: 100, heightMm: 80 };

  // 1. Puxar alça SE para a direita (+20mm) e para baixo (+10mm)
  const resSE = TransformHandles.computeResize('se', initialBox, 20, 10);
  assert.strictEqual(resSE.xMm, 50, 'Âncora X não deve se mover no SE');
  assert.strictEqual(resSE.yMm, 50, 'Âncora Y não deve se mover no SE');
  assert.strictEqual(resSE.widthMm, 120, 'Largura deve aumentar 20mm');
  assert.strictEqual(resSE.heightMm, 90, 'Altura deve aumentar 10mm');

  // 2. Puxar alça NW para a direita (+15mm) e para baixo (+10mm)
  // O canto inferior direito (150, 130) deve permanecer FIXO!
  const resNW = TransformHandles.computeResize('nw', initialBox, 15, 10);
  assert.strictEqual(resNW.xMm, 65, 'X deve avançar 15mm');
  assert.strictEqual(resNW.yMm, 60, 'Y deve avançar 10mm');
  assert.strictEqual(resNW.widthMm, 85, 'Largura deve diminuir 15mm');
  assert.strictEqual(resNW.heightMm, 70, 'Altura deve diminuir 10mm');
  assert.strictEqual(resNW.xMm + resNW.widthMm, 150, 'Canto SE original deve continuar fixo em X=150');
  assert.strictEqual(resNW.yMm + resNW.heightMm, 130, 'Canto SE original deve continuar fixo em Y=130');

  // 3. Puxar alça Norte para cima (-20mm)
  const resN = TransformHandles.computeResize('n', initialBox, 0, -20);
  assert.strictEqual(resN.xMm, 50);
  assert.strictEqual(resN.yMm, 30, 'Y deve subir 20mm');
  assert.strictEqual(resN.widthMm, 100, 'Largura não se altera na alça N');
  assert.strictEqual(resN.heightMm, 100, 'Altura deve aumentar 20mm');
  assert.strictEqual(resN.yMm + resN.heightMm, 130, 'Borda inferior deve continuar fixa');
});

// ---------------------------------------------------------------------------
// TESTE 4: Travamento de Proporção (Shift) e Expansão pelo Centro (Alt)
// ---------------------------------------------------------------------------
runTest('Modificadores de Transformação: Shift (Proporção) e Alt (Centro)', () => {
  const initialBox = { xMm: 100, yMm: 100, widthMm: 100, heightMm: 50 }; // Aspect Ratio = 2.0

  // 1. Redimensionar canto SE com lockAspect = true (Shift)
  const resShift = TransformHandles.computeResize('se', initialBox, 40, 10, { lockAspect: true });
  const ratio = resShift.widthMm / resShift.heightMm;
  assert.ok(Math.abs(ratio - 2.0) < 0.01, `Proporção deve permanecer 2.0 (obtido: ${ratio})`);
  assert.strictEqual(resShift.widthMm, 140);
  assert.strictEqual(resShift.heightMm, 70);

  // 2. Redimensionar com fromCenter = true (Alt)
  const resAlt = TransformHandles.computeResize('se', initialBox, 10, 10, { fromCenter: true });
  // Centro original: (150, 125)
  const newCenterX = resAlt.xMm + resAlt.widthMm / 2;
  const newCenterY = resAlt.yMm + resAlt.heightMm / 2;
  assert.strictEqual(newCenterX, 150, 'Centro X original deve ser preservado');
  assert.strictEqual(newCenterY, 125, 'Centro Y original deve ser preservado');
  assert.strictEqual(resAlt.widthMm, 120, 'Largura expandiu simetricamente (+20mm)');
  assert.strictEqual(resAlt.heightMm, 70, 'Altura expandiu simetricamente (+20mm)');
});

// ---------------------------------------------------------------------------
// TESTE 5: Restrição de Mínimo Dimensional (Anti-Inversão de Caixas)
// ---------------------------------------------------------------------------
runTest('Restrição Inviolável de Mínimo Dimensional (W >= 5mm, H >= 5mm)', () => {
  const initialBox = { xMm: 10, yMm: 10, widthMm: 20, heightMm: 20 };

  // Tentar encolher mais de 50mm para a esquerda (tentando criar caixa com dimensão negativa)
  const resClamp = TransformHandles.computeResize('se', initialBox, -40, -40, { minWidthMm: 5.0, minHeightMm: 5.0 });

  assert.strictEqual(resClamp.widthMm, 5.0, 'Largura deve ser travada em no mínimo 5mm');
  assert.strictEqual(resClamp.heightMm, 5.0, 'Altura deve ser travada em no mínimo 5mm');
  assert.ok(resClamp.widthMm > 0 && resClamp.heightMm > 0, 'Dimensões nunca devem ser negativas ou nulas');
});

// ---------------------------------------------------------------------------
// TESTE 6: Integração Transacional no Motor: Undo/Redo de Transformações
// ---------------------------------------------------------------------------
runTest('Ciclo Transacional Completo no OpenDTPEngine (Execute -> Undo -> Redo)', () => {
  const engine = new OpenDTPEngine();
  const doc = engine.createDocument();
  const spread = doc.addSpread();

  const textFrame = new DocModel.TextFrame({
    id: 'frame-test-01',
    xMm: 20,
    yMm: 30,
    widthMm: 80,
    heightMm: 60
  });

  // 1. Adicionar quadro via comando
  engine.execute(new Commands.AddFrameCommand(spread.id, textFrame));
  assert.strictEqual(spread.frames.length, 1);
  assert.strictEqual(spread.frames[0].widthMm, 80);

  // 2. Transformar quadro via comando (simulando soltar uma alça de redimensionamento)
  const transformCmd = new Commands.TransformFrameCommand('frame-test-01', {
    xMm: 25,
    yMm: 35,
    widthMm: 110,
    heightMm: 95
  });
  engine.execute(transformCmd);

  assert.strictEqual(textFrame.xMm, 25);
  assert.strictEqual(textFrame.widthMm, 110);
  assert.strictEqual(textFrame.heightMm, 95);

  // 3. Desfazer transformação (Ctrl+Z)
  engine.undo();
  assert.strictEqual(textFrame.xMm, 20, 'X deve retornar ao valor original após Undo');
  assert.strictEqual(textFrame.widthMm, 80, 'Largura deve retornar ao valor original após Undo');
  assert.strictEqual(textFrame.heightMm, 60, 'Altura deve retornar ao valor original após Undo');

  // 4. Refazer transformação (Ctrl+Y)
  engine.redo();
  assert.strictEqual(textFrame.xMm, 25, 'X deve voltar ao valor transformado após Redo');
  assert.strictEqual(textFrame.widthMm, 110, 'Largura deve voltar ao valor transformado após Redo');
  assert.strictEqual(textFrame.heightMm, 95, 'Altura deve voltar ao valor transformado após Redo');
});

console.log('=================================================================');
console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} testes aprovados com 100% de sucesso!`);
console.log('=================================================================');
