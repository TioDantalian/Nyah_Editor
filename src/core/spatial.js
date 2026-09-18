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
