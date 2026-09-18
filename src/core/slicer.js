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
