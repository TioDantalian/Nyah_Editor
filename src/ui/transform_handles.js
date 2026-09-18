/**
 * OpenDTP - Transform Handles Engine (8 Alças Cardeais)
 * 
 * Módulo de geometria analítica pura e projeção de transformações interativas:
 * - Cálculo da posição das 8 alças cardeais (NW, N, NE, E, SE, S, SW, W)
 * - Detecção de clique (Hit-testing) com raio de tolerância configurável
 * - Redimensionamento direcional com respeito a dimensões mínimas
 * - Suporte a travamento de proporção (Shift) e expansão simétrica pelo centro (Alt)
 */

const HANDLE_DEFS = [
  { id: 'nw', name: 'Noroeste', cursor: 'nwse-resize', relX: 0.0, relY: 0.0 },
  { id: 'n',  name: 'Norte',    cursor: 'ns-resize',   relX: 0.5, relY: 0.0 },
  { id: 'ne', name: 'Nordeste', cursor: 'nesw-resize', relX: 1.0, relY: 0.0 },
  { id: 'e',  name: 'Leste',    cursor: 'ew-resize',   relX: 1.0, relY: 0.5 },
  { id: 'se', name: 'Sudeste',  cursor: 'nwse-resize', relX: 1.0, relY: 1.0 },
  { id: 's',  name: 'Sul',      cursor: 'ns-resize',   relX: 0.5, relY: 1.0 },
  { id: 'sw', name: 'Sudoeste', cursor: 'nesw-resize', relX: 0.0, relY: 1.0 },
  { id: 'w',  name: 'Oeste',    cursor: 'ew-resize',   relX: 0.0, relY: 0.5 }
];

class TransformHandles {
  /**
   * Retorna as definições e posições das 8 alças no espaço do mundo (milímetros)
   * @param {Object} box { xMm, yMm, widthMm, heightMm }
   * @returns {Array<Object>}
   */
  static getHandles(box) {
    const { xMm, yMm, widthMm, heightMm } = box;
    return HANDLE_DEFS.map(def => ({
      id: def.id,
      name: def.name,
      cursor: def.cursor,
      xMm: xMm + def.relX * widthMm,
      yMm: yMm + def.relY * heightMm
    }));
  }

  /**
   * Converte coordenadas de tela para mundo e vice-versa
   */
  static worldToScreen(worldX, worldY, zoom, panX, panY, dpi = 96) {
    const pxPerMm = dpi / 25.4;
    return {
      x: worldX * pxPerMm * zoom + panX,
      y: worldY * pxPerMm * zoom + panY
    };
  }

  static screenToWorld(screenX, screenY, zoom, panX, panY, dpi = 96) {
    const pxPerMm = dpi / 25.4;
    return {
      x: (screenX - panX) / (zoom * pxPerMm),
      y: (screenY - panY) / (zoom * pxPerMm)
    };
  }

  /**
   * Executa teste de colisão (hit test) entre um ponto da tela e as 8 alças
   * @param {number} screenX 
   * @param {number} screenY 
   * @param {Object} box { xMm, yMm, widthMm, heightMm }
   * @param {number} zoom 
   * @param {number} panX 
   * @param {number} panY 
   * @param {number} [tolerancePx=8] Raio de captura em pixels
   * @param {number} [dpi=96]
   * @returns {Object|null} Alça atingida ou null
   */
  static hitTest(screenX, screenY, box, zoom, panX, panY, tolerancePx = 8, dpi = 96) {
    const handles = this.getHandles(box);
    for (const h of handles) {
      const scr = this.worldToScreen(h.xMm, h.yMm, zoom, panX, panY, dpi);
      const dx = screenX - scr.x;
      const dy = screenY - scr.y;
      if (Math.hypot(dx, dy) <= tolerancePx) {
        return {
          id: h.id,
          cursor: h.cursor,
          name: h.name,
          handle: h
        };
      }
    }
    return null;
  }

  /**
   * Calcula o novo bounding box a partir de um deslocamento do mouse (dxMm, dyMm)
   * @param {string} handleId 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w'
   * @param {Object} initialBox { xMm, yMm, widthMm, heightMm }
   * @param {number} dxMm Deslocamento acumulado em X (mm)
   * @param {number} dyMm Deslocamento acumulado em Y (mm)
   * @param {Object} [options]
   * @param {boolean} [options.lockAspect=false] Trava proporção W/H
   * @param {boolean} [options.fromCenter=false] Escala a partir do centro
   * @param {number} [options.minWidthMm=5.0]
   * @param {number} [options.minHeightMm=5.0]
   * @returns {Object} { xMm, yMm, widthMm, heightMm }
   */
  static computeResize(handleId, initialBox, dxMm, dyMm, options = {}) {
    const minW = options.minWidthMm !== undefined ? options.minWidthMm : 5.0;
    const minH = options.minHeightMm !== undefined ? options.minHeightMm : 5.0;
    const lockAspect = Boolean(options.lockAspect);
    const fromCenter = Boolean(options.fromCenter);

    const initX = initialBox.xMm;
    const initY = initialBox.yMm;
    const initW = initialBox.widthMm;
    const initH = initialBox.heightMm;
    const aspectRatio = initW / (initH || 1.0);

    let newX = initX;
    let newY = initY;
    let newW = initW;
    let newH = initH;

    // Se a transformação for a partir do centro, o delta aplicado é dobrado
    const effDx = fromCenter ? dxMm * 2 : dxMm;
    const effDy = fromCenter ? dyMm * 2 : dyMm;

    // 1. Redimensionamento Ortogonal / Diagonal sem travas
    switch (handleId) {
      case 'se': {
        newW = initW + effDx;
        newH = initH + effDy;
        break;
      }
      case 'e': {
        newW = initW + effDx;
        break;
      }
      case 's': {
        newH = initH + effDy;
        break;
      }
      case 'nw': {
        newW = initW - effDx;
        newH = initH - effDy;
        newX = initX + effDx;
        newY = initY + effDy;
        break;
      }
      case 'w': {
        newW = initW - effDx;
        newX = initX + effDx;
        break;
      }
      case 'n': {
        newH = initH - effDy;
        newY = initY + effDy;
        break;
      }
      case 'ne': {
        newW = initW + effDx;
        newH = initH - effDy;
        newY = initY + effDy;
        break;
      }
      case 'sw': {
        newW = initW - effDx;
        newH = initH + effDy;
        newX = initX + effDx;
        break;
      }
      default:
        return { ...initialBox };
    }

    // 2. Aplicação de Trava de Proporção (Shift) para cantos
    const isCorner = ['nw', 'ne', 'se', 'sw'].includes(handleId);
    if (lockAspect && isCorner) {
      // Usa a maior variação relativa como guia
      const scaleW = newW / initW;
      const scaleH = newH / initH;
      const dominantScale = Math.abs(scaleW - 1.0) > Math.abs(scaleH - 1.0) ? scaleW : scaleH;

      newW = Math.max(minW, initW * dominantScale);
      newH = newW / aspectRatio;

      // Reposicionar âncoras para manter o canto oposto fixo
      if (handleId === 'nw') {
        newX = (initX + initW) - newW;
        newY = (initY + initH) - newH;
      } else if (handleId === 'ne') {
        newX = initX;
        newY = (initY + initH) - newH;
      } else if (handleId === 'sw') {
        newX = (initX + initW) - newW;
        newY = initY;
      } else if (handleId === 'se') {
        newX = initX;
        newY = initY;
      }
    }

    // 3. Aplicação dos Limites Mínimos (Clamping)
    if (newW < minW) {
      if (['nw', 'w', 'sw'].includes(handleId)) {
        newX = initX + (initW - minW);
      }
      newW = minW;
    }

    if (newH < minH) {
      if (['nw', 'n', 'ne'].includes(handleId)) {
        newY = initY + (initH - minH);
      }
      newH = minH;
    }

    // 4. Se a escala for a partir do centro, centraliza em relação ao centro original
    if (fromCenter) {
      const centerX = initX + initW / 2;
      const centerY = initY + initH / 2;
      newX = centerX - newW / 2;
      newY = centerY - newH / 2;
    }

    return {
      xMm: Number(newX.toFixed(3)),
      yMm: Number(newY.toFixed(3)),
      widthMm: Number(newW.toFixed(3)),
      heightMm: Number(newH.toFixed(3))
    };
  }
}

const HandlesModule = {
  TransformHandles,
  HANDLE_DEFS
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandlesModule;
}

if (typeof window !== 'undefined') {
  window.OpenDTPHandles = HandlesModule;
}
