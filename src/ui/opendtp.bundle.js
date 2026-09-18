/**
 * OpenDTP - Core Engine Client Bundle
 * Gerado automaticamente para execução limpa no browser e desktop
 */
(function(global) {
  const modules = {};
  const cache = {};

  function define(id, factory) {
    modules[id] = factory;
  }

  function requireModule(id) {
    // Normalizar id relativo
    const cleanId = id.replace(/\.js$/, '');
    if (cache[cleanId]) return cache[cleanId];
    if (!modules[cleanId]) {
      throw new Error('Módulo não encontrado no bundle: ' + id);
    }
    const module = { exports: {} };
    modules[cleanId](module, module.exports, requireModule);
    cache[cleanId] = module.exports;
    return cache[cleanId];
  }

  // Module: ./units
  define('./units', function(module, exports, require) {
/**
 * OpenDTP - Core Units Engine
 * 
 * Módulo ortogonal e desacoplado para conversão e manipulação de unidades
 * tipográficas e métricas de editoração e pré-impressão.
 * 
 * Padrão Internacional ISO e DTP (PostScript / PDF):
 * 1 polegada = 25.4 mm = 72 pontos tipográficos (pt)
 * 1 pica = 12 pontos (pt)
 */

const PT_PER_INCH = 72;
const MM_PER_INCH = 25.4;
const PT_PER_MM = PT_PER_INCH / MM_PER_INCH; // ~2.834645669291339
const MM_PER_PT = MM_PER_INCH / PT_PER_INCH; // ~0.352777777777778
const PT_PER_PICA = 12;

/**
 * Converte milímetros para pontos tipográficos (DTP pt)
 * @param {number} mm
 * @returns {number} pt
 */
function mmToPt(mm) {
  return mm * PT_PER_MM;
}

/**
 * Converte pontos tipográficos (DTP pt) para milímetros
 * @param {number} pt
 * @returns {number} mm
 */
function ptToMm(pt) {
  return pt * MM_PER_PT;
}

/**
 * Converte polegadas para pontos tipográficos (DTP pt)
 * @param {number} inches
 * @returns {number} pt
 */
function inToPt(inches) {
  return inches * PT_PER_INCH;
}

/**
 * Converte pontos tipográficos para polegadas
 * @param {number} pt
 * @returns {number} inches
 */
function ptToIn(pt) {
  return pt / PT_PER_INCH;
}

/**
 * Converte picas para pontos tipográficos
 * @param {number} picas
 * @returns {number} pt
 */
function picaToPt(picas) {
  return picas * PT_PER_PICA;
}

/**
 * Converte pontos tipográficos para picas
 * @param {number} pt
 * @returns {number} picas
 */
function ptToPica(pt) {
  return pt / PT_PER_PICA;
}

/**
 * Converte pixels de tela para pontos tipográficos dado um DPI
 * (DPI padrão de tela CSS/Web: 96 DPI; padrão DTP: 72 DPI)
 * @param {number} px
 * @param {number} [dpi=96]
 * @returns {number} pt
 */
function pxToPt(px, dpi = 96) {
  return (px / dpi) * PT_PER_INCH;
}

/**
 * Converte pontos tipográficos para pixels de tela dado um DPI
 * @param {number} pt
 * @param {number} [dpi=96]
 * @returns {number} px
 */
function ptToPx(pt, dpi = 96) {
  return (pt / PT_PER_INCH) * dpi;
}

/**
 * Converte milímetros diretamente para pixels de tela para renderização em canvas
 * @param {number} mm
 * @param {number} [dpi=96]
 * @returns {number} px
 */
function mmToPx(mm, dpi = 96) {
  return (mm / MM_PER_INCH) * dpi;
}

/**
 * Converte pixels de tela para milímetros
 * @param {number} px
 * @param {number} [dpi=96]
 * @returns {number} mm
 */
function pxToMm(px, dpi = 96) {
  return (px / dpi) * MM_PER_INCH;
}

/**
 * Formata um número com precisão controlada sem ruído IEEE 754
 * @param {number} val
 * @param {number} [decimals=4]
 * @returns {number}
 */
function roundPrecision(val, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Formata um valor numérico para escrita em operadores de PDF
 * (sem notação científica indesejada e sem zeros supérfluos)
 * @param {number} val
 * @param {number} [decimals=4]
 * @returns {string}
 */
function formatPdfNumber(val, decimals = 4) {
  const rounded = roundPrecision(val, decimals);
  if (Object.is(rounded, -0)) return '0';
  return rounded.toString();
}

const Units = {
  PT_PER_INCH,
  MM_PER_INCH,
  PT_PER_MM,
  MM_PER_PT,
  PT_PER_PICA,
  mmToPt,
  ptToMm,
  inToPt,
  ptToIn,
  picaToPt,
  ptToPica,
  pxToPt,
  ptToPx,
  mmToPx,
  pxToMm,
  roundPrecision,
  formatPdfNumber
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Units;
}

if (typeof window !== 'undefined') {
  window.OpenDTPUnits = Units;
}

  });

  // Module: ./schema
  define('./schema', function(module, exports, require) {
/**
 * OpenDTP - Core Schema & Specifications
 * 
 * Definição de padrões de página, validações estruturais e configurações
 * default do documento editorial (livre de heurísticas ocultas ou números mágicos).
 */

const { PT_PER_MM } = (typeof require !== 'undefined') ? require('./units') : window.OpenDTPUnits;

// Presets Oficiais de Dimensões de Página (em Milímetros)
const PAGE_PRESETS = {
  A4: { name: 'A4', widthMm: 210.0, heightMm: 297.0 },
  A3: { name: 'A3', widthMm: 297.0, heightMm: 420.0 },
  A5: { name: 'A5', widthMm: 148.0, heightMm: 210.0 },
  Letter: { name: 'Carta (Letter)', widthMm: 215.9, heightMm: 279.4 },
  Legal: { name: 'Ofício (Legal)', widthMm: 215.9, heightMm: 355.6 },
  Tabloid: { name: 'Tablóide', widthMm: 279.4, heightMm: 431.8 },
  SquareBook: { name: 'Livro Quadrado', widthMm: 210.0, heightMm: 210.0 },
  TradePaperback: { name: 'Livro de Bolso (Trade)', widthMm: 152.4, heightMm: 228.6 }
};

// Configuração Padrão de Projeto / Documento
const DEFAULT_PAGE_SETUP = {
  preset: 'A4',
  widthMm: 210.0,
  heightMm: 297.0,
  orientation: 'portrait', // 'portrait' | 'landscape'
  facingPages: true,       // true: Spreads duplas (Lâminas); false: Páginas soltas
  bleedMm: 3.0,            // Sangria técnica gráfica internacional padrão
  slugMm: 10.0,            // Margem de folha externa para marcas de corte e registro
  margins: {
    top: 20.0,             // Margem Superior (Cabeçalho) em mm
    bottom: 20.0,          // Margem Inferior (Rodapé) em mm
    inside: 25.0,          // Margem Interna (Lombada) em mm
    outside: 15.0          // Margem Externa (Corte) em mm
  }
};

/**
 * Valida se um objeto de PageSetup possui todas as propriedades numéricas válidas
 * @param {Object} setup 
 * @returns {Object} setup normalizado
 */
function validatePageSetup(setup = {}) {
  const widthMm = Number(setup.widthMm ?? DEFAULT_PAGE_SETUP.widthMm);
  const heightMm = Number(setup.heightMm ?? DEFAULT_PAGE_SETUP.heightMm);
  const bleedMm = Number(setup.bleedMm ?? DEFAULT_PAGE_SETUP.bleedMm);
  const slugMm = Number(setup.slugMm ?? DEFAULT_PAGE_SETUP.slugMm);

  if (widthMm <= 0 || heightMm <= 0) {
    throw new Error(`Dimensões de página inválidas: ${widthMm}x${heightMm}mm`);
  }

  const rawMargins = setup.margins || {};
  const margins = {
    top: Number(rawMargins.top ?? DEFAULT_PAGE_SETUP.margins.top),
    bottom: Number(rawMargins.bottom ?? DEFAULT_PAGE_SETUP.margins.bottom),
    inside: Number(rawMargins.inside ?? DEFAULT_PAGE_SETUP.margins.inside),
    outside: Number(rawMargins.outside ?? DEFAULT_PAGE_SETUP.margins.outside)
  };

  if (margins.top + margins.bottom >= heightMm) {
    throw new Error('A soma das margens verticais não pode exceder ou igualar a altura da página.');
  }

  if (margins.inside + margins.outside >= widthMm) {
    throw new Error('A soma das margens horizontais não pode exceder ou igualar a largura da página.');
  }

  return {
    preset: setup.preset || 'Custom',
    widthMm,
    heightMm,
    orientation: setup.orientation === 'landscape' ? 'landscape' : 'portrait',
    facingPages: Boolean(setup.facingPages ?? DEFAULT_PAGE_SETUP.facingPages),
    bleedMm,
    slugMm,
    margins
  };
}

/**
 * Valida a integridade referencial de um documento OpenDTP
 * @param {Object} docJSON 
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDocumentIntegrity(docJSON) {
  const errors = [];

  if (!docJSON || typeof docJSON !== 'object') {
    return { valid: false, errors: ['O documento deve ser um objeto JSON válido.'] };
  }

  if (!docJSON.schemaVersion) {
    errors.push('Campo obrigatório ausente: schemaVersion.');
  }

  // Verificar IDs de páginas
  const pageIds = new Set();
  const frameIds = new Set();
  const storyIds = new Set((docJSON.stories || []).map(s => s.id));

  for (const spread of docJSON.spreads || []) {
    for (const page of spread.pages || []) {
      if (pageIds.has(page.id)) {
        errors.push(`ID de página duplicado: ${page.id}.`);
      }
      pageIds.add(page.id);
    }

    for (const frame of spread.frames || []) {
      if (frameIds.has(frame.id)) {
        errors.push(`ID de frame duplicado: ${frame.id}.`);
      }
      frameIds.add(frame.id);

      // Se for TextFrame com storyId, verifica se a story existe
      if (frame.type === 'text' && frame.storyId && !storyIds.has(frame.storyId)) {
        errors.push(`Frame ${frame.id} faz referência a uma Story inexistente: ${frame.storyId}.`);
      }
    }
  }

  // Verificar links de encadeamento entre frames (Next/Prev)
  for (const spread of docJSON.spreads || []) {
    for (const frame of spread.frames || []) {
      if (frame.nextFrameId && !frameIds.has(frame.nextFrameId)) {
        errors.push(`Frame ${frame.id} aponta nextFrameId para frame inexistente: ${frame.nextFrameId}.`);
      }
      if (frame.prevFrameId && !frameIds.has(frame.prevFrameId)) {
        errors.push(`Frame ${frame.id} aponta prevFrameId para frame inexistente: ${frame.prevFrameId}.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

const Schema = {
  PAGE_PRESETS,
  DEFAULT_PAGE_SETUP,
  validatePageSetup,
  validateDocumentIntegrity
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Schema;
}

if (typeof window !== 'undefined') {
  window.OpenDTPSchema = Schema;
}

  });

  // Module: ./styles
  define('./styles', function(module, exports, require) {
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

  });

  // Module: ./hyphenator
  define('./hyphenator', function(module, exports, require) {
/**
 * core/hyphenator.js - Módulo de Hifenização Silábica para Português
 * Baseado nas regras fonéticas da ABL e padrões Liang do TeX
 */

const Hyphenator = {
  VOWELS: 'aeiouáéíóúâêîôûãõàèìòùäëïöü',

  isVowel(c) {
    return c && this.VOWELS.includes(c.toLowerCase());
  },

  isConsonant(c) {
    return c && /[a-z]/i.test(c) && !this.isVowel(c);
  },

  syllabify(word) {
    const match = word.match(/^([^\wáéíóúâêîôûãõàèìòùç]*)([\wáéíóúâêîôûãõàèìòùç]+)([^\wáéíóúâêîôûãõàèìòùç]*)$/i);
    if (!match) return [word];

    const prefix = match[1];
    const core = match[2];
    const suffix = match[3];

    if (core.length <= 3) return [word];

    const letters = core.split('');
    const syllables = [];
    let cur = '';

    for (let i = 0; i < letters.length; i++) {
      cur += letters[i];
      const c = letters[i];
      const next = letters[i + 1];
      const next2 = letters[i + 2];
      const next3 = letters[i + 3];

      if (!next) break;

      // Dígrafos inseparáveis: ch, lh, nh, qu, gu
      const digraph = (c + next).toLowerCase();
      if (['ch', 'lh', 'nh', 'qu', 'gu'].includes(digraph)) {
        continue;
      }

      // Dígrafos separáveis: rr, ss, sc, sç, xc
      if (['rr', 'ss', 'sc', 'sç', 'xc'].includes(digraph)) {
        syllables.push(cur);
        cur = '';
        continue;
      }

      // Coda consonantal (ex: com-po, es-tag, im-pres, trans-bor)
      // Se c é consoante de fechamento (m, n, r, s, l, x, z) precedida de vogal, e next é outra consoante
      if (cur.length >= 2 && this.isConsonant(c) && ['m', 'n', 'r', 's', 'l', 'x', 'z'].includes(c.toLowerCase()) && this.isConsonant(next)) {
        // Exceto se next for encontro consonantal líquido como tr, pr, etc.
        const blend = (next + (next2 || '')).toLowerCase();
        if (!/[bcdfgptv][rl]/.test(blend)) {
          syllables.push(cur);
          cur = '';
          continue;
        }
      }

      // Regra V-CV: Vogal seguida de consoante única + vogal
      if (this.isVowel(c) && this.isConsonant(next) && next2 && this.isVowel(next2)) {
        syllables.push(cur);
        cur = '';
        continue;
      }

      // Regra VC-CV: Consoante + Consoante entre vogais (exceto encontros líquidos)
      if (this.isConsonant(c) && this.isConsonant(next)) {
        const blend = (c + next).toLowerCase();
        const isLiquidBlend = /[bcdfgptv][rl]/.test(blend);
        if (!isLiquidBlend) {
          syllables.push(cur);
          cur = '';
          continue;
        }
      }
    }

    if (cur.length > 0) {
      if (syllables.length === 0) {
        syllables.push(cur);
      } else {
        syllables[syllables.length - 1] += cur;
      }
    }

    syllables[0] = prefix + syllables[0];
    syllables[syllables.length - 1] = syllables[syllables.length - 1] + suffix;

    return syllables;
  },

  getHyphenationPoints(word, config = {}) {
    const { minWordLength = 5, minBefore = 2, minAfter = 2 } = config;
    const cleanLetters = word.replace(/[^\wáéíóúâêîôûãõàèìòùç]/gi, '');
    if (cleanLetters.length < minWordLength) return [];

    const syllables = this.syllabify(word);
    if (syllables.length <= 1) return [];

    const cuts = [];
    let accumulated = '';

    for (let i = 0; i < syllables.length - 1; i++) {
      accumulated += syllables[i];
      const remainder = syllables.slice(i + 1).join('');
      const cleanBefore = accumulated.replace(/[^\wáéíóúâêîôûãõàèìòùç]/gi, '');
      const cleanAfter = remainder.replace(/[^\wáéíóúâêîôûãõàèìòùç]/gi, '');

      if (cleanBefore.length >= minBefore && cleanAfter.length >= minAfter) {
        cuts.push({
          head: accumulated + '-',
          tail: remainder
        });
      }
    }

    // Retorna ordenado do maior corte (mais sílabas) para o menor
    return cuts.reverse();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Hyphenator };
}

if (typeof window !== 'undefined') {
  window.OpenDTPHyphenator = { Hyphenator };
}

  });

  // Module: ./spatial
  define('./spatial', function(module, exports, require) {
/**
 * src/core/spatial.js - Módulo de Otimização Espacial e Viewport Culling
 * Responsabilidade: Cálculo de AABB (Axis-Aligned Bounding Box), descarte
 * de geometrias fora do campo de visão (Frustum/Viewport Culling) e LOD (Greeking).
 * Pura matemática espacial 2D, 100% desacoplada.
 */

const SpatialEngine = {
  /**
   * Calcula o AABB visível no mundo a partir dos parâmetros de câmera
   */
  getViewportAABB(screenWidth, screenHeight, panX, panY, zoom, margin = 50) {
    return {
      minX: (-panX - margin) / zoom,
      minY: (-panY - margin) / zoom,
      maxX: (screenWidth - panX + margin) / zoom,
      maxY: (screenHeight - panY + margin) / zoom
    };
  },

  /**
   * Testa colisão de caixas alinhadas aos eixos (AABB Intersect)
   */
  intersectsAABB(boxA, boxB) {
    return !(
      boxA.maxX < boxB.minX ||
      boxA.minX > boxB.maxX ||
      boxA.maxY < boxB.minY ||
      boxA.minY > boxB.maxY
    );
  },

  /**
   * Filtra uma lista de entidades/páginas retornando apenas as visíveis
   */
  cullEntities(entities, viewportAABB) {
    const visible = [];
    let culledCount = 0;

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      const entityAABB = {
        minX: e.x,
        minY: e.y,
        maxX: e.x + e.width,
        maxY: e.y + e.height
      };

      if (this.intersectsAABB(entityAABB, viewportAABB)) {
        visible.push(e);
      } else {
        culledCount++;
      }
    }

    return { visible, culledCount, total: entities.length };
  },

  /**
   * Determina se o texto deve sofrer "Greeking" (renderização simplificada em barras cinzas)
   * quando o tamanho aparente na tela for inferior ao limiar de legibilidade óptica.
   */
  shouldGreek(fontSize, zoom, thresholdPx = 4.5) {
    return (fontSize * zoom) < thresholdPx;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpatialEngine };
}

if (typeof window !== 'undefined') {
  window.OpenDTPSpatial = { SpatialEngine };
}

  });

  // Module: ./slicer
  define('./slicer', function(module, exports, require) {
/**
 * core/modules.js - Arquitetura Modular Desacoplada (Sem Heurísticas Engessadas)
 * 
 * Separação estrita em 4 módulos independentes:
 * 1. GeometryModule: Matemática pura de fatiamento (sem saber o que é texto).
 * 2. TokenizerModule: Estruturação de conteúdo em tokens/parágrafos.
 * 3. FlowEngine: Distribuição genérica de tokens em recipientes geométricos.
 * 4. AlignmentStrategies: Políticas modulares e plugáveis de alinhamento e justificação.
 */

// ============================================================================
// 1. MÓDULO GEOMÉTRICO (GEOMETRY ENGINE) - Pura Geometria 2D
// ============================================================================
const GeometryEngine = {
  getIntersectionX(y, p1, p2) {
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    if (y < minY || y >= maxY) return null;
    if (p1.y === p2.y) return null;
    const t = (y - p1.y) / (p2.y - p1.y);
    return p1.x + t * (p2.x - p1.x);
  },

  // Algoritmo de Suavização Chaikin Genérico
  smoothPoints(points, iterations = 2) {
    let current = points;
    for (let it = 0; it < iterations; it++) {
      const next = [];
      const n = current.length;
      for (let i = 0; i < n; i++) {
        const p1 = current[i];
        const p2 = current[(i + 1) % n];
        next.push({ x: 0.75 * p1.x + 0.25 * p2.x, y: 0.75 * p1.y + 0.25 * p2.y });
        next.push({ x: 0.25 * p1.x + 0.75 * p2.x, y: 0.25 * p1.y + 0.75 * p2.y });
      }
      current = next;
    }
    return current;
  },

  // Expansão de Polígono por Offset Genérico
  offsetPolygon(points, distance) {
    if (distance === 0) return points;
    const n = points.length;
    let cx = 0, cy = 0;
    for (const p of points) { cx += p.x; cy += p.y; }
    cx /= n; cy /= n;
    return points.map(p => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return p;
      return { x: p.x + (dx / dist) * distance, y: p.y + (dy / dist) * distance };
    });
  },

  // Subtração 1D Booleana de Intervalos
  subtractIntervals(baseSegments, cutStart, cutEnd) {
    const nextSegs = [];
    for (const seg of baseSegments) {
      const segStart = seg.x;
      const segEnd = seg.x + seg.width;
      if (cutEnd <= segStart || cutStart >= segEnd) {
        nextSegs.push(seg);
        continue;
      }
      if (cutStart > segStart) nextSegs.push({ x: segStart, width: cutStart - segStart });
      if (cutEnd < segEnd) nextSegs.push({ x: cutEnd, width: segEnd - cutEnd });
    }
    return nextSegs;
  },

  // Fatiamento por Scanline Paramétrico
  computeSlices(container, obstacles = [], options = {}) {
    const { lineHeight, wrapMargin = 0, smoothing = 0, minWidth = 0, wrapMode = 'both' } = options;
    const slices = [];

    // Determinar limites verticais (startY, endY) do container
    let startY = 0;
    let endY = 0;
    if (container.type === 'circle') {
      startY = container.cy - container.radius;
      endY = container.cy + container.radius;
    } else if (container.type === 'polygon') {
      const ys = container.points.map(p => p.y);
      startY = Math.min(...ys);
      endY = Math.max(...ys);
    } else {
      startY = container.y;
      endY = container.y + container.height;
    }

    // Pré-processar obstáculos poligonais
    const processedObstacles = (obstacles || []).map(obs => {
      if (obs.type === 'polygon') {
        const expanded = GeometryEngine.offsetPolygon(obs.points, wrapMargin);
        const smoothed = smoothing > 0 ? GeometryEngine.smoothPoints(expanded, smoothing) : expanded;
        return { type: 'polygon', points: smoothed };
      }
      return obs;
    });

    for (let y = startY; y < endY; y += lineHeight) {
      const lineMid = y + lineHeight / 2;

      // 1. Gera segmentos base DENTRO do container
      let segments = [];
      if (container.type === 'circle') {
        const dy = Math.abs(lineMid - container.cy);
        if (dy < container.radius) {
          const dx = Math.sqrt(container.radius * container.radius - dy * dy);
          segments = [{ x: container.cx - dx, width: 2 * dx }];
        }
      } else if (container.type === 'polygon') {
        const inter = [];
        const n = container.points.length;
        for (let i = 0; i < n; i++) {
          const p1 = container.points[i], p2 = container.points[(i + 1) % n];
          const x = GeometryEngine.getIntersectionX(lineMid, p1, p2);
          if (x !== null) inter.push(x);
        }
        if (inter.length >= 2) {
          inter.sort((a, b) => a - b);
          for (let i = 0; i < inter.length - 1; i += 2) {
            segments.push({ x: inter[i], width: inter[i + 1] - inter[i] });
          }
        }
      } else {
        segments = [{ x: container.x, width: container.width }];
      }

      if (segments.length === 0) continue;

      // 2. Subtrai obstáculos (se existirem)
      // Política 'jump': pular linhas interceptadas por obstáculos
      if (wrapMode === 'jump' && processedObstacles.length > 0) {
        let inside = false;
        for (const obs of processedObstacles) {
          if (obs.type === 'circle' && Math.abs(lineMid - obs.cy) < obs.radius + wrapMargin) {
            inside = true; break;
          }
          if (obs.type === 'polygon') {
            const minY = Math.min(...obs.points.map(p => p.y));
            const maxY = Math.max(...obs.points.map(p => p.y));
            if (lineMid >= minY && lineMid <= maxY) { inside = true; break; }
          }
        }
        if (inside) continue;
      }

      for (const obs of processedObstacles) {
        const cuts = [];
        if (obs.type === 'circle') {
          const r = obs.radius + wrapMargin;
          const dy = lineMid - obs.cy;
          if (Math.abs(dy) < r) {
            const dx = Math.sqrt(r * r - dy * dy);
            cuts.push({ start: obs.cx - dx, end: obs.cx + dx });
          }
        } else if (obs.type === 'polygon') {
          const inter = [];
          const n = obs.points.length;
          for (let i = 0; i < n; i++) {
            const p1 = obs.points[i], p2 = obs.points[(i + 1) % n];
            const x = GeometryEngine.getIntersectionX(lineMid, p1, p2);
            if (x !== null) inter.push(x);
          }
          if (inter.length >= 2) {
            inter.sort((a, b) => a - b);
            for (let i = 0; i < inter.length - 1; i += 2) {
              cuts.push({ start: inter[i], end: inter[i + 1] });
            }
          }
        }

        for (const cut of cuts) {
          segments = GeometryEngine.subtractIntervals(segments, cut.start, cut.end);
        }
      }

      // Filtrar pelo critério paramétrico de largura mínima
      let filtered = segments.filter(s => s.width >= minWidth);

      // Política 'largest': selecionar estritamente o maior segmento disponível
      if (wrapMode === 'largest' && filtered.length > 1) {
        filtered.sort((a, b) => b.width - a.width);
        filtered = [filtered[0]];
      }

      if (filtered.length > 0) {
        filtered.sort((a, b) => a.x - b.x);
        slices.push({ y, height: lineHeight, segments: filtered });
      }
    }

    return { slices, processedObstacles };
  }
};

// ============================================================================
const { Hyphenator } = (typeof require !== 'undefined') ? require('./hyphenator') : window.OpenDTPHyphenator;

// ============================================================================
// 2. MÓDULO DE FLUXO (FLOW ENGINE) - Tipografia e Distribuição com Hifenização
// ============================================================================
const FlowEngine = {
  /**
   * Encaixa um fluxo de palavras em uma sequência de fatias com hifenização silábica opcional
   * @param {Array<string>} words - Lista de palavras
   * @param {Array<Object>} slices - Fatias calculadas pela geometria
   * @param {Function} measureFn - Função de medição de largura
   * @param {number} spaceWidth - Largura do espaço em branco
   * @param {Object} hyphenOptions - Opções de hifenização ({ enabled, minWordLength, minBefore, minAfter, hyphenLimit })
   * @returns {{ lines: Array<Object>, remainingWords: Array<string>, hyphenCount: number }}
   */
  fitWordsToSlices(words, slices, measureFn, spaceWidth, hyphenOptions = {}) {
    const lines = [];
    const tokenQueue = [...words];
    let consecutiveHyphens = 0;
    let totalHyphens = 0;

    const {
      enabled: hyphenEnabled = false,
      minWordLength = 5,
      minBefore = 2,
      minAfter = 2,
      hyphenLimit = 3
    } = hyphenOptions;

    for (const slice of slices) {
      for (const seg of slice.segments) {
        if (tokenQueue.length === 0) break;

        const currentWords = [];
        let currentWidth = 0;
        let lineEndedWithHyphen = false;

        while (tokenQueue.length > 0) {
          const word = tokenQueue[0];
          const wordWidth = measureFn(word);
          const nextWidth = currentWords.length === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;

          if (nextWidth <= seg.width) {
            currentWords.push(tokenQueue.shift());
            currentWidth = nextWidth;
          } else {
            // Tenta hifenização silábica se permitido e não ultrapassou o limite consecutivo
            if (hyphenEnabled && consecutiveHyphens < hyphenLimit) {
              const availWidth = seg.width - (currentWords.length === 0 ? 0 : currentWidth + spaceWidth);
              const cuts = Hyphenator.getHyphenationPoints(word, { minWordLength, minBefore, minAfter });

              let cutFound = null;
              for (const cut of cuts) {
                const headW = measureFn(cut.head);
                if (headW <= availWidth) {
                  cutFound = cut;
                  break;
                }
              }

              if (cutFound) {
                currentWords.push(cutFound.head);
                currentWidth += (currentWords.length === 1 ? 0 : spaceWidth) + measureFn(cutFound.head);
                tokenQueue[0] = cutFound.tail;
                lineEndedWithHyphen = true;
                totalHyphens++;
              }
            }
            break;
          }
        }

        if (lineEndedWithHyphen) {
          consecutiveHyphens++;
        } else if (currentWords.length > 0) {
          consecutiveHyphens = 0;
        }

        if (currentWords.length > 0) {
          lines.push({
            words: currentWords,
            textWidth: currentWidth,
            x: seg.x,
            y: slice.y + slice.height / 2,
            targetWidth: seg.width
          });
        }
      }
    }

    return {
      lines,
      remainingWords: tokenQueue,
      hyphenCount: totalHyphens
    };
  }
};

// ============================================================================
// 3. ESTRATÉGIAS MODULARES DE ALINHAMENTO (ALIGNMENT STRATEGIES)
// ============================================================================
const AlignmentStrategies = {
  // Alinhamento à Esquerda
  left(ctx, line) {
    ctx.fillText(line.words.join(' '), line.x, line.y);
  },

  // Justificação Paramétrica com Tolerância Máxima Plugável
  justify(ctx, line, options = {}) {
    const { maxSpacingFactor = 1.8 } = options;
    const words = line.words;
    if (words.length <= 1) {
      ctx.fillText(words.join(' '), line.x, line.y);
      return;
    }

    const normalSpace = ctx.measureText(' ').width;
    let textOnlyWidth = 0;
    for (const w of words) textOnlyWidth += ctx.measureText(w).width;

    const availableExtra = line.targetWidth - textOnlyWidth;
    const extraPerSpace = availableExtra / (words.length - 1);

    // Se o espaço ultrapassar a tolerância máxima configurada, recorre ao Left
    if (extraPerSpace > normalSpace * maxSpacingFactor) {
      ctx.fillText(words.join(' '), line.x, line.y);
      return;
    }

    let curX = line.x;
    for (const w of words) {
      ctx.fillText(w, curX, line.y);
      curX += ctx.measureText(w).width + extraPerSpace;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GeometryEngine,
    FlowEngine,
    AlignmentStrategies
  };
}

if (typeof window !== 'undefined') {
  window.OpenDTPCore = {
    GeometryEngine,
    FlowEngine,
    AlignmentStrategies
  };
}

  });

  // Module: ./pdf
  define('./pdf', function(module, exports, require) {
/**
 * OpenDTP - Core PDF Vector Engine
 * 
 * Emissor de PDF 1.7 puro, modular e de alto desempenho, compatível com as
 * normas ISO 32000-1 e requisitos de pré-impressão profissional (PDF/X).
 * 
 * Recursos:
 * - Dicionários de caixas oficiais: MediaBox, BleedBox, TrimBox, CropBox
 * - Mapeamento ortogonal de coordenadas (Inversão de Y da tela para PDF)
 * - Desenho vetorial: retângulos, caminhos, polígonos, espessuras e traçados
 * - Suporte a modelos de cor RGB e CMYK
 * - Texto vetorial puro selecionável com fontes padrão Type 1 (Helvetica, Times, Courier)
 * - Geração de marcas de pré-impressão profissionais (marcas de corte, registro, escala CMYK e slug)
 * - Tabela XRef e trailer gerados dinamicamente com cálculo preciso de byte offsets
 */

const {
  mmToPt,
  ptToMm,
  formatPdfNumber
} = (typeof require !== 'undefined') ? require('./units') : window.OpenDTPUnits;

/**
 * Escapa strings literais para uso em operadores de texto do PDF
 * @param {string} str 
 * @returns {string}
 */
function escapePdfString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Classe principal do Documento PDF OpenDTP
 */
class PdfDocument {
  /**
   * @param {Object} options
   * @param {number} [options.trimWidthMm=150] - Largura da página acabada (Trim) em mm
   * @param {number} [options.trimHeightMm=150] - Altura da página acabada (Trim) em mm
   * @param {number} [options.bleedMm=3] - Sangria gráfica em mm
   * @param {number} [options.slugMarginMm=10] - Margem externa da folha para marcas de corte e registro em mm
   * @param {string} [options.title='OpenDTP Document'] - Título do documento
   */
  constructor(options = {}) {
    this.title = options.title || 'OpenDTP Document';
    this.trimWidthMm = options.trimWidthMm ?? 150;
    this.trimHeightMm = options.trimHeightMm ?? 150;
    this.bleedMm = options.bleedMm ?? 3;
    this.slugMarginMm = options.slugMarginMm ?? 10;

    // Converter para pontos tipográficos (pt)
    this.trimWidthPt = mmToPt(this.trimWidthMm);
    this.trimHeightPt = mmToPt(this.trimHeightMm);
    this.bleedPt = mmToPt(this.bleedMm);
    this.slugMarginPt = mmToPt(this.slugMarginMm);

    // Dimensão total da folha gráfica (MediaBox)
    this.mediaWidthPt = this.trimWidthPt + (2 * this.slugMarginPt);
    this.mediaHeightPt = this.trimHeightPt + (2 * this.slugMarginPt);

    // Caixas de página (Page Boxes) em coordenadas absolutas do MediaBox:
    // [llx, lly, urx, ury] -> lower-left x, lower-left y, upper-right x, upper-right y
    this.mediaBox = [0, 0, this.mediaWidthPt, this.mediaHeightPt];

    this.bleedBox = [
      this.slugMarginPt - this.bleedPt,
      this.slugMarginPt - this.bleedPt,
      this.slugMarginPt + this.trimWidthPt + this.bleedPt,
      this.slugMarginPt + this.trimHeightPt + this.bleedPt
    ];

    this.trimBox = [
      this.slugMarginPt,
      this.slugMarginPt,
      this.slugMarginPt + this.trimWidthPt,
      this.slugMarginPt + this.trimHeightPt
    ];

    // Fluxo de comandos de desenho
    this.stream = [];

    // Fontes registradas
    this.fonts = [
      { id: 'F1', name: 'Helvetica', baseFont: 'Helvetica' },
      { id: 'F2', name: 'Helvetica-Bold', baseFont: 'Helvetica-Bold' },
      { id: 'F3', name: 'Times-Roman', baseFont: 'Times-Roman' }
    ];
  }

  /**
   * Converte uma coordenada X do Canvas DTP (origem no topo-esquerdo da TrimBox)
   * para a coordenada X absoluta do PDF (origem no canto inferior-esquerdo da MediaBox)
   * @param {number} xPt - X no canvas em pontos tipográficos
   * @returns {number} X absoluto no PDF
   */
  canvasToPdfX(xPt) {
    return this.slugMarginPt + xPt;
  }

  /**
   * Converte uma coordenada Y do Canvas DTP (Y cresce para baixo a partir do topo da TrimBox)
   * para a coordenada Y absoluta do PDF (Y cresce para cima a partir da base da MediaBox)
   * @param {number} yPt - Y no canvas em pontos tipográficos
   * @param {number} [elementHeightPt=0] - Altura do elemento retangular (se aplicável)
   * @returns {number} Y absoluto no PDF
   */
  canvasToPdfY(yPt, elementHeightPt = 0) {
    return this.slugMarginPt + (this.trimHeightPt - yPt - elementHeightPt);
  }

  /**
   * Salva o estado gráfico (operador 'q')
   */
  saveGraphicsState() {
    this.stream.push('q');
    return this;
  }

  /**
   * Restaura o estado gráfico (operador 'Q')
   */
  restoreGraphicsState() {
    this.stream.push('Q');
    return this;
  }

  /**
   * Define a espessura da linha (operador 'w')
   * @param {number} widthPt 
   */
  setLineWidth(widthPt) {
    this.stream.push(`${formatPdfNumber(widthPt)} w`);
    return this;
  }

  /**
   * Define o padrão de linha tracejada (operador 'd')
   * @param {number[]} dashArray 
   * @param {number} [phase=0] 
   */
  setLineDash(dashArray = [], phase = 0) {
    const arrStr = dashArray.map(n => formatPdfNumber(n)).join(' ');
    this.stream.push(`[${arrStr}] ${formatPdfNumber(phase)} d`);
    return this;
  }

  /**
   * Define cor de traçado em RGB (operador 'RG')
   * @param {number} r 0.0 - 1.0
   * @param {number} g 0.0 - 1.0
   * @param {number} b 0.0 - 1.0
   */
  setStrokeColorRgb(r, g, b) {
    this.stream.push(`${formatPdfNumber(r)} ${formatPdfNumber(g)} ${formatPdfNumber(b)} RG`);
    return this;
  }

  /**
   * Define cor de preenchimento em RGB (operador 'rg')
   * @param {number} r 0.0 - 1.0
   * @param {number} g 0.0 - 1.0
   * @param {number} b 0.0 - 1.0
   */
  setFillColorRgb(r, g, b) {
    this.stream.push(`${formatPdfNumber(r)} ${formatPdfNumber(g)} ${formatPdfNumber(b)} rg`);
    return this;
  }

  /**
   * Define cor de traçado em CMYK (operador 'K')
   * @param {number} c 0.0 - 1.0
   * @param {number} m 0.0 - 1.0
   * @param {number} y 0.0 - 1.0
   * @param {number} k 0.0 - 1.0
   */
  setStrokeColorCmyk(c, m, y, k) {
    this.stream.push(`${formatPdfNumber(c)} ${formatPdfNumber(m)} ${formatPdfNumber(y)} ${formatPdfNumber(k)} K`);
    return this;
  }

  /**
   * Define cor de preenchimento em CMYK (operador 'k')
   * @param {number} c 0.0 - 1.0
   * @param {number} m 0.0 - 1.0
   * @param {number} y 0.0 - 1.0
   * @param {number} k 0.0 - 1.0
   */
  setFillColorCmyk(c, m, y, k) {
    this.stream.push(`${formatPdfNumber(c)} ${formatPdfNumber(m)} ${formatPdfNumber(y)} ${formatPdfNumber(k)} k`);
    return this;
  }

  /**
   * Desenha um retângulo em coordenadas DTP (relativas ao TrimBox)
   * @param {Object} rect
   * @param {number} rect.x - Coordenada X em mm
   * @param {number} rect.y - Coordenada Y em mm
   * @param {number} rect.width - Largura em mm
   * @param {number} rect.height - Altura em mm
   * @param {string} [mode='S'] - 'S' (stroke), 'f' (fill), 'B' (fill and stroke)
   */
  drawRectMm({ x, y, width, height, mode = 'S' }) {
    const xPt = mmToPt(x);
    const yPt = mmToPt(y);
    const wPt = mmToPt(width);
    const hPt = mmToPt(height);

    const pdfX = this.canvasToPdfX(xPt);
    const pdfY = this.canvasToPdfY(yPt, hPt);

    this.stream.push(`${formatPdfNumber(pdfX)} ${formatPdfNumber(pdfY)} ${formatPdfNumber(wPt)} ${formatPdfNumber(hPt)} re ${mode}`);
    return this;
  }

  /**
   * Desenha uma linha em coordenadas DTP (relativas ao TrimBox)
   * @param {number} x1Mm 
   * @param {number} y1Mm 
   * @param {number} x2Mm 
   * @param {number} y2Mm 
   */
  drawLineMm(x1Mm, y1Mm, x2Mm, y2Mm) {
    const p1X = this.canvasToPdfX(mmToPt(x1Mm));
    const p1Y = this.canvasToPdfY(mmToPt(y1Mm));
    const p2X = this.canvasToPdfX(mmToPt(x2Mm));
    const p2Y = this.canvasToPdfY(mmToPt(y2Mm));

    this.stream.push(`${formatPdfNumber(p1X)} ${formatPdfNumber(p1Y)} m ${formatPdfNumber(p2X)} ${formatPdfNumber(p2Y)} l S`);
    return this;
  }

  /**
   * Desenha uma linha direta em coordenadas absolutas do PDF (MediaBox)
   */
  drawRawLinePdfPt(x1Pt, y1Pt, x2Pt, y2Pt) {
    this.stream.push(`${formatPdfNumber(x1Pt)} ${formatPdfNumber(y1Pt)} m ${formatPdfNumber(x2Pt)} ${formatPdfNumber(y2Pt)} l S`);
    return this;
  }

  /**
   * Desenha um círculo direto em coordenadas absolutas do PDF
   */
  drawRawCirclePdfPt(cxPt, cyPt, rPt, mode = 'S') {
    // Aproximação cúbica de Bézier para círculos
    const k = rPt * 0.5522847498;
    this.stream.push([
      `${formatPdfNumber(cxPt)} ${formatPdfNumber(cyPt + rPt)} m`,
      `${formatPdfNumber(cxPt + k)} ${formatPdfNumber(cyPt + rPt)} ${formatPdfNumber(cxPt + rPt)} ${formatPdfNumber(cyPt + k)} ${formatPdfNumber(cxPt + rPt)} ${formatPdfNumber(cyPt)} c`,
      `${formatPdfNumber(cxPt + rPt)} ${formatPdfNumber(cyPt - k)} ${formatPdfNumber(cxPt + k)} ${formatPdfNumber(cyPt - rPt)} ${formatPdfNumber(cxPt)} ${formatPdfNumber(cyPt - rPt)} c`,
      `${formatPdfNumber(cxPt - k)} ${formatPdfNumber(cyPt - rPt)} ${formatPdfNumber(cxPt - rPt)} ${formatPdfNumber(cyPt - k)} ${formatPdfNumber(cxPt - rPt)} ${formatPdfNumber(cyPt)} c`,
      `${formatPdfNumber(cxPt - rPt)} ${formatPdfNumber(cyPt + k)} ${formatPdfNumber(cxPt - k)} ${formatPdfNumber(cyPt + rPt)} ${formatPdfNumber(cxPt)} ${formatPdfNumber(cyPt + rPt)} c`,
      mode
    ].join(' '));
    return this;
  }

  /**
   * Desenha texto vetorial puro selecionável em coordenadas DTP
   * @param {Object} textObj
   * @param {string} textObj.text - Conteúdo do texto
   * @param {number} textObj.x - Posição X em mm (a partir da margem esquerda do Trim)
   * @param {number} textObj.baselineY - Posição Y da linha de base (baseline) em mm
   * @param {number} [textObj.fontSizePt=12] - Tamanho da fonte em pontos (pt)
   * @param {string} [textObj.fontId='F1'] - ID da fonte registrada
   */
  drawTextMm({ text, x, baselineY, fontSizePt = 12, fontId = 'F1' }) {
    const pdfX = this.canvasToPdfX(mmToPt(x));
    const pdfY = this.canvasToPdfY(mmToPt(baselineY));

    const escaped = escapePdfString(text);
    this.stream.push(`BT /${fontId} ${formatPdfNumber(fontSizePt)} Tf ${formatPdfNumber(pdfX)} ${formatPdfNumber(pdfY)} Td (${escaped}) Tj ET`);
    return this;
  }

  /**
   * Desenha marcas de pré-impressão profissionais completas:
   * - Marcas de corte (Crop Marks)
   * - Marcas de sangria (Bleed Marks)
   * - Alvos de registro (Registration Marks)
   * - Escala de calibração de cor CMYK
   * - Slug com informações do documento
   */
  addPrePressMarks() {
    this.saveGraphicsState();

    const [tx1, ty1, tx2, ty2] = this.trimBox;
    const [bx1, by1, bx2, by2] = this.bleedBox;

    const markLenPt = mmToPt(5);   // Comprimento da marca: 5 mm
    const markOffsetPt = mmToPt(3); // Recuo da marca em relação ao corte: 3 mm

    // 1. MARCAS DE CORTE (CROP MARKS) - 0.25 pt
    this.setLineWidth(0.25);
    this.setStrokeColorCmyk(1, 1, 1, 1); // Registration K100/CMYK

    // Canto Inferior-Esquerdo (tx1, ty1)
    this.drawRawLinePdfPt(tx1, ty1 - markOffsetPt, tx1, ty1 - markOffsetPt - markLenPt);
    this.drawRawLinePdfPt(tx1 - markOffsetPt, ty1, tx1 - markOffsetPt - markLenPt, ty1);

    // Canto Inferior-Direito (tx2, ty1)
    this.drawRawLinePdfPt(tx2, ty1 - markOffsetPt, tx2, ty1 - markOffsetPt - markLenPt);
    this.drawRawLinePdfPt(tx2 + markOffsetPt, ty1, tx2 + markOffsetPt + markLenPt, ty1);

    // Canto Superior-Esquerdo (tx1, ty2)
    this.drawRawLinePdfPt(tx1, ty2 + markOffsetPt, tx1, ty2 + markOffsetPt + markLenPt);
    this.drawRawLinePdfPt(tx1 - markOffsetPt, ty2, tx1 - markOffsetPt - markLenPt, ty2);

    // Canto Superior-Direito (tx2, ty2)
    this.drawRawLinePdfPt(tx2, ty2 + markOffsetPt, tx2, ty2 + markOffsetPt + markLenPt);
    this.drawRawLinePdfPt(tx2 + markOffsetPt, ty2, tx2 + markOffsetPt + markLenPt, ty2);

    // 2. MARCAS DE SANGRIA (BLEED MARKS) - Tracejadas sutis
    this.setLineWidth(0.25);
    this.setLineDash([2, 2], 0);
    this.setStrokeColorCmyk(0, 1, 1, 0); // Magenta/Amarelo

    this.drawRawLinePdfPt(bx1, ty1 - markOffsetPt, bx1, ty1 - markOffsetPt - markLenPt);
    this.drawRawLinePdfPt(tx1 - markOffsetPt, by1, tx1 - markOffsetPt - markLenPt, by1);

    this.drawRawLinePdfPt(bx2, ty2 + markOffsetPt, bx2, ty2 + markOffsetPt + markLenPt);
    this.drawRawLinePdfPt(tx2 + markOffsetPt, by2, tx2 + markOffsetPt + markLenPt, by2);

    this.setLineDash([], 0);

    // 3. ALVOS DE REGISTRO (REGISTRATION TARGETS)
    const regRadiusPt = mmToPt(2.5);
    const midX = (tx1 + tx2) / 2;
    const midY = (ty1 + ty2) / 2;

    const drawTarget = (cx, cy) => {
      this.setLineWidth(0.25);
      this.setStrokeColorCmyk(1, 1, 1, 1);
      this.drawRawCirclePdfPt(cx, cy, regRadiusPt, 'S');
      this.drawRawCirclePdfPt(cx, cy, regRadiusPt * 0.5, 'S');
      this.drawRawLinePdfPt(cx - regRadiusPt * 1.5, cy, cx + regRadiusPt * 1.5, cy);
      this.drawRawLinePdfPt(cx, cy - regRadiusPt * 1.5, cx, cy + regRadiusPt * 1.5);
    };

    drawTarget(midX, ty2 + markOffsetPt + (markLenPt / 2));
    drawTarget(midX, ty1 - markOffsetPt - (markLenPt / 2));
    drawTarget(tx1 - markOffsetPt - (markLenPt / 2), midY);
    drawTarget(tx2 + markOffsetPt + (markLenPt / 2), midY);

    // 4. BARRA DE CALIBRAÇÃO DE COR CMYK
    const patchW = mmToPt(4);
    const patchH = mmToPt(3);
    const barStartY = ty2 + markOffsetPt + mmToPt(1);
    const colors = [
      { name: 'C100', c: 1, m: 0, y: 0, k: 0 },
      { name: 'C50',  c: 0.5, m: 0, y: 0, k: 0 },
      { name: 'M100', c: 0, m: 1, y: 0, k: 0 },
      { name: 'M50',  c: 0, m: 0.5, y: 0, k: 0 },
      { name: 'Y100', c: 0, m: 0, y: 1, k: 0 },
      { name: 'Y50',  c: 0, m: 0, y: 0.5, k: 0 },
      { name: 'K100', c: 0, m: 0, y: 0, k: 1 },
      { name: 'K50',  c: 0, m: 0, y: 0, k: 0.5 }
    ];

    let startX = tx1;
    for (const clr of colors) {
      this.setFillColorCmyk(clr.c, clr.m, clr.y, clr.k);
      this.stream.push(`${formatPdfNumber(startX)} ${formatPdfNumber(barStartY)} ${formatPdfNumber(patchW)} ${formatPdfNumber(patchH)} re f`);
      startX += patchW;
    }

    // 5. SLUG / METADADOS DE PRÉ-IMPRESSÃO
    const slugY = ty1 - markOffsetPt - mmToPt(5);
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const slugText = `${this.title} | Trim: ${this.trimWidthMm.toFixed(1)}x${this.trimHeightMm.toFixed(1)}mm | Sangria: ${this.bleedMm.toFixed(1)}mm | Gerado: ${dateStr} | OpenDTP Engine`;

    this.setFillColorCmyk(0, 0, 0, 1);
    this.stream.push(`BT /F1 7 Tf ${formatPdfNumber(tx1)} ${formatPdfNumber(slugY)} Td (${escapePdfString(slugText)}) Tj ET`);

    this.restoreGraphicsState();
    return this;
  }

  /**
   * Retorna o tamanho em bytes de uma string em codificação binária/latin1
   * @param {string} str 
   * @returns {number}
   */
  static getByteLength(str) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.byteLength(str, 'latin1');
    }
    // Implementação compatível com navegadores
    return new TextEncoder().encode(str).length;
  }

  /**
   * Compila o documento e retorna a string binária / buffer do arquivo PDF final
   * @returns {string} PDF compilado
   */
  compile() {
    const contentStream = this.stream.join('\n');
    const streamLength = PdfDocument.getByteLength(contentStream);

    const objects = [];
    const xrefOffsets = [];

    let currentOffset = 0;
    const header = '%PDF-1.7\n%\xE2\xE3\xCF\xD3\n';
    currentOffset += PdfDocument.getByteLength(header);

    const addObject = (objNum, content) => {
      xrefOffsets[objNum] = currentOffset;
      const str = `${objNum} 0 obj\n${content}\nendobj\n`;
      currentOffset += PdfDocument.getByteLength(str);
      objects.push(str);
    };

    // 1: Catalog
    addObject(1, `<< /Type /Catalog /Pages 2 0 R >>`);

    // 2: Pages
    addObject(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);

    // 3: Page com Caixas Oficiais ISO 32000
    const mediaBoxStr = `[${this.mediaBox.map(n => formatPdfNumber(n)).join(' ')}]`;
    const bleedBoxStr = `[${this.bleedBox.map(n => formatPdfNumber(n)).join(' ')}]`;
    const trimBoxStr = `[${this.trimBox.map(n => formatPdfNumber(n)).join(' ')}]`;
    const cropBoxStr = mediaBoxStr;

    addObject(3, `<< /Type /Page
/Parent 2 0 R
/MediaBox ${mediaBoxStr}
/BleedBox ${bleedBoxStr}
/TrimBox ${trimBoxStr}
/CropBox ${cropBoxStr}
/Contents 4 0 R
/Resources <<
  /ProcSet [/PDF /Text /ImageB /ImageC /ImageI]
  /Font <<
    /F1 5 0 R
    /F2 6 0 R
    /F3 7 0 R
  >>
>> >>`);

    // 4: Content Stream
    addObject(4, `<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream`);

    // 5: Font F1 (Helvetica)
    addObject(5, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

    // 6: Font F2 (Helvetica-Bold)
    addObject(6, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

    // 7: Font F3 (Times-Roman)
    addObject(7, `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>`);

    // 8: Document Info
    const now = new Date();
    const pdfDate = `D:${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}Z`;
    addObject(8, `<<
/Title (${escapePdfString(this.title)})
/Creator (OpenDTP Modern Publishing Engine)
/Producer (OpenDTP Pure Vector PDF Emitter 1.0)
/CreationDate (${pdfDate})
/ModDate (${pdfDate})
>>`);

    // Tabela XRef
    const xrefStart = currentOffset;
    let xref = `xref\n0 9\n0000000000 65535 f \n`;
    for (let i = 1; i <= 8; i++) {
      const offset = xrefOffsets[i].toString().padStart(10, '0');
      xref += `${offset} 00000 n \n`;
    }

    const trailer = `trailer\n<<\n  /Size 9\n  /Root 1 0 R\n  /Info 8 0 R\n>>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return header + objects.join('') + xref + trailer;
  }
}

/**
 * Cria uma instância de documento PDF
 * @param {Object} options
 * @returns {PdfDocument}
 */
function createPdfDocument(options = {}) {
  return new PdfDocument(options);
}

const PdfEngine = {
  PdfDocument,
  createPdfDocument,
  escapePdfString
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PdfEngine;
}

if (typeof window !== 'undefined') {
  window.OpenDTPPdf = PdfEngine;
}

  });

  // Module: ./document
  define('./document', function(module, exports, require) {
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

  });

  // Module: ./commands
  define('./commands', function(module, exports, require) {
/**
 * OpenDTP - Command Pattern & Transactional Undo/Redo Engine
 * 
 * Garante mutações imutáveis e auditáveis no documento com histórico de ações.
 */

class Command {
  constructor(name = 'Comando Genérico') {
    this.name = name;
  }

  /**
   * Executa a alteração no documento
   * @param {Object} document 
   */
  execute(document) {
    throw new Error('Método execute() deve ser implementado pela subclasse.');
  }

  /**
   * Desfaz a alteração no documento
   * @param {Object} document 
   */
  undo(document) {
    throw new Error('Método undo() deve ser implementado pela subclasse.');
  }
}

class AddFrameCommand extends Command {
  constructor(spreadId, frame) {
    super(`Adicionar ${frame.name || 'Quadro'}`);
    this.spreadId = spreadId;
    this.frame = frame;
  }

  execute(document) {
    const spread = document.spreads.find(s => s.id === this.spreadId);
    if (!spread) throw new Error(`Spread não encontrada: ${this.spreadId}`);
    spread.addFrame(this.frame);
    document.touch();
  }

  undo(document) {
    const spread = document.spreads.find(s => s.id === this.spreadId);
    if (spread) {
      spread.removeFrame(this.frame.id);
      document.touch();
    }
  }
}

class RemoveFrameCommand extends Command {
  constructor(frameId) {
    super('Remover Quadro');
    this.frameId = frameId;
    this.removedFrame = null;
    this.targetSpreadId = null;
  }

  execute(document) {
    const res = document.findFrame(this.frameId);
    if (!res) throw new Error(`Quadro não encontrado: ${this.frameId}`);
    this.targetSpreadId = res.spread.id;
    this.removedFrame = res.spread.removeFrame(this.frameId);
    document.touch();
  }

  undo(document) {
    if (this.removedFrame && this.targetSpreadId) {
      const spread = document.spreads.find(s => s.id === this.targetSpreadId);
      if (spread) {
        spread.addFrame(this.removedFrame);
        document.touch();
      }
    }
  }
}

class TransformFrameCommand extends Command {
  constructor(frameId, newTransform) {
    super('Transformar Quadro');
    this.frameId = frameId;
    this.newTransform = { ...newTransform };
    this.oldTransform = null;
  }

  execute(document) {
    const res = document.findFrame(this.frameId);
    if (!res) throw new Error(`Quadro não encontrado: ${this.frameId}`);
    const frame = res.frame;

    if (!this.oldTransform) {
      this.oldTransform = {
        xMm: frame.xMm,
        yMm: frame.yMm,
        widthMm: frame.widthMm,
        heightMm: frame.heightMm,
        rotationDeg: frame.rotationDeg
      };
    }

    if (this.newTransform.xMm !== undefined) frame.xMm = this.newTransform.xMm;
    if (this.newTransform.yMm !== undefined) frame.yMm = this.newTransform.yMm;
    if (this.newTransform.widthMm !== undefined) frame.widthMm = this.newTransform.widthMm;
    if (this.newTransform.heightMm !== undefined) frame.heightMm = this.newTransform.heightMm;
    if (this.newTransform.rotationDeg !== undefined) frame.rotationDeg = this.newTransform.rotationDeg;

    document.touch();
  }

  undo(document) {
    const res = document.findFrame(this.frameId);
    if (res && this.oldTransform) {
      const frame = res.frame;
      frame.xMm = this.oldTransform.xMm;
      frame.yMm = this.oldTransform.yMm;
      frame.widthMm = this.oldTransform.widthMm;
      frame.heightMm = this.oldTransform.heightMm;
      frame.rotationDeg = this.oldTransform.rotationDeg;
      document.touch();
    }
  }
}

class LinkTextFramesCommand extends Command {
  constructor(fromFrameId, toFrameId) {
    super('Encadear Caixas de Texto');
    this.fromFrameId = fromFrameId;
    this.toFrameId = toFrameId;
    this.oldNext = null;
    this.oldPrev = null;
  }

  execute(document) {
    const res1 = document.findFrame(this.fromFrameId);
    const res2 = document.findFrame(this.toFrameId);
    if (!res1 || !res2) throw new Error('Ambos os quadros devem existir para encadeamento.');

    this.oldNext = res1.frame.nextFrameId;
    this.oldPrev = res2.frame.prevFrameId;

    res1.frame.nextFrameId = this.toFrameId;
    res2.frame.prevFrameId = this.fromFrameId;

    // Herdar storyId da primeira caixa
    if (res1.frame.storyId) {
      res2.frame.storyId = res1.frame.storyId;
    }

    document.touch();
  }

  undo(document) {
    const res1 = document.findFrame(this.fromFrameId);
    const res2 = document.findFrame(this.toFrameId);
    if (res1) res1.frame.nextFrameId = this.oldNext;
    if (res2) res2.frame.prevFrameId = this.oldPrev;
    document.touch();
  }
}

class BatchCommand extends Command {
  constructor(name, commands = []) {
    super(name || 'Comando em Lote');
    this.commands = [...commands];
  }

  execute(document) {
    for (const cmd of this.commands) {
      cmd.execute(document);
    }
  }

  undo(document) {
    // Desfazer na ordem inversa
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo(document);
    }
  }
}

class CommandHistory {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.undoStack = [];
    this.redoStack = [];
  }

  execute(document, command) {
    command.execute(document);
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = []; // limpa pilha de refazer
    return command;
  }

  undo(document) {
    if (!this.canUndo()) return null;
    const cmd = this.undoStack.pop();
    cmd.undo(document);
    this.redoStack.push(cmd);
    return cmd;
  }

  redo(document) {
    if (!this.canRedo()) return null;
    const cmd = this.redoStack.pop();
    cmd.execute(document);
    this.undoStack.push(cmd);
    return cmd;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

const Commands = {
  Command,
  AddFrameCommand,
  RemoveFrameCommand,
  TransformFrameCommand,
  LinkTextFramesCommand,
  BatchCommand,
  CommandHistory
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Commands;
}

if (typeof window !== 'undefined') {
  window.OpenDTPCommands = Commands;
}

  });

  // Module: ./engine
  define('./engine', function(module, exports, require) {
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

  });

  // Module: ./index
  define('./index', function(module, exports, require) {
const { GeometryEngine, FlowEngine, AlignmentStrategies } = require('./slicer');
const { Hyphenator } = require('./hyphenator');
const { SpatialEngine } = require('./spatial');
const Units = require('./units');
const PdfEngine = require('./pdf');
const Schema = require('./schema');
const Styles = require('./styles');
const DocModel = require('./document');
const Commands = require('./commands');
const { OpenDTPEngine } = require('./engine');

module.exports = {
  // Motores de Processamento
  GeometryEngine,
  Hyphenator,
  FlowEngine,
  AlignmentStrategies,
  SpatialEngine,
  Units,
  PdfEngine,

  // Arquitetura de Documento e Estado
  Schema,
  Styles,
  DocModel,
  Commands,
  OpenDTPEngine
};

  });


  // Inicializar e expor namespaces globais para o navegador
  const OpenDTPCore = requireModule('./index');
  global.OpenDTP = OpenDTPCore;
  global.OpenDTPUnits = requireModule('./units');
  global.OpenDTPSchema = requireModule('./schema');
  global.OpenDTPStyles = requireModule('./styles');
  global.OpenDTPHyphenator = requireModule('./hyphenator');
  global.OpenDTPSpatial = requireModule('./spatial');
  global.OpenDTPSlicer = requireModule('./slicer');
  global.OpenDTPPdf = requireModule('./pdf');
  global.OpenDTPDocument = requireModule('./document');
  global.OpenDTPCommands = requireModule('./commands');
  global.OpenDTPEngine = requireModule('./engine');

})(typeof window !== 'undefined' ? window : globalThis);
