/**
 * OpenDTP - Core Engine Orchestrator
 * 
 * Orquestrador central que une:
 * - Árvore de Documento (DOM editorial)
 * - Histórico de Comandos (Undo/Redo)
 * - Fatiamento e Fluxo de Texto (FlowEngine & GeometryEngine)
 * - Exportação de Pré-Impressão em PDF (PdfEngine)
 */

const { Document, TextFrame, ImageFrame, ShapeFrame, Story } = (typeof require !== 'undefined') ? require('./document') : window.OpenDTPDocument;
const { CommandHistory } = (typeof require !== 'undefined') ? require('./commands') : window.OpenDTPCommands;
const { FlowEngine, GeometryEngine } = (typeof require !== 'undefined') ? require('./slicer') : window.OpenDTPCore;
const { Hyphenator } = (typeof require !== 'undefined') ? require('./hyphenator') : window.OpenDTPHyphenator;
const { mmToPt, ptToMm } = (typeof require !== 'undefined') ? require('./units') : window.OpenDTPUnits;
const { createPdfDocument } = (typeof require !== 'undefined') ? require('./pdf') : window.OpenDTPPdf;
const { validateDocumentIntegrity } = (typeof require !== 'undefined') ? require('./schema') : window.OpenDTPSchema;

class OpenDTPEngine {
  constructor(options = {}) {
    this.document = options.document || new Document();
    this.history = new CommandHistory(options.maxHistory || 100);
    this.listeners = new Map();
  }

  /**
   * Registra um listener para eventos do motor ('change', 'undo', 'redo', etc.)
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return this;
  }

  emit(event, data) {
    const list = this.listeners.get(event);
    if (list) {
      for (const cb of list) cb(data);
    }
  }

  /**
   * Cria um novo documento ativo
   */
  createDocument(options = {}) {
    this.document = new Document(options);
    this.history.clear();
    this.emit('documentCreated', this.document);
    this.emit('change', { type: 'documentCreated' });
    return this.document;
  }

  /**
   * Carrega um documento a partir de JSON
   */
  loadFromJSON(json) {
    const validation = validateDocumentIntegrity(json);
    if (!validation.valid) {
      throw new Error(`Erro na validação do schema do documento:\n${validation.errors.join('\n')}`);
    }
    this.document = Document.fromJSON(json);
    this.history.clear();
    this.emit('documentLoaded', this.document);
    this.emit('change', { type: 'documentLoaded' });
    return this.document;
  }

  /**
   * Exporta o documento atual para formato JSON limpo e determinístico
   */
  exportToJSON() {
    return this.document.toJSON();
  }

  /**
   * Executa um comando transacional e registra no histórico
   */
  execute(command) {
    this.history.execute(this.document, command);
    this.emit('commandExecuted', command);
    this.emit('change', { type: 'command', command: command.name });
    return this;
  }

  /**
   * Desfaz a última alteração
   */
  undo() {
    const cmd = this.history.undo(this.document);
    if (cmd) {
      this.emit('undo', cmd);
      this.emit('change', { type: 'undo', command: cmd.name });
    }
    return cmd;
  }

  /**
   * Refaz a última alteração desfeita
   */
  redo() {
    const cmd = this.history.redo(this.document);
    if (cmd) {
      this.emit('redo', cmd);
      this.emit('change', { type: 'redo', command: cmd.name });
    }
    return cmd;
  }

  /**
   * Recalcula o fluxo de texto de todas as matérias (Stories) e caixas encadeadas
   * utilizando os motores de geometria, hifenização silábica e fluxo.
   */
  computeFlow(measureFn = null) {
    // Função padrão de medição tipográfica se nenhuma for fornecida
    const defaultMeasureFn = (token, fontSizePt) => {
      // Aproximação tipográfica baseada no fontSize
      return token.length * (fontSizePt * 0.52);
    };

    const measure = measureFn || defaultMeasureFn;

    for (const [storyId, story] of this.document.stories) {
      // 1. Encontrar todas as caixas que pertencem a essa story
      const frames = [];
      for (const spread of this.document.spreads) {
        for (const frame of spread.frames) {
          if (frame.type === 'text' && frame.storyId === storyId) {
            frames.push(frame);
          }
        }
      }

      if (frames.length === 0) continue;

      // 2. Ordenar as caixas pela cadeia (Head -> Next -> Next...)
      const headFrame = frames.find(f => !f.prevFrameId) || frames[0];
      const chainedFrames = [];
      let current = headFrame;
      const visited = new Set();

      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        chainedFrames.push(current);
        current = current.nextFrameId ? frames.find(f => f.id === current.nextFrameId) : null;
      }

      // 3. Preparar tokens de texto da story
      const fullText = story.getFullText();
      const rawWords = fullText.split(/\s+/).filter(w => w.length > 0);

      let remainingTokens = [...rawWords];

      // 4. Distribuir tokens nas caixas encadeadas
      for (let i = 0; i < chainedFrames.length; i++) {
        const frame = chainedFrames[i];
        frame.computedLines = [];
        frame.hasOverflow = false;

        if (remainingTokens.length === 0) continue;

        // Converter dimensões em mm para pt
        const widthPt = mmToPt(frame.widthMm - frame.insetPaddingMm.left - frame.insetPaddingMm.right);
        const heightPt = mmToPt(frame.heightMm - frame.insetPaddingMm.top - frame.insetPaddingMm.bottom);

        // Obter estilo do primeiro parágrafo
        const styleId = story.paragraphs[0]?.paragraphStyleId || 'pstyle-body';
        const style = this.document.styleManager.getParagraphStyle(styleId);

        const lineHeightPt = style.lineHeightPt;
        const fontSizePt = style.fontSizePt;

        // Fatiamento retangular básico (ou livre com obstáculos)
        const numLines = Math.floor(heightPt / lineHeightPt);
        const slices = [];
        for (let l = 0; l < numLines; l++) {
          slices.push({
            y: l * lineHeightPt,
            height: lineHeightPt,
            segments: [{ x: 0, width: widthPt }]
          });
        }

        // Medidor customizado para o fontSize deste frame
        const tokenMeasure = (t) => measure(t, fontSizePt);
        const spaceW = fontSizePt * 0.28;

        const result = FlowEngine.fitWordsToSlices(
          remainingTokens,
          slices,
          tokenMeasure,
          spaceW,
          style.hyphenation
        );

        frame.computedLines = result.lines.map(l => ({
          ...l,
          text: l.words.join(' ')
        }));
        remainingTokens = result.remainingWords;

        if (i === chainedFrames.length - 1 && remainingTokens.length > 0) {
          frame.hasOverflow = true;
        }
      }
    }

    this.emit('flowComputed');
    return this;
  }

  /**
   * Compila o documento para PDF ISO 32000-1 usando o motor de pré-impressão
   * @param {Object} [options]
   * @returns {string} PDF compilado em buffer string
   */
  exportPdf(options = {}) {
    const pageSetup = this.document.pageSetup;
    const doc = createPdfDocument({
      title: this.document.title,
      trimWidthMm: pageSetup.widthMm,
      trimHeightMm: pageSetup.heightMm,
      bleedMm: pageSetup.bleedMm,
      slugMarginMm: pageSetup.slugMm
    });

    // Percorrer todas as spreads e desenhar os frames
    for (const spread of this.document.spreads) {
      for (const frame of spread.frames) {
        if (frame.type === 'shape') {
          doc.saveGraphicsState();
          if (frame.fillColorSwatchId) {
            doc.setFillColorRgb(0.9, 0.95, 1.0);
          }
          if (frame.strokeWidthPt > 0) {
            doc.setLineWidth(frame.strokeWidthPt);
            doc.setStrokeColorRgb(0.2, 0.4, 0.8);
          }
          doc.drawRectMm({
            x: frame.xMm,
            y: frame.yMm,
            width: frame.widthMm,
            height: frame.heightMm,
            mode: frame.fillColorSwatchId && frame.strokeWidthPt > 0 ? 'B' : (frame.fillColorSwatchId ? 'f' : 'S')
          });
          doc.restoreGraphicsState();
        } else if (frame.type === 'text') {
          doc.saveGraphicsState();
          doc.setFillColorRgb(0.1, 0.15, 0.25);

          // Se já calculou as linhas
          if (frame.computedLines && frame.computedLines.length > 0) {
            for (let idx = 0; idx < frame.computedLines.length; idx++) {
              const line = frame.computedLines[idx];
              const lineYMm = frame.yMm + ptToMm(line.y) + ptToMm(10); // baseline
              const lineXMm = frame.xMm + ptToMm(line.x);
              doc.drawTextMm({
                text: line.text,
                x: lineXMm,
                baselineY: lineYMm,
                fontSizePt: 10,
                fontId: 'F1'
              });
            }
          }
          doc.restoreGraphicsState();
        }
      }
    }

    if (options.addPrePressMarks !== false) {
      doc.addPrePressMarks();
    }

    return doc.compile();
  }
}

const Engine = {
  OpenDTPEngine
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Engine;
}

if (typeof window !== 'undefined') {
  window.OpenDTPEngine = Engine;
}
