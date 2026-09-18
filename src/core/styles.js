/**
 * OpenDTP - Core Styling System
 * 
 * Gerenciamento desacoplado de Estilos de Parágrafo, Estilos de Caractere
 * e Paleta de Cores Swatch (RGB e CMYK).
 */

class ColorSwatch {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {'RGB'|'CMYK'} [options.model='RGB']
   * @param {number[]} options.values - Array com 3 números (RGB 0-1) ou 4 números (CMYK 0-1)
   */
  constructor(options = {}) {
    this.id = options.id || `swatch-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.name = options.name || 'Nova Cor';
    this.model = options.model || 'RGB';
    this.values = Array.isArray(options.values) ? options.values : [0, 0, 0];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      model: this.model,
      values: [...this.values]
    };
  }

  static fromJSON(json) {
    return new ColorSwatch(json);
  }
}

class ParagraphStyle {
  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    this.id = options.id || `pstyle-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.name = options.name || 'Estilo de Parágrafo';
    this.fontFamily = options.fontFamily || 'Helvetica';
    this.fontSizePt = Number(options.fontSizePt ?? 11.0);
    this.lineHeightPt = Number(options.lineHeightPt ?? 15.0);
    this.alignment = options.alignment || 'left'; // 'left' | 'center' | 'right' | 'justify'
    this.firstLineIndentPt = Number(options.firstLineIndentPt ?? 0);
    this.spaceBeforePt = Number(options.spaceBeforePt ?? 0);
    this.spaceAfterPt = Number(options.spaceAfterPt ?? 0);
    this.colorSwatchId = options.colorSwatchId || 'swatch-black';

    // Configurações de hifenização silábica
    this.hyphenation = {
      enabled: Boolean(options.hyphenation?.enabled ?? true),
      minWordLength: Number(options.hyphenation?.minWordLength ?? 5),
      minBefore: Number(options.hyphenation?.minBefore ?? 2),
      minAfter: Number(options.hyphenation?.minAfter ?? 2),
      hyphenLimit: Number(options.hyphenation?.hyphenLimit ?? 2)
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      fontFamily: this.fontFamily,
      fontSizePt: this.fontSizePt,
      lineHeightPt: this.lineHeightPt,
      alignment: this.alignment,
      firstLineIndentPt: this.firstLineIndentPt,
      spaceBeforePt: this.spaceBeforePt,
      spaceAfterPt: this.spaceAfterPt,
      colorSwatchId: this.colorSwatchId,
      hyphenation: { ...this.hyphenation }
    };
  }

  static fromJSON(json) {
    return new ParagraphStyle(json);
  }
}

class CharacterStyle {
  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    this.id = options.id || `cstyle-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    this.name = options.name || 'Estilo de Caractere';
    this.fontFamily = options.fontFamily || null; // null = herda do parágrafo
    this.fontSizePt = options.fontSizePt != null ? Number(options.fontSizePt) : null;
    this.bold = Boolean(options.bold ?? false);
    this.italic = Boolean(options.italic ?? false);
    this.underline = Boolean(options.underline ?? false);
    this.colorSwatchId = options.colorSwatchId || null;
    this.tracking = Number(options.tracking ?? 0); // espaçamento entre letras
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      fontFamily: this.fontFamily,
      fontSizePt: this.fontSizePt,
      bold: this.bold,
      italic: this.italic,
      underline: this.underline,
      colorSwatchId: this.colorSwatchId,
      tracking: this.tracking
    };
  }

  static fromJSON(json) {
    return new CharacterStyle(json);
  }
}

class StyleManager {
  constructor() {
    this.swatches = new Map();
    this.paragraphStyles = new Map();
    this.characterStyles = new Map();

    this.initDefaults();
  }

  initDefaults() {
    // Cores Básicas de Pré-Impressão
    this.addSwatch(new ColorSwatch({ id: 'swatch-paper', name: '[Papel]', model: 'CMYK', values: [0, 0, 0, 0] }));
    this.addSwatch(new ColorSwatch({ id: 'swatch-black', name: '[Preto]', model: 'CMYK', values: [0, 0, 0, 1] }));
    this.addSwatch(new ColorSwatch({ id: 'swatch-registration', name: '[Registro]', model: 'CMYK', values: [1, 1, 1, 1] }));
    this.addSwatch(new ColorSwatch({ id: 'swatch-cyan', name: 'Ciano Processo', model: 'CMYK', values: [1, 0, 0, 0] }));
    this.addSwatch(new ColorSwatch({ id: 'swatch-magenta', name: 'Magenta Processo', model: 'CMYK', values: [0, 1, 0, 0] }));
    this.addSwatch(new ColorSwatch({ id: 'swatch-yellow', name: 'Amarelo Processo', model: 'CMYK', values: [0, 0, 1, 0] }));

    // Estilos de Parágrafo Padrão
    this.addParagraphStyle(new ParagraphStyle({
      id: 'pstyle-body',
      name: 'Corpo de Texto',
      fontFamily: 'Helvetica',
      fontSizePt: 10.5,
      lineHeightPt: 14.5,
      alignment: 'left',
      firstLineIndentPt: 0,
      spaceAfterPt: 6.0,
      colorSwatchId: 'swatch-black'
    }));

    this.addParagraphStyle(new ParagraphStyle({
      id: 'pstyle-h1',
      name: 'Título Principal (H1)',
      fontFamily: 'Helvetica',
      fontSizePt: 24.0,
      lineHeightPt: 28.0,
      alignment: 'left',
      spaceBeforePt: 12.0,
      spaceAfterPt: 8.0,
      colorSwatchId: 'swatch-black'
    }));

    this.addParagraphStyle(new ParagraphStyle({
      id: 'pstyle-h2',
      name: 'Subtítulo (H2)',
      fontFamily: 'Helvetica',
      fontSizePt: 16.0,
      lineHeightPt: 20.0,
      alignment: 'left',
      spaceBeforePt: 8.0,
      spaceAfterPt: 4.0,
      colorSwatchId: 'swatch-black'
    }));

    this.addParagraphStyle(new ParagraphStyle({
      id: 'pstyle-caption',
      name: 'Legenda de Imagem',
      fontFamily: 'Helvetica',
      fontSizePt: 8.5,
      lineHeightPt: 11.0,
      alignment: 'left',
      colorSwatchId: 'swatch-black'
    }));
  }

  addSwatch(swatch) {
    this.swatches.set(swatch.id, swatch);
    return swatch;
  }

  getSwatch(id) {
    return this.swatches.get(id) || this.swatches.get('swatch-black');
  }

  addParagraphStyle(style) {
    this.paragraphStyles.set(style.id, style);
    return style;
  }

  getParagraphStyle(id) {
    return this.paragraphStyles.get(id) || this.paragraphStyles.get('pstyle-body');
  }

  addCharacterStyle(style) {
    this.characterStyles.set(style.id, style);
    return style;
  }

  getCharacterStyle(id) {
    return this.characterStyles.get(id) || null;
  }

  toJSON() {
    return {
      swatches: Array.from(this.swatches.values()).map(s => s.toJSON()),
      paragraphStyles: Array.from(this.paragraphStyles.values()).map(p => p.toJSON()),
      characterStyles: Array.from(this.characterStyles.values()).map(c => c.toJSON())
    };
  }

  loadFromJSON(json = {}) {
    this.swatches.clear();
    this.paragraphStyles.clear();
    this.characterStyles.clear();

    if (json.swatches) {
      for (const s of json.swatches) this.addSwatch(ColorSwatch.fromJSON(s));
    }
    if (json.paragraphStyles) {
      for (const p of json.paragraphStyles) this.addParagraphStyle(ParagraphStyle.fromJSON(p));
    }
    if (json.characterStyles) {
      for (const c of json.characterStyles) this.addCharacterStyle(CharacterStyle.fromJSON(c));
    }
  }
}

const Styles = {
  ColorSwatch,
  ParagraphStyle,
  CharacterStyle,
  StyleManager
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Styles;
}

if (typeof window !== 'undefined') {
  window.OpenDTPStyles = Styles;
}
