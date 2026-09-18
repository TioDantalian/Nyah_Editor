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
