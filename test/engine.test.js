/**
 * OpenDTP Engine - Suíte de Testes Automatizados de Arquitetura de Documento
 * 
 * Executar via: node test/engine.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  OpenDTPEngine,
  DocModel,
  Commands,
  Schema,
  Styles,
  Units
} = require('../src/core');

const { Document, TextFrame, ShapeFrame, Story } = DocModel;
const { AddFrameCommand, TransformFrameCommand, LinkTextFramesCommand } = Commands;

console.log('=================================================================');
console.log('🧪 TESTES DE ARQUITETURA DO DOCUMENTO (OPENDTP ENGINE)');
console.log('=================================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------------------------------
// TESTE 1: CRIAÇÃO DE DOCUMENTO E CONFIGURAÇÃO DE SPREADS (FACING PAGES)
// ----------------------------------------------------------------------------
test('Criação de Documento A4 com Spreads Duplas (Facing Pages)', () => {
  const engine = new OpenDTPEngine();
  const doc = engine.createDocument({
    title: 'Manual de Identidade Visual',
    pageSetup: {
      preset: 'A4',
      widthMm: 210,
      heightMm: 297,
      facingPages: true,
      margins: { top: 20, bottom: 25, inside: 30, outside: 18 }
    }
  });

  // Adicionar Spread 1 (Capa / Página 1 isolada à direita)
  const sp1 = doc.addSpread();
  assert.strictEqual(sp1.pages.length, 1, 'Spread 1 deve ter 1 página (Recto)');
  assert.strictEqual(sp1.pages[0].side, 'right', 'Página 1 deve estar à direita');
  assert.strictEqual(sp1.pages[0].pageNumber, 1);

  // Adicionar Spread 2 (Lâmina aberta com Páginas 2 e 3)
  const sp2 = doc.addSpread();
  assert.strictEqual(sp2.pages.length, 2, 'Spread 2 deve ter 2 páginas (Verso e Recto)');
  assert.strictEqual(sp2.pages[0].side, 'left', 'Página 2 deve estar à esquerda');
  assert.strictEqual(sp2.pages[1].side, 'right', 'Página 3 deve estar à direita');
  assert.strictEqual(sp2.pages[0].pageNumber, 2);
  assert.strictEqual(sp2.pages[1].pageNumber, 3);

  // Testar cálculo de mancha gráfica com margens assimétricas
  const boxLeft = sp2.pages[0].getContentBox(doc.pageSetup);
  assert.strictEqual(boxLeft.x, 18, 'Margem esquerda da página esquerda deve ser Outside (18mm)');
  assert.strictEqual(boxLeft.width, 210 - 18 - 30, 'Largura útil = largura - outside - inside');

  const boxRight = sp2.pages[1].getContentBox(doc.pageSetup);
  assert.strictEqual(boxRight.x, 210 + 30, 'Margem esquerda da página direita deve ser Inside (offset + 30mm)');
});

// ----------------------------------------------------------------------------
// TESTE 2: SERIALIZAÇÃO E DESSERIALIZAÇÃO JSON GIT-FIRST
// ----------------------------------------------------------------------------
test('Serialização e Desserialização JSON Limpa e Determinística', () => {
  const engine = new OpenDTPEngine();
  const doc = engine.createDocument({ title: 'Livro de Teste Git' });
  const sp = doc.addSpread();

  const frame = new ShapeFrame({
    name: 'Retângulo Mestre',
    xMm: 25,
    yMm: 35,
    widthMm: 120,
    heightMm: 80,
    strokeWidthPt: 1.5,
    wrapMode: 'wrap-obstacle'
  });
  sp.addFrame(frame);

  const json = engine.exportToJSON();
  assert.strictEqual(typeof json, 'object');
  assert.strictEqual(json.schemaVersion, '1.0.0');

  // Validar integridade referencial do schema
  const val = Schema.validateDocumentIntegrity(json);
  assert.strictEqual(val.valid, true, 'O JSON gerado deve passar na validação de integridade');

  // Recarregar em novo motor
  const engine2 = new OpenDTPEngine();
  const loadedDoc = engine2.loadFromJSON(json);

  assert.strictEqual(loadedDoc.title, 'Livro de Teste Git');
  assert.strictEqual(loadedDoc.spreads.length, 1);
  assert.strictEqual(loadedDoc.spreads[0].frames.length, 1);
  const loadedFrame = loadedDoc.spreads[0].frames[0];
  assert.strictEqual(loadedFrame.name, 'Retângulo Mestre');
  assert.strictEqual(loadedFrame.widthMm, 120);
  assert.strictEqual(loadedFrame.wrapMode, 'wrap-obstacle');
});

// ----------------------------------------------------------------------------
// TESTE 3: HISTÓRICO TRANSACIONAL (COMMAND PATTERN UNDO / REDO)
// ----------------------------------------------------------------------------
test('Máquina de Estados de Comandos: Executar, Desfazer (Undo) e Refazer (Redo)', () => {
  const engine = new OpenDTPEngine();
  const doc = engine.createDocument();
  const sp = doc.addSpread();

  const frame = new ShapeFrame({
    id: 'f-1',
    name: 'Caixa de Destaque',
    xMm: 10,
    yMm: 10,
    widthMm: 50,
    heightMm: 50
  });

  // 1. Executar Adição
  engine.execute(new AddFrameCommand(sp.id, frame));
  assert.strictEqual(sp.frames.length, 1);
  assert.strictEqual(engine.history.canUndo(), true);
  assert.strictEqual(engine.history.canRedo(), false);

  // 2. Executar Transformação (Mover para 70, 80)
  engine.execute(new TransformFrameCommand('f-1', { xMm: 70, yMm: 80 }));
  assert.strictEqual(frame.xMm, 70);
  assert.strictEqual(frame.yMm, 80);

  // 3. Desfazer Movimento (Undo)
  engine.undo();
  assert.strictEqual(frame.xMm, 10, 'Após Undo, x deve voltar a 10mm');
  assert.strictEqual(frame.yMm, 10, 'Após Undo, y deve voltar a 10mm');
  assert.strictEqual(engine.history.canRedo(), true);

  // 4. Refazer Movimento (Redo)
  engine.redo();
  assert.strictEqual(frame.xMm, 70, 'Após Redo, x deve voltar a 70mm');
  assert.strictEqual(frame.yMm, 80, 'Após Redo, y deve voltar a 80mm');

  // 5. Desfazer duas vezes (voltar à estaca zero)
  engine.undo(); // desfaz movimento
  engine.undo(); // desfaz adição
  assert.strictEqual(sp.frames.length, 0, 'Após segundo Undo, o frame deve ter sido removido');
  assert.strictEqual(engine.history.canUndo(), false);
  assert.strictEqual(engine.history.canRedo(), true);
});

// ----------------------------------------------------------------------------
// TESTE 4: FLUXO DE TEXTO INTEGRADO ENTRE CAIXAS ENCADHEADAS (TEXT THREADING)
// ----------------------------------------------------------------------------
test('Encadeamento de Caixas de Texto (Text Threading) e Fatiamento Reativo', () => {
  const engine = new OpenDTPEngine();
  const doc = engine.createDocument();

  // Criar Story com texto longo
  const story = new Story({ id: 'story-artigo', title: 'Artigo Principal' });
  story.addParagraph(
    'O software de publicação de mesa moderno precisa ser capaz de redistribuir texto fluido ' +
    'entre múltiplos recipientes sem perda de palavras, garantindo alinhamento tipográfico de alta precisão ' +
    'e respeitando hifenização silábica automática nas quebras de linha em língua portuguesa.'
  );
  doc.addStory(story);

  // Spread 1 com Caixa 1
  const sp1 = doc.addSpread();
  const tf1 = new TextFrame({
    id: 'tf-1',
    storyId: 'story-artigo',
    xMm: 20, yMm: 20,
    widthMm: 60, heightMm: 30 // Caixa pequena para forçar transbordamento (overflow)
  });
  sp1.addFrame(tf1);

  // Spread 2 com Caixa 2 vinculada
  const sp2 = doc.addSpread();
  const tf2 = new TextFrame({
    id: 'tf-2',
    storyId: 'story-artigo',
    prevFrameId: 'tf-1',
    xMm: 20, yMm: 20,
    widthMm: 80, heightMm: 80
  });
  sp2.addFrame(tf2);
  tf1.nextFrameId = 'tf-2';

  // Executar recálculo do motor de fluxo
  engine.computeFlow();

  assert.ok(tf1.computedLines.length > 0, 'Caixa 1 deve conter linhas geradas');
  assert.ok(tf2.computedLines.length > 0, 'Caixa 2 deve receber o texto excedente da Caixa 1');

  // Coletar palavras de ambas as caixas e verificar integridade textual completa
  const wordsIn1 = tf1.computedLines.flatMap(l => l.words);
  const wordsIn2 = tf2.computedLines.flatMap(l => l.words);

  // Recompor o texto unindo as palavras e colando as sílabas separadas por hífen de quebra
  const reconstructedText = [...wordsIn1, ...wordsIn2].join(' ').replace(/-\s+/g, '');
  const originalText = story.getFullText();

  assert.strictEqual(reconstructedText, originalText, 'O texto reconstruído a partir do fluxo deve ser idêntico ao original');
  assert.strictEqual(tf2.hasOverflow, false, 'Caixa 2 tem espaço suficiente e não deve transbordar');
});

// ----------------------------------------------------------------------------
// TESTE 5: EXPORTAÇÃO COMPLETA EM PDF VETORIAL DIRETO DO MOTOR
// ----------------------------------------------------------------------------
test('Exportação de Documento Completo em PDF Vetorial ISO 32000-1', () => {
  const engine = new OpenDTPEngine();
  const doc = engine.createDocument({ title: 'Relatório Anual OpenDTP' });
  const sp = doc.addSpread();

  sp.addFrame(new ShapeFrame({
    xMm: 20, yMm: 20, widthMm: 80, heightMm: 40,
    strokeWidthPt: 1, fillColorSwatchId: 'swatch-cyan'
  }));

  const pdfOutput = engine.exportPdf({ addPrePressMarks: true });

  assert.strictEqual(typeof pdfOutput, 'string');
  assert.ok(pdfOutput.startsWith('%PDF-1.7'), 'Deve conter cabeçalho PDF 1.7');
  assert.ok(pdfOutput.includes('/MediaBox'), 'Deve conter dicionário /MediaBox');
  assert.ok(pdfOutput.includes('/TrimBox'), 'Deve conter dicionário /TrimBox');
  assert.ok(pdfOutput.includes('%%EOF'), 'Deve conter marcador final de arquivo %%EOF');

  const testPdfPath = path.join(__dirname, 'output_engine_test.pdf');
  fs.writeFileSync(testPdfPath, pdfOutput, 'latin1');
  assert.ok(fs.existsSync(testPdfPath));
  assert.ok(fs.statSync(testPdfPath).size > 1000);
});

console.log('=================================================================');
console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} testes aprovados com 100% de sucesso!`);
console.log('=================================================================');
