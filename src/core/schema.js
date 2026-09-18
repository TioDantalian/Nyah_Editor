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
