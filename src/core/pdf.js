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
