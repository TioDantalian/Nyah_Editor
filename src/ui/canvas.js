/**
 * OpenDTP - Canvas Controller & Rendering Pipeline
 * 
 * Gerencia o ciclo de vida gráfico do canvas interativo:
 * - Conversão de coordenadas (World mm <-> Screen px)
 * - Renderização de Spreads (Páginas Duplas, Sangria, Margens e Guias)
 * - Renderização de Quadros (Texto com fatiamento, Imagens com 'X', Formas)
 * - Renderização de Bounding Box de Seleção e das 8 Alças Cardeais
 * - Despacho de eventos de mouse/ponteiro para a ferramenta ativa
 */

const { mmToPx, pxToMm, mmToPt, ptToMm } = (typeof require !== 'undefined') ? require('../core/units') : window.OpenDTPUnits;
const { TransformHandles } = (typeof require !== 'undefined') ? require('./transform_handles') : window.OpenDTPHandles;
const { SelectionTool, TextFrameTool, ImageFrameTool, ShapeFrameTool, PanTool } = (typeof require !== 'undefined') ? require('./tools') : window.OpenDTPTools;

class CanvasController {
  /**
   * @param {HTMLCanvasElement|Object} canvasEl 
   * @param {OpenDTPEngine} engine 
   * @param {Object} [options]
   */
  constructor(canvasEl, engine, options = {}) {
    this.canvas = canvasEl;
    this.ctx = canvasEl ? canvasEl.getContext('2d') : null;
    this.engine = engine;
    this.dpi = options.dpi || 96;

    // Viewport
    this.zoom = options.zoom || 1.0;
    this.panX = options.panX || 80;
    this.panY = options.panY || 60;

    // Estado de seleção e interação
    this.selectedFrameIds = new Set();
    this.activeSpreadIndex = 0;
    this.activeSpread = this.engine.document.spreads[0] || null;

    // Ferramentas disponíveis
    this.tools = {
      select: new SelectionTool(),
      text: new TextFrameTool(),
      image: new ImageFrameTool(),
      shape: new ShapeFrameTool(),
      pan: new PanTool()
    };
    this.activeTool = this.tools.select;

    // Previews transitórios
    this.creationPreview = null;
    this.marqueeBox = null;
    this.renderRequested = false;

    // Configurações visuais
    this.showBleed = options.showBleed ?? true;
    this.showMargins = options.showMargins ?? true;
    this.showGuides = options.showGuides ?? true;
    this.showRulers = options.showRulers ?? true;

    // Rastreamento do cursor para réguas e status
    this.mouseScreen = { x: -100, y: -100 };
    this.mouseWorld = { x: 0, y: 0 };

    // Listeners do motor
    if (this.engine) {
      this.engine.on('change', () => this.requestRender());
      this.engine.on('flowComputed', () => this.requestRender());
    }

    if (this.canvas && typeof window !== 'undefined') {
      this.setupEventListeners();
      this.resizeCanvas();
    }
  }

  // ==========================================================================
  // CONVERSÃO DE COORDENADAS (World mm <-> Screen px)
  // ==========================================================================

  worldToScreen(worldXMm, worldYMm) {
    const pxX = mmToPx(worldXMm, this.dpi);
    const pxY = mmToPx(worldYMm, this.dpi);
    return {
      x: pxX * this.zoom + this.panX,
      y: pxY * this.zoom + this.panY
    };
  }

  screenToWorld(screenX, screenY) {
    const pxX = (screenX - this.panX) / this.zoom;
    const pxY = (screenY - this.panY) / this.zoom;
    return {
      x: Number(pxToMm(pxX, this.dpi).toFixed(3)),
      y: Number(pxToMm(pxY, this.dpi).toFixed(3))
    };
  }

  // ==========================================================================
  // GESTÃO DE FERRAMENTAS E CURSOR
  // ==========================================================================

  setTool(toolId) {
    if (this.tools[toolId]) {
      if (this.tools[toolId] !== this.activeTool) {
        this.activeTool.deactivate(this.getContext());
        this.activeTool = this.tools[toolId];
        this.activeTool.activate(this.getContext());
      }
      this.setCursor(this.activeTool.cursor);
      if (this.onToolChange) {
        this.onToolChange(this.activeTool.id);
      }
      this.requestRender();
    }
  }

  setCursor(cursorStyle) {
    if (this.canvas && this.canvas.style) {
      this.canvas.style.cursor = cursorStyle;
    }
  }

  getContext() {
    return {
      controller: this,
      engine: this.engine
    };
  }

  // ==========================================================================
  // GESTÃO DE SELEÇÃO
  // ==========================================================================

  selectFrame(frameId) {
    this.selectedFrameIds.clear();
    this.selectedFrameIds.add(frameId);
    this.requestRender();
  }

  toggleSelection(frameId) {
    if (this.selectedFrameIds.has(frameId)) {
      this.selectedFrameIds.delete(frameId);
    } else {
      this.selectedFrameIds.add(frameId);
    }
    this.requestRender();
  }

  clearSelection() {
    this.selectedFrameIds.clear();
    this.requestRender();
  }

  getSelectedFrame() {
    if (this.selectedFrameIds.size === 0) return null;
    const id = Array.from(this.selectedFrameIds)[0];
    const spread = this.getActiveSpread();
    if (!spread) return null;
    return spread.getFrame(id);
  }

  getSelectedFrames() {
    const spread = this.getActiveSpread();
    if (!spread) return [];
    return spread.frames.filter(f => this.selectedFrameIds.has(f.id));
  }

  getActiveSpread() {
    if (!this.engine || !this.engine.document) return null;
    return this.engine.document.spreads[this.activeSpreadIndex] || this.engine.document.spreads[0];
  }

  hitTestFrame(worldXMm, worldYMm) {
    const spread = this.getActiveSpread();
    if (!spread) return null;

    // Hit-test na ordem inversa (topo para base)
    for (let i = spread.frames.length - 1; i >= 0; i--) {
      const f = spread.frames[i];
      if (
        worldXMm >= f.xMm &&
        worldXMm <= f.xMm + f.widthMm &&
        worldYMm >= f.yMm &&
        worldYMm <= f.yMm + f.heightMm
      ) {
        return f;
      }
    }
    return null;
  }

  hitTestHandle(screenX, screenY, frame, tolerancePx = 10) {
    if (!frame) return null;
    const handles = TransformHandles.getHandles(frame);
    for (const h of handles) {
      const scr = this.worldToScreen(h.xMm, h.yMm);
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

  selectFramesInBox(boxMm) {
    const spread = this.getActiveSpread();
    if (!spread) return;

    this.selectedFrameIds.clear();
    const bx2 = boxMm.xMm + boxMm.widthMm;
    const by2 = boxMm.yMm + boxMm.heightMm;

    for (const f of spread.frames) {
      const fx2 = f.xMm + f.widthMm;
      const fy2 = f.yMm + f.heightMm;

      // Interseção de bounding box
      const overlaps = !(
        f.xMm > bx2 ||
        fx2 < boxMm.xMm ||
        f.yMm > by2 ||
        fy2 < boxMm.yMm
      );

      if (overlaps) {
        this.selectedFrameIds.add(f.id);
      }
    }
  }

  setCreationPreview(boxMm, frameType = 'generic') {
    this.creationPreview = boxMm ? { ...boxMm, frameType } : null;
    this.requestRender();
  }

  setMarquee(boxMm) {
    this.marqueeBox = boxMm ? { ...boxMm } : null;
    this.requestRender();
  }

  // ==========================================================================
  // CONTROLES DE NAVEGAÇÃO / VIEWPORT
  // ==========================================================================

  setZoom(newZoom, centerX = null, centerY = null) {
    const clampedZoom = Math.min(8.0, Math.max(0.15, newZoom));
    if (centerX !== null && centerY !== null) {
      // Zoom centrado no ponto da tela
      this.panX = centerX - (centerX - this.panX) * (clampedZoom / this.zoom);
      this.panY = centerY - (centerY - this.panY) * (clampedZoom / this.zoom);
    }
    this.zoom = clampedZoom;
    this.requestRender();
  }

  zoomIn() {
    if (this.canvas) {
      this.setZoom(this.zoom * 1.25, this.canvas.width / 2, this.canvas.height / 2);
    } else {
      this.setZoom(this.zoom * 1.25);
    }
  }

  zoomOut() {
    if (this.canvas) {
      this.setZoom(this.zoom / 1.25, this.canvas.width / 2, this.canvas.height / 2);
    } else {
      this.setZoom(this.zoom / 1.25);
    }
  }

  zoomToFit() {
    if (!this.canvas) return;
    const spread = this.getActiveSpread();
    if (!spread) return;

    const pageSetup = this.engine.document.pageSetup;
    
    // Obter limites reais de todas as páginas da spread
    let minXMm = 0;
    let maxXMm = pageSetup.widthMm;
    let minYMm = 0;
    let maxYMm = pageSetup.heightMm;

    if (spread.pages && spread.pages.length > 0) {
      minXMm = Math.min(...spread.pages.map(p => p.offsetX));
      maxXMm = Math.max(...spread.pages.map(p => p.offsetX + pageSetup.widthMm));
    }

    const totalWidthMm = maxXMm - minXMm;
    const totalHeightMm = maxYMm - minYMm;

    const totalWidthPx = mmToPx(totalWidthMm, this.dpi);
    const totalHeightPx = mmToPx(totalHeightMm, this.dpi);

    const paddingPx = 80;
    const availW = Math.max(100, this.canvas.width - paddingPx * 2);
    const availH = Math.max(100, this.canvas.height - paddingPx * 2);

    this.zoom = Math.min(2.5, Math.max(0.2, Math.min(availW / totalWidthPx, availH / totalHeightPx)));

    // Centralizar perfeitamente o centro do conteúdo no centro da janela
    const centerWorldXMm = minXMm + totalWidthMm / 2;
    const centerWorldYMm = minYMm + totalHeightMm / 2;

    this.panX = this.canvas.width / 2 - mmToPx(centerWorldXMm, this.dpi) * this.zoom;
    this.panY = this.canvas.height / 2 - mmToPx(centerWorldYMm, this.dpi) * this.zoom;

    this.requestRender();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : null;
    this.canvas.width = rect ? rect.width : window.innerWidth;
    this.canvas.height = rect ? rect.height : window.innerHeight;
    this.requestRender();
  }

  // ==========================================================================
  // EVENT PIPELINE (DOM -> TOOLS)
  // ==========================================================================

  setupEventListeners() {
    let isSpaceDown = false;
    let isMiddleDown = false;
    let panStart = { x: 0, y: 0 };
    let initialPan = { x: 0, y: 0 };

    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('keydown', (e) => {
      // Atalhos de Ferramentas padrão DTP
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

      if (e.key === 'v' || e.key === 'V') this.setTool('select');
      else if (e.key === 't' || e.key === 'T') this.setTool('text');
      else if (e.key === 'f' || e.key === 'F') this.setTool('image');
      else if (e.key === 'm' || e.key === 'M') this.setTool('shape');
      else if (e.key === 'h' || e.key === 'H') this.setTool('pan');

      // Undo / Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            this.engine.redo();
          } else {
            this.engine.undo();
          }
          this.requestRender();
          return;
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          this.engine.redo();
          this.requestRender();
          return;
        }
      }

      if (e.code === 'Space' && !isSpaceDown) {
        isSpaceDown = true;
        this.canvas.style.cursor = 'grab';
      }

      // Propagar para a ferramenta ativa
      const context = this.getContext();
      if (this.activeTool.onKeyDown) {
        this.activeTool.onKeyDown(e, context);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        isSpaceDown = false;
        this.setCursor(this.activeTool.cursor);
      }

      const context = this.getContext();
      if (this.activeTool.onKeyUp) {
        this.activeTool.onKeyUp(e, context);
      }
    });

    // Zoom via MouseWheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.setZoom(this.zoom * zoomFactor, e.clientX, e.clientY);
    }, { passive: false });

    // Pointer Events
    this.canvas.addEventListener('mousedown', (e) => {
      if (isSpaceDown || e.button === 1) {
        isMiddleDown = true;
        panStart = { x: e.clientX, y: e.clientY };
        initialPan = { x: this.panX, y: this.panY };
        this.setCursor('grabbing');
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = this.screenToWorld(screenX, screenY);

      const context = {
        controller: this,
        engine: this.engine,
        screen: { x: screenX, y: screenY },
        world
      };

      this.activeTool.onPointerDown(e, context);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMiddleDown) {
        this.panX = initialPan.x + (e.clientX - panStart.x);
        this.panY = initialPan.y + (e.clientY - panStart.y);
        this.requestRender();
        return;
      }

      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = this.screenToWorld(screenX, screenY);

      const context = {
        controller: this,
        engine: this.engine,
        screen: { x: screenX, y: screenY },
        world
      };

      this.mouseScreen = { x: screenX, y: screenY };
      this.mouseWorld = world;

      this.activeTool.onPointerMove(e, context);
      if (this.showRulers) {
        this.requestRender();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isMiddleDown) {
        isMiddleDown = false;
        this.setCursor(isSpaceDown ? 'grab' : this.activeTool.cursor);
        return;
      }

      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = this.screenToWorld(screenX, screenY);

      const context = {
        controller: this,
        engine: this.engine,
        screen: { x: screenX, y: screenY },
        world
      };

      this.activeTool.onPointerUp(e, context);
    });
  }

  // ==========================================================================
  // LAÇO DE RENDERIZAÇÃO A 60 FPS
  // ==========================================================================

  requestRender() {
    if (!this.renderRequested && typeof window !== 'undefined') {
      this.renderRequested = true;
      requestAnimationFrame(() => this.render());
    }
  }

  render() {
    this.renderRequested = false;
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Limpar fundo da mesa de trabalho (Pasteboard Dark)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Grade sutil da mesa de trabalho
    this.drawPasteboardGrid(ctx, w, h);

    const spread = this.getActiveSpread();
    if (!spread) return;
    const pageSetup = this.engine.document.pageSetup;

    // 2. Renderizar Spreads & Páginas (Papel, Margens e Sangria)
    this.renderSpreadPages(ctx, spread, pageSetup);

    // 3. Renderizar Conteúdo dos Quadros
    for (const frame of spread.frames) {
      this.renderFrame(ctx, frame);
    }

    // 4. Renderizar Bounding Box e as 8 Alças de Seleção
    this.renderSelectionHandles(ctx);

    // 5. Renderizar Previews de Criação e Marquee
    this.renderPreviews(ctx);

    // 6. Renderizar Réguas Milimétricas
    if (this.showRulers) {
      this.renderRulers(ctx, w, h);
    }
  }

  drawPasteboardGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40 * this.zoom;
    const offsetX = this.panX % gridSize;
    const offsetY = this.panY % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  renderSpreadPages(ctx, spread, pageSetup) {
    const isFacing = pageSetup.facingPages && spread.pages.length > 1;

    for (const page of spread.pages) {
      const pageScr = this.worldToScreen(page.offsetX, page.offsetY);
      const pageW = mmToPx(pageSetup.widthMm, this.dpi) * this.zoom;
      const pageH = mmToPx(pageSetup.heightMm, this.dpi) * this.zoom;

      // Sombra e Papel Branco
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pageScr.x, pageScr.y, pageW, pageH);
      ctx.restore();

      // Borda sutil da página
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pageScr.x, pageScr.y, pageW, pageH);

      // Sangria (Bleed - linha vermelha guia)
      if (this.showBleed && pageSetup.bleedMm > 0) {
        const bleedMm = pageSetup.bleedMm;
        const bleedScr = this.worldToScreen(page.offsetX - bleedMm, page.offsetY - bleedMm);
        const bleedW = mmToPx(pageSetup.widthMm + bleedMm * 2, this.dpi) * this.zoom;
        const bleedH = mmToPx(pageSetup.heightMm + bleedMm * 2, this.dpi) * this.zoom;

        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bleedScr.x, bleedScr.y, bleedW, bleedH);
        ctx.restore();
      }

      // Mancha Gráfica (Margens úteis - linha magenta/azul guia)
      if (this.showMargins) {
        const cBox = page.getContentBox(pageSetup);
        const marginScr = this.worldToScreen(cBox.x, cBox.y);
        const marginW = mmToPx(cBox.width, this.dpi) * this.zoom;
        const marginH = mmToPx(cBox.height, this.dpi) * this.zoom;

        ctx.save();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(marginScr.x, marginScr.y, marginW, marginH);
        ctx.restore();
      }

      // Numeração de Página
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${page.name}`, pageScr.x + 10, pageScr.y + pageH + 20);
    }

    // Linha da Lombada (Spine)
    if (isFacing) {
      const spineScr = this.worldToScreen(pageSetup.widthMm, 0);
      const spineH = mmToPx(pageSetup.heightMm, this.dpi) * this.zoom;

      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(spineScr.x, spineScr.y);
      ctx.lineTo(spineScr.x, spineScr.y + spineH);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderFrame(ctx, frame) {
    const scr = this.worldToScreen(frame.xMm, frame.yMm);
    const w = mmToPx(frame.widthMm, this.dpi) * this.zoom;
    const h = mmToPx(frame.heightMm, this.dpi) * this.zoom;

    ctx.save();

    if (frame.type === 'shape') {
      ctx.fillStyle = frame.fillColorSwatchId ? '#f1f5f9' : 'transparent';
      if (frame.fillColorSwatchId) ctx.fillRect(scr.x, scr.y, w, h);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(scr.x, scr.y, w, h);

    } else if (frame.type === 'image') {
      // Retângulo com diagonal "X" clássico do InDesign
      ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
      ctx.fillRect(scr.x, scr.y, w, h);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(scr.x, scr.y, w, h);

      // O 'X' transversal de placeholder DTP
      ctx.beginPath();
      ctx.moveTo(scr.x, scr.y);
      ctx.lineTo(scr.x + w, scr.y + h);
      ctx.moveTo(scr.x + w, scr.y);
      ctx.lineTo(scr.x, scr.y + h);
      ctx.stroke();

      // Rótulo central
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QUADRO DE IMAGEM', scr.x + w / 2, scr.y + h / 2);

    } else if (frame.type === 'text') {
      // Borda sutil de frame editorial
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(scr.x, scr.y, w, h);

      // Renderizar linhas formatadas
      if (frame.computedLines && frame.computedLines.length > 0) {
        ctx.fillStyle = '#0f172a';
        const fontSizePx = 13 * this.zoom;
        ctx.font = `${fontSizePx}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        for (const line of frame.computedLines) {
          const lineX = scr.x + mmToPx(ptToMm(line.x), this.dpi) * this.zoom;
          const lineY = scr.y + mmToPx(ptToMm(line.y), this.dpi) * this.zoom;
          ctx.fillText(line.text, lineX, lineY);
        }
      }

      // Indicador de Transbordo (Overflow Badge clássico de DTP)
      if (frame.hasOverflow) {
        const badgeSize = 12;
        const bx = scr.x + w - badgeSize;
        const by = scr.y + h - badgeSize;

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx, by, badgeSize, badgeSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', bx + badgeSize / 2, by + badgeSize / 2);
      }
    }

    ctx.restore();
  }

  renderSelectionHandles(ctx) {
    const selectedFrames = this.getSelectedFrames();
    if (selectedFrames.length === 0) return;

    for (const frame of selectedFrames) {
      const scr = this.worldToScreen(frame.xMm, frame.yMm);
      const w = mmToPx(frame.widthMm, this.dpi) * this.zoom;
      const h = mmToPx(frame.heightMm, this.dpi) * this.zoom;

      ctx.save();

      // 1. Linha do Bounding Box de Seleção (Azul DTP)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(scr.x, scr.y, w, h);

      // 2. As 8 Alças Cardeais (NW, N, NE, E, SE, S, SW, W)
      const handles = TransformHandles.getHandles(frame);
      const handleSize = 8; // tamanho fixo de 8x8 pixels em tela

      for (const handle of handles) {
        const hScr = this.worldToScreen(handle.xMm, handle.yMm);

        // Preenchimento branco sólido com borda azul
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hScr.x - handleSize / 2, hScr.y - handleSize / 2, handleSize, handleSize);

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hScr.x - handleSize / 2, hScr.y - handleSize / 2, handleSize, handleSize);
      }

      ctx.restore();
    }
  }

  renderPreviews(ctx) {
    ctx.save();

    // 1. Preview de Criação de Caixa
    if (this.creationPreview) {
      const scr = this.worldToScreen(this.creationPreview.xMm, this.creationPreview.yMm);
      const w = mmToPx(this.creationPreview.widthMm, this.dpi) * this.zoom;
      const h = mmToPx(this.creationPreview.heightMm, this.dpi) * this.zoom;

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(scr.x, scr.y, w, h);

      ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
      ctx.fillRect(scr.x, scr.y, w, h);

      // Exibir dimensões em mm em tempo real junto ao cursor
      ctx.setLineDash([]);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${this.creationPreview.widthMm.toFixed(1)} x ${this.creationPreview.heightMm.toFixed(1)} mm`, scr.x + 8, scr.y - 8);
    }

    // 2. Preview de Marquee
    if (this.marqueeBox) {
      const scr = this.worldToScreen(this.marqueeBox.xMm, this.marqueeBox.yMm);
      const w = mmToPx(this.marqueeBox.widthMm, this.dpi) * this.zoom;
      const h = mmToPx(this.marqueeBox.heightMm, this.dpi) * this.zoom;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(scr.x, scr.y, w, h);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(scr.x, scr.y, w, h);
    }

    ctx.restore();
  }

  renderRulers(ctx, w, h) {
    ctx.save();
    const rulerThick = 24;

    // 1. Destaque de Seleção nas Réguas (se houver quadro selecionado)
    const selected = this.getSelectedFrame();
    if (selected) {
      const scrP1 = this.worldToScreen(selected.xMm, selected.yMm);
      const scrP2 = this.worldToScreen(selected.xMm + selected.widthMm, selected.yMm + selected.heightMm);

      ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
      // Faixa horizontal destacada
      ctx.fillRect(scrP1.x, 0, scrP2.x - scrP1.x, rulerThick);
      // Faixa vertical destacada
      ctx.fillRect(0, scrP1.y, rulerThick, scrP2.y - scrP1.y);
    }

    // 2. Fundo da Régua Horizontal (Topo)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rulerThick, 0, w - rulerThick, rulerThick);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerThick, rulerThick - 0.5);
    ctx.lineTo(w, rulerThick - 0.5);
    ctx.stroke();

    // 3. Fundo da Régua Vertical (Esquerda)
    ctx.fillRect(0, rulerThick, rulerThick, h - rulerThick);
    ctx.beginPath();
    ctx.moveTo(rulerThick - 0.5, rulerThick);
    ctx.lineTo(rulerThick - 0.5, h);
    ctx.stroke();

    // Determinar passos de escala com base no zoom
    const pxPerMm = mmToPx(1, this.dpi) * this.zoom;
    let stepMm = 10;
    let majorMm = 50;
    if (pxPerMm > 15) { stepMm = 2; majorMm = 10; }
    else if (pxPerMm > 6) { stepMm = 5; majorMm = 20; }
    else if (pxPerMm > 2) { stepMm = 10; majorMm = 50; }
    else if (pxPerMm > 0.8) { stepMm = 25; majorMm = 100; }
    else { stepMm = 50; majorMm = 200; }

    // Traçar Ticks Horizontais
    const minXMm = this.screenToWorld(rulerThick, 0).x;
    const maxXMm = this.screenToWorld(w, 0).x;
    const startXMm = Math.floor(minXMm / stepMm) * stepMm;

    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let mm = startXMm; mm <= maxXMm; mm += stepMm) {
      const scr = this.worldToScreen(mm, 0);
      if (scr.x < rulerThick || scr.x > w) continue;

      const isMajor = Math.abs(Math.round(mm) % majorMm) < 0.001;
      ctx.strokeStyle = isMajor ? '#94a3b8' : '#475569';
      ctx.beginPath();
      ctx.moveTo(scr.x + 0.5, isMajor ? 8 : 16);
      ctx.lineTo(scr.x + 0.5, rulerThick);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(Math.round(mm).toString(), scr.x + 3, 8);
      }
    }

    // Traçar Ticks Verticais
    const minYMm = this.screenToWorld(0, rulerThick).y;
    const maxYMm = this.screenToWorld(0, h).y;
    const startYMm = Math.floor(minYMm / stepMm) * stepMm;

    for (let mm = startYMm; mm <= maxYMm; mm += stepMm) {
      const scr = this.worldToScreen(0, mm);
      if (scr.y < rulerThick || scr.y > h) continue;

      const isMajor = Math.abs(Math.round(mm) % majorMm) < 0.001;
      ctx.strokeStyle = isMajor ? '#94a3b8' : '#475569';
      ctx.beginPath();
      ctx.moveTo(isMajor ? 8 : 16, scr.y + 0.5);
      ctx.lineTo(rulerThick, scr.y + 0.5);
      ctx.stroke();

      if (isMajor) {
        ctx.save();
        ctx.translate(8, scr.y + 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(Math.round(mm).toString(), 0, 0);
        ctx.restore();
      }
    }

    // Indicador da Posição do Mouse nas Réguas
    if (this.mouseScreen && this.mouseScreen.x >= rulerThick && this.mouseScreen.y >= rulerThick) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;

      // Indicador no topo
      ctx.beginPath();
      ctx.moveTo(this.mouseScreen.x + 0.5, 0);
      ctx.lineTo(this.mouseScreen.x + 0.5, rulerThick);
      ctx.stroke();

      // Indicador na esquerda
      ctx.beginPath();
      ctx.moveTo(0, this.mouseScreen.y + 0.5);
      ctx.lineTo(rulerThick, this.mouseScreen.y + 0.5);
      ctx.stroke();
    }

    // Caixa de Canto Superior Esquerdo (Unidade mm)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rulerThick, rulerThick);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(0, 0, rulerThick, rulerThick);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('mm', rulerThick / 2, rulerThick / 2);

    ctx.restore();
  }
}

const CanvasModule = {
  CanvasController
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasModule;
}

if (typeof window !== 'undefined') {
  window.OpenDTPCanvas = CanvasModule;
}
