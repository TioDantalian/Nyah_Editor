/**
 * OpenDTP - Core Document Object Model (Git-First Document Tree)
 * 
 * Estrutura hierárquica oficial:
 * Document -> Spreads -> Pages -> Layers -> Frames (Text, Image, Shape) -> Stories
 */

const { validatePageSetup, DEFAULT_PAGE_SETUP } = (typeof require !== 'undefined') ? require('./schema') : window.OpenDTPSchema;
const { StyleManager } = (typeof require !== 'undefined') ? require('./styles') : window.OpenDTPStyles;
const { mmToPt, ptToMm } = (typeof require !== 'undefined') ? require('./units') : window.OpenDTPUnits;

class Layer {
  constructor(options = {}) {
    this.id = options.id || `layer-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.name = options.name || 'Camada 1';
    this.color = options.color || '#38bdf8';
    this.visible = Boolean(options.visible ?? true);
    this.locked = Boolean(options.locked ?? false);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      visible: this.visible,
      locked: this.locked
    };
  }

  static fromJSON(json) {
    return new Layer(json);
  }
}

class Frame {
  constructor(options = {}) {
    this.id = options.id || `frame-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.name = options.name || 'Quadro';
    this.type = options.type || 'generic'; // 'text' | 'image' | 'shape'
    this.layerId = options.layerId || 'layer-default';
    
    // Coordenadas e dimensões em milímetros
    this.xMm = Number(options.xMm ?? 0);
    this.yMm = Number(options.yMm ?? 0);
    this.widthMm = Number(options.widthMm ?? 50);
    this.heightMm = Number(options.heightMm ?? 50);
    this.rotationDeg = Number(options.rotationDeg ?? 0);

    // Contorno e Preenchimento
    this.fillColorSwatchId = options.fillColorSwatchId || null;
    this.strokeColorSwatchId = options.strokeColorSwatchId || null;
    this.strokeWidthPt = Number(options.strokeWidthPt ?? 0);

    // Modo de Contorno de Texto (Wrap)
    this.wrapMode = options.wrapMode || 'none'; // 'none' | 'wrap-obstacle' | 'in-mold'
    this.wrapMarginMm = Number(options.wrapMarginMm ?? 3.0);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      layerId: this.layerId,
      xMm: this.xMm,
      yMm: this.yMm,
      widthMm: this.widthMm,
      heightMm: this.heightMm,
      rotationDeg: this.rotationDeg,
      fillColorSwatchId: this.fillColorSwatchId,
      strokeColorSwatchId: this.strokeColorSwatchId,
      strokeWidthPt: this.strokeWidthPt,
      wrapMode: this.wrapMode,
      wrapMarginMm: this.wrapMarginMm
    };
  }

  static fromJSON(json) {
    if (!json) return null;
    switch (json.type) {
      case 'text': return TextFrame.fromJSON(json);
      case 'image': return ImageFrame.fromJSON(json);
      case 'shape': return ShapeFrame.fromJSON(json);
      default: return new Frame(json);
    }
  }
}

class TextFrame extends Frame {
  constructor(options = {}) {
    super({ ...options, type: 'text' });
    this.storyId = options.storyId || null;
    this.nextFrameId = options.nextFrameId || null;
    this.prevFrameId = options.prevFrameId || null;
    this.columns = Math.max(1, parseInt(options.columns ?? 1, 10));
    this.columnGutterMm = Number(options.columnGutterMm ?? 4.0);
    
    // Margens internas da caixa (Inset Padding)
    this.insetPaddingMm = {
      top: Number(options.insetPaddingMm?.top ?? 0),
      bottom: Number(options.insetPaddingMm?.bottom ?? 0),
      left: Number(options.insetPaddingMm?.left ?? 0),
      right: Number(options.insetPaddingMm?.right ?? 0)
    };

    // Linhas calculadas em tempo de layout
    this.computedLines = [];
    this.hasOverflow = false;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      storyId: this.storyId,
      nextFrameId: this.nextFrameId,
      prevFrameId: this.prevFrameId,
      columns: this.columns,
      columnGutterMm: this.columnGutterMm,
      insetPaddingMm: { ...this.insetPaddingMm }
    };
  }

  static fromJSON(json) {
    return new TextFrame(json);
  }
}

class ImageFrame extends Frame {
  constructor(options = {}) {
    super({ ...options, type: 'image' });
    this.assetPath = options.assetPath || '';
    this.fitMode = options.fitMode || 'fit-proportional'; // 'fit-proportional' | 'fill' | 'center'
    this.scale = Number(options.scale ?? 1.0);
    this.offsetXMm = Number(options.offsetXMm ?? 0);
    this.offsetYMm = Number(options.offsetYMm ?? 0);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      assetPath: this.assetPath,
      fitMode: this.fitMode,
      scale: this.scale,
      offsetXMm: this.offsetXMm,
      offsetYMm: this.offsetYMm
    };
  }

  static fromJSON(json) {
    return new ImageFrame(json);
  }
}

class ShapeFrame extends Frame {
  constructor(options = {}) {
    super({ ...options, type: 'shape' });
    this.shapeType = options.shapeType || 'rect'; // 'rect' | 'circle' | 'polygon'
    this.points = Array.isArray(options.points) ? options.points : [];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      shapeType: this.shapeType,
      points: this.points.map(p => ({ x: p.x, y: p.y }))
    };
  }

  static fromJSON(json) {
    return new ShapeFrame(json);
  }
}

class Page {
  constructor(options = {}) {
    this.id = options.id || `page-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.name = options.name || 'Página';
    this.side = options.side || 'single'; // 'left' | 'right' | 'single'
    this.pageNumber = Number(options.pageNumber ?? 1);
    this.masterPageId = options.masterPageId || null;
    
    // Offset da página dentro do spread
    this.offsetX = Number(options.offsetX ?? 0);
    this.offsetY = Number(options.offsetY ?? 0);
  }

  /**
   * Retorna a mancha gráfica útil da página aplicando as margens do documento
   * @param {Object} pageSetup 
   */
  getContentBox(pageSetup) {
    const isLeft = this.side === 'left';
    const margins = pageSetup.margins;
    const marginLeft = isLeft ? margins.outside : margins.inside;
    const marginRight = isLeft ? margins.inside : margins.outside;

    return {
      x: this.offsetX + marginLeft,
      y: this.offsetY + margins.top,
      width: pageSetup.widthMm - marginLeft - marginRight,
      height: pageSetup.heightMm - margins.top - margins.bottom
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      side: this.side,
      pageNumber: this.pageNumber,
      masterPageId: this.masterPageId,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
  }

  static fromJSON(json) {
    return new Page(json);
  }
}

class Spread {
  constructor(options = {}) {
    this.id = options.id || `spread-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.spreadIndex = Number(options.spreadIndex ?? 0);
    this.pages = [];
    this.frames = [];

    if (options.pages) {
      for (const p of options.pages) this.pages.push(Page.fromJSON(p));
    }
    if (options.frames) {
      for (const f of options.frames) this.frames.push(Frame.fromJSON(f));
    }
  }

  addFrame(frame) {
    this.frames.push(frame);
    return frame;
  }

  removeFrame(frameId) {
    const idx = this.frames.findIndex(f => f.id === frameId);
    if (idx >= 0) {
      return this.frames.splice(idx, 1)[0];
    }
    return null;
  }

  getFrame(frameId) {
    return this.frames.find(f => f.id === frameId) || null;
  }

  toJSON() {
    return {
      id: this.id,
      spreadIndex: this.spreadIndex,
      pages: this.pages.map(p => p.toJSON()),
      frames: this.frames.map(f => f.toJSON())
    };
  }

  static fromJSON(json) {
    return new Spread(json);
  }
}

class Story {
  constructor(options = {}) {
    this.id = options.id || `story-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.title = options.title || 'Nova Matéria';
    this.paragraphs = [];

    if (options.paragraphs) {
      for (const p of options.paragraphs) {
        this.paragraphs.push({
          text: p.text || '',
          paragraphStyleId: p.paragraphStyleId || 'pstyle-body'
        });
      }
    }
  }

  addParagraph(text, paragraphStyleId = 'pstyle-body') {
    this.paragraphs.push({ text, paragraphStyleId });
    return this;
  }

  getFullText() {
    return this.paragraphs.map(p => p.text).join('\n\n');
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      paragraphs: this.paragraphs.map(p => ({ ...p }))
    };
  }

  static fromJSON(json) {
    return new Story(json);
  }
}

class Document {
  constructor(options = {}) {
    this.id = options.id || `doc-${Date.now()}`;
    this.schemaVersion = '1.0.0';
    this.title = options.title || 'Sem Título - OpenDTP';
    this.created = options.created || new Date().toISOString();
    this.modified = options.modified || this.created;

    // Configuração de Página Validada
    this.pageSetup = validatePageSetup(options.pageSetup || {});

    // Gerenciador de Estilos
    this.styleManager = new StyleManager();
    if (options.styles) {
      this.styleManager.loadFromJSON(options.styles);
    }

    // Camadas (Layers)
    this.layers = [];
    if (options.layers && options.layers.length > 0) {
      for (const l of options.layers) this.layers.push(Layer.fromJSON(l));
    } else {
      this.layers.push(new Layer({ id: 'layer-default', name: 'Camada 1', color: '#38bdf8' }));
    }

    // Spreads
    this.spreads = [];
    if (options.spreads && options.spreads.length > 0) {
      for (const s of options.spreads) this.spreads.push(Spread.fromJSON(s));
    }

    // Stories
    this.stories = new Map();
    if (options.stories) {
      for (const s of options.stories) {
        const story = Story.fromJSON(s);
        this.stories.set(story.id, story);
      }
    }
  }

  /**
   * Adiciona uma spread ao documento com base no PageSetup
   * @param {Object} [options]
   */
  addSpread(options = {}) {
    const spreadIndex = this.spreads.length;
    const spreadId = options.id || `spread-${spreadIndex + 1}`;
    const spread = new Spread({ id: spreadId, spreadIndex });

    if (this.pageSetup.facingPages) {
      if (spreadIndex === 0) {
        // Primeira spread de livro: Página 1 à direita (Recto)
        spread.pages.push(new Page({
          id: `page-1`,
          name: 'Página 1',
          side: 'right',
          pageNumber: 1,
          offsetX: this.pageSetup.widthMm, // offset à direita da lombada virtual
          offsetY: 0
        }));
      } else {
        // Spreads duplas subsequentes: Página Ímpar (Verso) e Par (Recto)
        const leftPageNum = spreadIndex * 2;
        const rightPageNum = leftPageNum + 1;

        spread.pages.push(new Page({
          id: `page-${leftPageNum}`,
          name: `Página ${leftPageNum}`,
          side: 'left',
          pageNumber: leftPageNum,
          offsetX: 0,
          offsetY: 0
        }));

        spread.pages.push(new Page({
          id: `page-${rightPageNum}`,
          name: `Página ${rightPageNum}`,
          side: 'right',
          pageNumber: rightPageNum,
          offsetX: this.pageSetup.widthMm,
          offsetY: 0
        }));
      }
    } else {
      // Páginas soltas (Single Page per Spread)
      const pageNum = spreadIndex + 1;
      spread.pages.push(new Page({
        id: `page-${pageNum}`,
        name: `Página ${pageNum}`,
        side: 'single',
        pageNumber: pageNum,
        offsetX: 0,
        offsetY: 0
      }));
    }

    this.spreads.push(spread);
    this.touch();
    return spread;
  }

  addStory(story) {
    this.stories.set(story.id, story);
    this.touch();
    return story;
  }

  getStory(storyId) {
    return this.stories.get(storyId) || null;
  }

  findFrame(frameId) {
    for (const spread of this.spreads) {
      const frame = spread.getFrame(frameId);
      if (frame) return { frame, spread };
    }
    return null;
  }

  findPage(pageId) {
    for (const spread of this.spreads) {
      const page = spread.pages.find(p => p.id === pageId);
      if (page) return { page, spread };
    }
    return null;
  }

  touch() {
    this.modified = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      schemaVersion: this.schemaVersion,
      title: this.title,
      created: this.created,
      modified: this.modified,
      pageSetup: { ...this.pageSetup, margins: { ...this.pageSetup.margins } },
      styles: this.styleManager.toJSON(),
      layers: this.layers.map(l => l.toJSON()),
      spreads: this.spreads.map(s => s.toJSON()),
      stories: Array.from(this.stories.values()).map(st => st.toJSON())
    };
  }

  static fromJSON(json) {
    return new Document(json);
  }
}

const DocModel = {
  Layer,
  Frame,
  TextFrame,
  ImageFrame,
  ShapeFrame,
  Page,
  Spread,
  Story,
  Document
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DocModel;
}

if (typeof window !== 'undefined') {
  window.OpenDTPDocument = DocModel;
}
