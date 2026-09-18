/**
 * OpenDTP Studio — Konva-Powered Interactive DTP Workspace
 * 
 * Integração robusta entre o motor editorial (OpenDTPEngine), o modelo de
 * comandos transacionais (Undo/Redo) e o motor gráfico Konva.js (Transformer de 8 alças).
 */

window.addEventListener('DOMContentLoaded', () => {
  const { OpenDTPEngine } = window.OpenDTPEngine;
  const { TextFrame, ImageFrame, ShapeFrame, Story } = window.OpenDTPDocument;
  const { AddFrameCommand, RemoveFrameCommand, TransformFrameCommand } = window.OpenDTPCommands;
  const { mmToPx, pxToMm, mmToPt, ptToMm } = window.OpenDTPUnits;

  // 1. Inicializar Motor do Documento
  const engine = new OpenDTPEngine();
  const doc = engine.createDocument({
    title: 'Edição Especial OpenDTP',
    pageSetup: {
      preset: 'A4',
      widthMm: 210,
      heightMm: 297,
      facingPages: true,
      bleedMm: 3.0,
      margins: { top: 20, bottom: 20, inside: 25, outside: 20 }
    }
  });

  // 2. Matéria Editorial Padrão
  const story = new Story({
    id: 'story-lead',
    title: 'A Nova Era da Tipografia Aberta'
  });
  story.addParagraph(
    'A editoração eletrônica moderna exige um equilíbrio refinado entre a liberdade visual irrestrita ' +
    'e a precisão matemática rigorosa dos tipos móveis. Durante décadas, a indústria gráfica permaneceu ' +
    'refém de formatos binários opacos e ecossistemas proprietários fechados.'
  );
  story.addParagraph(
    'O OpenDTP inaugura uma nova fase: um motor aberto onde cada página, cada vetor e cada linha ' +
    'tipográfica são cidadãos de primeira classe em arquivos JSON auditáveis pelo Git. A renderização a 60 FPS ' +
    'com fatiamento livre e hifenização silábica garante total fidelidade entre a tela e a impressora.'
  );
  doc.addStory(story);

  // 3. Primeira Spread (Página 1 à Direita / Recto)
  const spread = doc.addSpread();

  // Caixas de Exemplo Iniciais
  const frameTitle = new TextFrame({
    id: 'frame-title',
    name: 'Título Principal',
    xMm: 235,
    yMm: 30,
    widthMm: 160,
    heightMm: 24
  });
  spread.addFrame(frameTitle);

  const frameImg = new ImageFrame({
    id: 'frame-image',
    name: 'Moldura de Imagem',
    xMm: 235,
    yMm: 62,
    widthMm: 160,
    heightMm: 65
  });
  spread.addFrame(frameImg);

  const frameCol1 = new TextFrame({
    id: 'frame-col1',
    name: 'Coluna 1',
    xMm: 235,
    yMm: 136,
    widthMm: 76,
    heightMm: 115,
    storyId: story.id,
    nextFrameId: 'frame-col2'
  });
  spread.addFrame(frameCol1);

  const frameCol2 = new TextFrame({
    id: 'frame-col2',
    name: 'Coluna 2 (Transbordo)',
    xMm: 319,
    yMm: 136,
    widthMm: 76,
    heightMm: 115,
    storyId: story.id,
    prevFrameId: 'frame-col1'
  });
  spread.addFrame(frameCol2);

  // Calcular fluxo de texto
  engine.computeFlow();

  // ==========================================================================
  // CONFIGURAÇÃO DO STAGE KONVA & LAYERS
  // ==========================================================================
  const container = document.getElementById('stage-container');
  const stage = new Konva.Stage({
    container: 'stage-container',
    width: container.offsetWidth,
    height: container.offsetHeight
  });

  const pageLayer = new Konva.Layer({ id: 'page-layer' });
  const contentLayer = new Konva.Layer({ id: 'content-layer' });
  const uiLayer = new Konva.Layer({ id: 'ui-layer' });

  stage.add(pageLayer);
  stage.add(contentLayer);
  stage.add(uiLayer);

  // O Transformer Oficial do Konva (8 Alças Cardeais + Rotação)
  const transformer = new Konva.Transformer({
    nodes: [],
    enabledAnchors: [
      'top-left', 'top-center', 'top-right',
      'middle-right',
      'bottom-right', 'bottom-center', 'bottom-left',
      'middle-left'
    ],
    rotateEnabled: true,
    anchorSize: 9,
    anchorCornerRadius: 0,
    anchorFill: '#ffffff',
    anchorStroke: '#0284c7',
    anchorStrokeWidth: 1.5,
    borderStroke: '#0284c7',
    borderStrokeWidth: 1.5,
    boundBoxFunc: (oldBox, newBox) => {
      // Mínimo dimensional inviolável (15px ~ 4mm)
      if (newBox.width < 15 || newBox.height < 15) {
        return oldBox;
      }
      return newBox;
    }
  });
  uiLayer.add(transformer);

  // Retângulo de preview de criação de caixas
  const creationPreview = new Konva.Rect({
    stroke: '#0284c7',
    strokeWidth: 1.5,
    dash: [4, 4],
    fill: 'rgba(2, 132, 199, 0.1)',
    visible: false
  });
  uiLayer.add(creationPreview);

  // Mapa de amarração: frame.id -> Konva.Node
  const nodeMap = new Map();
  let selectedFrame = null;
  let activeTool = 'select'; // 'select' | 'text' | 'image' | 'shape' | 'pan'
  let isSpaceDown = false;
  let lastPointerPos = null;
  let currentRulerUnit = 'cm'; // 'cm' | 'mm'

  // ==========================================================================
  // RENDERIZADOR DE PÁGINAS E SPREADS
  // ==========================================================================
  function renderPages() {
    pageLayer.destroyChildren();

    const pageSetup = doc.pageSetup;
    const isFacing = pageSetup.facingPages && spread.pages.length > 1;

    for (const p of spread.pages) {
      const pageX = mmToPx(p.offsetX);
      const pageY = mmToPx(p.offsetY);
      const pageW = mmToPx(pageSetup.widthMm);
      const pageH = mmToPx(pageSetup.heightMm);

      // 1. Folha de Papel Branco com Sombra
      const paper = new Konva.Rect({
        x: pageX,
        y: pageY,
        width: pageW,
        height: pageH,
        fill: '#ffffff',
        stroke: 'rgba(0, 0, 0, 0.2)',
        strokeWidth: 1,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 20,
        shadowOffset: { x: 0, y: 8 },
        listening: false
      });
      pageLayer.add(paper);

      // 2. Sangria (Bleed - linha vermelha guia)
      if (pageSetup.bleedMm > 0) {
        const bleedPx = mmToPx(pageSetup.bleedMm);
        const bleedGuide = new Konva.Rect({
          x: pageX - bleedPx,
          y: pageY - bleedPx,
          width: pageW + bleedPx * 2,
          height: pageH + bleedPx * 2,
          stroke: 'rgba(239, 68, 68, 0.4)',
          strokeWidth: 1,
          dash: [4, 4],
          listening: false
        });
        pageLayer.add(bleedGuide);
      }

      // 3. Mancha Gráfica (Margens - linha magenta guia)
      const cBox = p.getContentBox(pageSetup);
      const marginGuide = new Konva.Rect({
        x: mmToPx(cBox.x),
        y: mmToPx(cBox.y),
        width: mmToPx(cBox.width),
        height: mmToPx(cBox.height),
        stroke: 'rgba(168, 85, 247, 0.4)',
        strokeWidth: 1,
        listening: false
      });
      pageLayer.add(marginGuide);

      // 4. Numeração de Página
      const pageLabel = new Konva.Text({
        x: pageX + 10,
        y: pageY + pageH + 15,
        text: p.name,
        fontSize: 11,
        fontFamily: 'sans-serif',
        fill: '#94a3b8',
        listening: false
      });
      pageLayer.add(pageLabel);
    }

    // Linha da Lombada (Spine)
    if (pageSetup.facingPages) {
      const spineX = mmToPx(pageSetup.widthMm);
      const spineLine = new Konva.Line({
        points: [spineX, 0, spineX, mmToPx(pageSetup.heightMm)],
        stroke: 'rgba(148, 163, 184, 0.35)',
        strokeWidth: 1.5,
        dash: [4, 4],
        listening: false
      });
      pageLayer.add(spineLine);
    }

    pageLayer.batchDraw();
  }

  // ==========================================================================
  // CONSTRUTOR DE NÓS DE QUADRO NO KONVA
  // ==========================================================================
  function createFrameNode(frame) {
    const group = new Konva.Group({
      id: frame.id,
      x: mmToPx(frame.xMm),
      y: mmToPx(frame.yMm),
      width: mmToPx(frame.widthMm),
      height: mmToPx(frame.heightMm),
      draggable: true
    });

    renderFrameContents(group, frame);

    // Eventos de Seleção e Arraste
    group.on('click tap', (e) => {
      if (activeTool === 'select') {
        e.cancelBubble = true;
        selectFrame(frame.id);
      }
    });

    group.on('dragmove', () => {
      frame.xMm = Number(pxToMm(group.x()).toFixed(2));
      frame.yMm = Number(pxToMm(group.y()).toFixed(2));
      updateInspector();
      updateRulers();
    });

    group.on('dragend', () => {
      const newX = Number(pxToMm(group.x()).toFixed(2));
      const newY = Number(pxToMm(group.y()).toFixed(2));
      engine.execute(new TransformFrameCommand(frame.id, { xMm: newX, yMm: newY }));
      updateUI();
    });

    group.on('transform', () => {
      const scaleX = group.scaleX();
      const scaleY = group.scaleY();
      const w = Math.max(15, group.width() * scaleX);
      const h = Math.max(15, group.height() * scaleY);
      frame.widthMm = Number(pxToMm(w).toFixed(2));
      frame.heightMm = Number(pxToMm(h).toFixed(2));
      frame.xMm = Number(pxToMm(group.x()).toFixed(2));
      frame.yMm = Number(pxToMm(group.y()).toFixed(2));
      updateInspector();
      updateRulers();
    });

    group.on('transformend', () => {
      const scaleX = group.scaleX();
      const scaleY = group.scaleY();
      group.scaleX(1);
      group.scaleY(1);
      const newW = Math.max(15, group.width() * scaleX);
      const newH = Math.max(15, group.height() * scaleY);
      group.width(newW);
      group.height(newH);

      const finalTransform = {
        xMm: Number(pxToMm(group.x()).toFixed(2)),
        yMm: Number(pxToMm(group.y()).toFixed(2)),
        widthMm: Number(pxToMm(newW).toFixed(2)),
        heightMm: Number(pxToMm(newH).toFixed(2))
      };

      engine.execute(new TransformFrameCommand(frame.id, finalTransform));
      if (frame.type === 'text') {
        engine.computeFlow();
      }
      renderFrameContents(group, frame);
      updateUI();
    });

    return group;
  }

  function renderFrameContents(group, frame) {
    group.destroyChildren();
    const w = group.width();
    const h = group.height();

    if (frame.type === 'shape') {
      const rect = new Konva.Rect({
        width: w,
        height: h,
        fill: '#f1f5f9',
        stroke: '#64748b',
        strokeWidth: 1.5
      });
      group.add(rect);

    } else if (frame.type === 'image') {
      const bg = new Konva.Rect({
        width: w,
        height: h,
        fill: 'rgba(241, 245, 249, 0.7)',
        stroke: '#94a3b8',
        strokeWidth: 1
      });
      group.add(bg);

      // O 'X' clássico de placeholder do InDesign
      const line1 = new Konva.Line({
        points: [0, 0, w, h],
        stroke: 'rgba(148, 163, 184, 0.6)',
        strokeWidth: 1
      });
      const line2 = new Konva.Line({
        points: [w, 0, 0, h],
        stroke: 'rgba(148, 163, 184, 0.6)',
        strokeWidth: 1
      });
      group.add(line1);
      group.add(line2);

      const lbl = new Konva.Text({
        x: 0,
        y: h / 2 - 6,
        width: w,
        text: 'IMAGEM',
        fontSize: 10,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        fill: '#64748b',
        align: 'center'
      });
      group.add(lbl);

    } else if (frame.type === 'text') {
      const border = new Konva.Rect({
        width: w,
        height: h,
        fill: 'transparent',
        stroke: 'rgba(56, 189, 248, 0.4)',
        strokeWidth: 1
      });
      group.add(border);

      // Linhas formatadas
      if (frame.computedLines && frame.computedLines.length > 0) {
        for (const line of frame.computedLines) {
          const tLine = new Konva.Text({
            x: mmToPx(ptToMm(line.x)),
            y: mmToPx(ptToMm(line.y)),
            text: line.text,
            fontSize: 12,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fill: '#0f172a'
          });
          group.add(tLine);
        }
      } else if (frame.name === 'Título Principal') {
        const titleText = new Konva.Text({
          x: 4,
          y: 4,
          width: w - 8,
          text: 'A Nova Era da Tipografia Aberta',
          fontSize: 18,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
          fill: '#0f172a'
        });
        group.add(titleText);
      }

      // Indicador de Transbordo (Overflow +)
      if (frame.hasOverflow) {
        const badgeSize = 12;
        const overflowBadge = new Konva.Rect({
          x: w - badgeSize,
          y: h - badgeSize,
          width: badgeSize,
          height: badgeSize,
          fill: '#ef4444'
        });
        const plus = new Konva.Text({
          x: w - badgeSize,
          y: h - badgeSize + 1,
          width: badgeSize,
          text: '+',
          fontSize: 10,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
          fill: '#ffffff',
          align: 'center'
        });
        group.add(overflowBadge);
        group.add(plus);
      }
    }
  }

  function syncAllFrames() {
    contentLayer.destroyChildren();
    nodeMap.clear();

    for (const f of spread.frames) {
      const node = createFrameNode(f);
      contentLayer.add(node);
      nodeMap.set(f.id, node);
    }
    contentLayer.batchDraw();
  }

  function selectFrame(frameId) {
    if (!frameId) {
      selectedFrame = null;
      transformer.nodes([]);
    } else {
      selectedFrame = spread.getFrame(frameId);
      const node = nodeMap.get(frameId);
      if (node) {
        transformer.nodes([node]);
        node.moveToTop();
        transformer.moveToTop();
      }
    }
    uiLayer.batchDraw();
    updateInspector();
    updateRulers();
  }

  // ==========================================================================
  // FERRAMENTAS DE CRIAÇÃO E CLIQUE NO STAGE
  // ==========================================================================
  let isDrawing = false;
  let drawStart = { x: 0, y: 0 };

  stage.on('mousedown touchstart', (e) => {
    // Clique na mesa de trabalho / papel
    if (activeTool === 'pan' || isSpaceDown || e.evt.button === 1) {
      stage.startDrag();
      return;
    }

    if (activeTool === 'select') {
      // Se clicou no fundo do stage (não num quadro)
      if (e.target === stage || e.target.getLayer() === pageLayer) {
        selectFrame(null);
      }
      return;
    }

    // Ferramentas de Criação (Texto, Imagem, Forma)
    const pos = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePos = transform.point(pos);

    isDrawing = true;
    drawStart = { ...stagePos };

    creationPreview.position(stagePos);
    creationPreview.size({ width: 0, height: 0 });
    creationPreview.visible(true);
    uiLayer.batchDraw();
  });

  stage.on('mousemove touchmove', () => {
    // Atualizar coordenadas no rodapé
    const pos = stage.getPointerPosition();
    if (pos) {
      lastPointerPos = pos;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const stagePos = transform.point(pos);

      const activePage = spread.pages[0];
      const originXMm = activePage ? activePage.offsetX : 0;
      const originYMm = activePage ? activePage.offsetY : 0;

      const unitFactor = (currentRulerUnit === 'cm') ? 0.1 : 1.0;
      const curX = ((pxToMm(stagePos.x) - originXMm) * unitFactor).toFixed(1);
      const curY = ((pxToMm(stagePos.y) - originYMm) * unitFactor).toFixed(1);
      document.getElementById('statCursor').innerHTML = `Coordenadas: <span>${curX}, ${curY} ${currentRulerUnit}</span>`;
      updateRulers();
    }

    if (!isDrawing) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePos = transform.point(pos);

    const x = Math.min(drawStart.x, stagePos.x);
    const y = Math.min(drawStart.y, stagePos.y);
    const w = Math.abs(stagePos.x - drawStart.x);
    const h = Math.abs(stagePos.y - drawStart.y);

    creationPreview.position({ x, y });
    creationPreview.size({ width: w, height: h });
    uiLayer.batchDraw();
  });

  stage.on('mouseleave', () => {
    lastPointerPos = null;
    updateRulers();
  });

  stage.on('mouseup touchend', (e) => {
    if (activeTool === 'pan') {
      stage.stopDrag();
      return;
    }

    if (!isDrawing) return;
    isDrawing = false;
    creationPreview.visible(false);
    uiLayer.batchDraw();

    let w = creationPreview.width();
    let h = creationPreview.height();
    let x = creationPreview.x();
    let y = creationPreview.y();

    // Se o usuário deu apenas um clique (sem arrastar), cria uma caixa com tamanho editorial padrão
    if (w < 15 || h < 15) {
      w = (activeTool === 'text') ? mmToPx(80) : (activeTool === 'image' ? mmToPx(70) : mmToPx(60));
      h = (activeTool === 'text') ? mmToPx(50) : (activeTool === 'image' ? mmToPx(50) : mmToPx(40));
      x = drawStart.x - w / 2;
      y = drawStart.y - h / 2;
    }

    const frameOpts = {
      name: (activeTool === 'text' ? 'Quadro de Texto' : (activeTool === 'image' ? 'Moldura de Imagem' : 'Forma')) + ' ' + Date.now().toString().slice(-4),
      xMm: Number(pxToMm(x).toFixed(2)),
      yMm: Number(pxToMm(y).toFixed(2)),
      widthMm: Number(pxToMm(w).toFixed(2)),
      heightMm: Number(pxToMm(h).toFixed(2))
    };

    let newFrame;
    if (activeTool === 'text') {
      newFrame = new TextFrame(frameOpts);
      newFrame.storyId = story.id;
    } else if (activeTool === 'image') {
      newFrame = new ImageFrame(frameOpts);
    } else {
      newFrame = new ShapeFrame(frameOpts);
    }

    engine.execute(new AddFrameCommand(spread.id, newFrame));
    if (newFrame.type === 'text') {
      engine.computeFlow();
    }

    syncAllFrames();
    selectFrame(newFrame.id);
    setTool('select');
  });

  // Zoom com a roda do mouse centrado no cursor
  stage.on('wheel', (e) => {
    e.evt.preventDefault();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.2, Math.min(6.0, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    stage.position(newPos);
    updateUI();
  });

  // ==========================================================================
  // CONTROLE DE FERRAMENTAS & TECLADO
  // ==========================================================================
  const MOUSE_CLICK_CURSOR = `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 61 68' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.76249 9.72316C10.8748 3.96251 18.1365 2.01676 21.9801 6.44947L55.2513 44.8202C59.0803 49.236 56.164 56.1242 50.3283 56.4484L30.6146 57.5434C29.6455 57.5972 28.6979 57.8511 27.8317 58.2891L10.2117 67.1976C4.99578 69.8347 -0.973931 65.3274 0.134128 59.5887L9.76249 9.72316Z' fill='black'/%3E%3Cpath d='M15.2602 5.99029C16.1342 1.46429 21.8398 -0.0645015 24.8598 3.41798L58.1312 41.7888C61.1396 45.2584 58.8481 50.6707 54.2629 50.9253L34.5497 52.0202C33.3728 52.0856 32.2218 52.3939 31.1699 52.9257L13.5503 61.8346C9.45206 63.9067 4.76162 60.365 5.63221 55.8561L15.2602 5.99029Z' fill='white' stroke='black' stroke-width='3'/%3E%3C/svg%3E") 10 1, default`;

  const toolButtons = document.querySelectorAll('.tool-btn');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.getAttribute('data-tool');
      setTool(toolId);
    });
  });

  function setTool(toolId) {
    activeTool = toolId;
    toolButtons.forEach(btn => {
      if (btn.getAttribute('data-tool') === toolId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (activeTool === 'select') {
      stage.container().style.cursor = MOUSE_CLICK_CURSOR;
      transformer.visible(true);
    } else if (activeTool === 'pan') {
      stage.container().style.cursor = 'grab';
      transformer.visible(false);
      selectFrame(null);
    } else {
      stage.container().style.cursor = 'crosshair';
      transformer.visible(false);
      selectFrame(null);
    }
    uiLayer.batchDraw();
  }

  window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (e.key === 'v' || e.key === 'V') setTool('select');
    else if (e.key === 't' || e.key === 'T') setTool('text');
    else if (e.key === 'f' || e.key === 'F') setTool('image');
    else if (e.key === 'm' || e.key === 'M') setTool('shape');
    else if (e.key === 'h' || e.key === 'H') setTool('pan');

    // Desfazer / Refazer
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) engine.redo();
        else engine.undo();
        syncAllFrames();
        selectFrame(selectedFrame ? selectedFrame.id : null);
        updateUI();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        engine.redo();
        syncAllFrames();
        selectFrame(selectedFrame ? selectedFrame.id : null);
        updateUI();
      }
    }

    // Excluir quadro
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFrame) {
      e.preventDefault();
      engine.execute(new RemoveFrameCommand(selectedFrame.id));
      selectFrame(null);
      syncAllFrames();
      updateUI();
    }

    if (e.code === 'Space' && !isSpaceDown) {
      isSpaceDown = true;
      stage.container().style.cursor = 'grab';
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      isSpaceDown = false;
      setTool(activeTool);
    }
  });

  // ==========================================================================
  // RÉGUAS MILIMÉTRICAS SINCRONIZADAS (TOP & LEFT)
  // ==========================================================================
  const rulerTop = document.getElementById('ruler-top');
  const rulerLeft = document.getElementById('ruler-left');
  const ctxTop = rulerTop.getContext('2d');
  const ctxLeft = rulerLeft.getContext('2d');

  function updateRulers() {
    const dpr = window.devicePixelRatio || 1;
    const widthCss = rulerTop.offsetWidth;
    const heightCss = rulerLeft.offsetHeight;

    if (rulerTop.width !== Math.round(widthCss * dpr) || rulerTop.height !== Math.round(24 * dpr)) {
      rulerTop.width = Math.round(widthCss * dpr);
      rulerTop.height = Math.round(24 * dpr);
    }
    if (rulerLeft.width !== Math.round(24 * dpr) || rulerLeft.height !== Math.round(heightCss * dpr)) {
      rulerLeft.width = Math.round(24 * dpr);
      rulerLeft.height = Math.round(heightCss * dpr);
    }

    ctxTop.resetTransform();
    ctxTop.scale(dpr, dpr);
    ctxLeft.resetTransform();
    ctxLeft.scale(dpr, dpr);

    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();

    const activePage = spread.pages[0];
    const pageSetup = doc.pageSetup;
    const originXMm = activePage ? activePage.offsetX : 0;
    const originYMm = activePage ? activePage.offsetY : 0;

    const pageScreenX = mmToPx(originXMm) * scale + stageX;
    const pageScreenY = mmToPx(originYMm) * scale + stageY;
    const pageWidthScreen = mmToPx(pageSetup.widthMm) * scale;
    const pageHeightScreen = mmToPx(pageSetup.heightMm) * scale;

    // 1. Limpar fundo das réguas
    ctxTop.fillStyle = '#0f172a';
    ctxTop.fillRect(0, 0, widthCss, 24);
    ctxLeft.fillStyle = '#0f172a';
    ctxLeft.fillRect(0, 0, 24, heightCss);

    // 2. Destaque sutil da folha de papel na régua
    ctxTop.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctxTop.fillRect(pageScreenX, 0, pageWidthScreen, 24);
    ctxLeft.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctxLeft.fillRect(0, pageScreenY, 24, pageHeightScreen);

    // 3. Destaque de seleção (Bounding Box do Quadro Ativo)
    if (selectedFrame) {
      const scrX1 = mmToPx(selectedFrame.xMm) * scale + stageX;
      const scrX2 = mmToPx(selectedFrame.xMm + selectedFrame.widthMm) * scale + stageX;
      const scrY1 = mmToPx(selectedFrame.yMm) * scale + stageY;
      const scrY2 = mmToPx(selectedFrame.yMm + selectedFrame.heightMm) * scale + stageY;

      ctxTop.fillStyle = 'rgba(2, 132, 199, 0.25)';
      ctxTop.fillRect(scrX1, 0, scrX2 - scrX1, 24);

      ctxLeft.fillStyle = 'rgba(2, 132, 199, 0.25)';
      ctxLeft.fillRect(0, scrY1, 24, scrY2 - scrY1);
    }

    // 4. Cálculo de Passos Métricos (LOD - Level of Detail)
    const pxPerMm = mmToPx(1) * scale;
    const pxPerCm = pxPerMm * 10;

    let subdivMm = 5;         // Subdivisão menor de traços
    let labelIntervalMm = 10; // Intervalo entre números

    if (pxPerCm >= 50) {
      subdivMm = 1;           // 1 mm
      labelIntervalMm = 10;   // Cada 1 cm
    } else if (pxPerCm >= 25) {
      subdivMm = (pxPerMm >= 3.0) ? 1 : 2; // 1mm ou 2mm
      labelIntervalMm = 10;   // Cada 1 cm
    } else if (pxPerCm >= 12) {
      subdivMm = 5;           // Meio centímetro (5mm)
      labelIntervalMm = (pxPerCm >= 18) ? 10 : 20; // Cada 1 ou 2 cm
    } else if (pxPerCm >= 6) {
      subdivMm = 10;          // Cada 1 cm
      labelIntervalMm = 50;   // Cada 5 cm
    } else {
      subdivMm = 20;
      labelIntervalMm = 100;  // Cada 10 cm
    }

    // ========================================================================
    // RÉGUA HORIZONTAL (TOP)
    // ========================================================================
    const minXMm = pxToMm((0 - pageScreenX) / scale);
    const maxXMm = pxToMm((widthCss - pageScreenX) / scale);
    const startXMm = Math.floor(minXMm / subdivMm) * subdivMm;

    ctxTop.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctxTop.textAlign = 'left';
    ctxTop.textBaseline = 'top';

    for (let mm = startXMm; mm <= maxXMm; mm += subdivMm) {
      const roundedMm = Math.round(mm);
      const scrX = pageScreenX + mmToPx(mm) * scale;
      if (scrX < -15 || scrX > widthCss + 15) continue;

      const isPageStart = Math.abs(roundedMm) < 0.001;
      const isPageEnd = Math.abs(roundedMm - Math.round(pageSetup.widthMm)) < 0.001;
      const isPageBoundary = isPageStart || isPageEnd;

      const isLabeled = (Math.abs(roundedMm % labelIntervalMm) < 0.001);
      const isCm = (Math.abs(roundedMm % 10) < 0.001);
      const isHalfCm = (Math.abs(roundedMm % 5) < 0.001);

      let tickY1 = 18;
      let strokeColor = '#334155';

      if (isPageBoundary) {
        tickY1 = 0;
        strokeColor = '#38bdf8';
      } else if (isLabeled || isCm) {
        tickY1 = 10;
        strokeColor = isLabeled ? '#94a3b8' : '#64748b';
      } else if (isHalfCm) {
        tickY1 = 14;
        strokeColor = '#475569';
      } else {
        tickY1 = 18;
        strokeColor = '#334155';
      }

      ctxTop.strokeStyle = strokeColor;
      ctxTop.lineWidth = isPageBoundary ? 1.5 : 1;
      ctxTop.beginPath();
      ctxTop.moveTo(Math.floor(scrX) + 0.5, tickY1);
      ctxTop.lineTo(Math.floor(scrX) + 0.5, 24);
      ctxTop.stroke();

      if (isLabeled || isPageBoundary) {
        const valText = (currentRulerUnit === 'cm')
          ? (roundedMm / 10).toString()
          : roundedMm.toString();

        ctxTop.fillStyle = isPageBoundary ? '#38bdf8' : '#cbd5e1';
        ctxTop.fillText(valText, Math.floor(scrX) + 2, 2);
      }
    }

    // ========================================================================
    // RÉGUA VERTICAL (LEFT)
    // ========================================================================
    const minYMm = pxToMm((0 - pageScreenY) / scale);
    const maxYMm = pxToMm((heightCss - pageScreenY) / scale);
    const startYMm = Math.floor(minYMm / subdivMm) * subdivMm;

    ctxLeft.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctxLeft.textAlign = 'center';
    ctxLeft.textBaseline = 'middle';

    for (let mm = startYMm; mm <= maxYMm; mm += subdivMm) {
      const roundedMm = Math.round(mm);
      const scrY = pageScreenY + mmToPx(mm) * scale;
      if (scrY < -15 || scrY > heightCss + 15) continue;

      const isPageStart = Math.abs(roundedMm) < 0.001;
      const isPageEnd = Math.abs(roundedMm - Math.round(pageSetup.heightMm)) < 0.001;
      const isPageBoundary = isPageStart || isPageEnd;

      const isLabeled = (Math.abs(roundedMm % labelIntervalMm) < 0.001);
      const isCm = (Math.abs(roundedMm % 10) < 0.001);
      const isHalfCm = (Math.abs(roundedMm % 5) < 0.001);

      let tickX1 = 18;
      let strokeColor = '#334155';

      if (isPageBoundary) {
        tickX1 = 0;
        strokeColor = '#38bdf8';
      } else if (isLabeled || isCm) {
        tickX1 = 10;
        strokeColor = isLabeled ? '#94a3b8' : '#64748b';
      } else if (isHalfCm) {
        tickX1 = 14;
        strokeColor = '#475569';
      } else {
        tickX1 = 18;
        strokeColor = '#334155';
      }

      ctxLeft.strokeStyle = strokeColor;
      ctxLeft.lineWidth = isPageBoundary ? 1.5 : 1;
      ctxLeft.beginPath();
      ctxLeft.moveTo(tickX1, Math.floor(scrY) + 0.5);
      ctxLeft.lineTo(24, Math.floor(scrY) + 0.5);
      ctxLeft.stroke();

      if (isLabeled || isPageBoundary) {
        const valText = (currentRulerUnit === 'cm')
          ? (roundedMm / 10).toString()
          : roundedMm.toString();

        ctxLeft.save();
        ctxLeft.translate(5, Math.floor(scrY));
        ctxLeft.rotate(-Math.PI / 2);
        ctxLeft.fillStyle = isPageBoundary ? '#38bdf8' : '#cbd5e1';
        ctxLeft.fillText(valText, 0, 0);
        ctxLeft.restore();
      }
    }

    // ========================================================================
    // MARCADOR DINÂMICO DO MOUSE NAS RÉGUAS (MIRA CIANO)
    // ========================================================================
    const pos = lastPointerPos;
    if (pos) {
      ctxTop.strokeStyle = '#38bdf8';
      ctxTop.lineWidth = 1;
      ctxTop.beginPath();
      ctxTop.moveTo(Math.floor(pos.x) + 0.5, 0);
      ctxTop.lineTo(Math.floor(pos.x) + 0.5, 24);
      ctxTop.stroke();

      ctxLeft.strokeStyle = '#38bdf8';
      ctxLeft.lineWidth = 1;
      ctxLeft.beginPath();
      ctxLeft.moveTo(0, Math.floor(pos.y) + 0.5);
      ctxLeft.lineTo(24, Math.floor(pos.y) + 0.5);
      ctxLeft.stroke();
    }
  }

  // ==========================================================================
  // INSPETOR DE PROPRIEDADES & AÇÕES DO HEADER
  // ==========================================================================
  const inspectorContent = document.getElementById('inspector-content');
  const statSelection = document.getElementById('statSelection');
  const lblZoom = document.getElementById('lblZoom');
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');

  function updateInspector() {
    if (!selectedFrame) {
      inspectorContent.innerHTML = `
        <div class="inspector-section" style="color: #64748b; font-size: 12px; text-align: center; padding: 40px 16px;">
          Nenhum quadro selecionado.<br><br>
          Clique em uma caixa no canvas para ajustar dimensões ou puxar as 8 alças.
        </div>
      `;
      statSelection.innerHTML = 'Seleção: <span>Nenhum quadro</span>';
      return;
    }

    statSelection.innerHTML = `Seleção: <span>${selectedFrame.name}</span>`;

    let typeClass = 'text';
    let typeName = 'Quadro de Texto';
    if (selectedFrame.type === 'image') { typeClass = 'image'; typeName = 'Moldura de Imagem'; }
    if (selectedFrame.type === 'shape') { typeClass = 'shape'; typeName = 'Retângulo / Forma'; }

    const activePage = spread.pages[0];
    const originXMm = activePage ? activePage.offsetX : 0;
    const originYMm = activePage ? activePage.offsetY : 0;

    const unitFactor = (currentRulerUnit === 'cm') ? 0.1 : 1.0;
    const unitStep = (currentRulerUnit === 'cm') ? '0.1' : '0.5';
    const unitMin = (currentRulerUnit === 'cm') ? '0.5' : '5';
    const unitLabel = currentRulerUnit;

    const relXMm = selectedFrame.xMm - originXMm;
    const relYMm = selectedFrame.yMm - originYMm;

    const valX = (relXMm * unitFactor).toFixed(1);
    const valY = (relYMm * unitFactor).toFixed(1);
    const valW = (selectedFrame.widthMm * unitFactor).toFixed(1);
    const valH = (selectedFrame.heightMm * unitFactor).toFixed(1);

    inspectorContent.innerHTML = `
      <div class="inspector-section">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 13px; color: #f8fafc;">${selectedFrame.name}</strong>
          <span class="type-pill ${typeClass}">${typeName}</span>
        </div>
        <div style="font-size: 10px; color: #64748b; font-family: monospace;">ID: ${selectedFrame.id}</div>
      </div>

      <div class="inspector-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="section-title" style="margin-bottom: 0;">Geometria & Posição (${unitLabel})</span>
          <span style="font-size: 10px; color: #38bdf8; cursor: pointer; text-decoration: underline;" id="btnToggleUnit">${unitLabel === 'cm' ? 'Mudar para mm' : 'Mudar para cm'}</span>
        </div>
        <div class="prop-grid">
          <div class="prop-field">
            <label>X (${unitLabel})</label>
            <input type="number" id="inpX" step="${unitStep}" value="${valX}">
          </div>
          <div class="prop-field">
            <label>Y (${unitLabel})</label>
            <input type="number" id="inpY" step="${unitStep}" value="${valY}">
          </div>
          <div class="prop-field">
            <label>Largura (${unitLabel})</label>
            <input type="number" id="inpW" step="${unitStep}" min="${unitMin}" value="${valW}">
          </div>
          <div class="prop-field">
            <label>Altura (${unitLabel})</label>
            <input type="number" id="inpH" step="${unitStep}" min="${unitMin}" value="${valH}">
          </div>
        </div>
      </div>

      ${selectedFrame.type === 'text' ? `
        <div class="inspector-section">
          <span class="section-title">Fluxo Tipográfico</span>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
            Matéria: <strong>${selectedFrame.storyId || 'Nenhuma'}</strong><br>
            Linhas formatadas: <strong>${selectedFrame.computedLines?.length || 0}</strong><br>
            Status: <strong style="color: ${selectedFrame.hasOverflow ? '#ef4444' : '#4ade80'};">
              ${selectedFrame.hasOverflow ? 'Transbordo (+)' : 'Encaixe Perfeito'}
            </strong>
          </div>
        </div>
      ` : ''}

      <div class="inspector-section">
        <button class="btn" id="btnDeleteFrame" style="background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #fca5a5; justify-content: center;">
          🗑 Excluir Quadro
        </button>
      </div>
    `;

    document.getElementById('btnToggleUnit')?.addEventListener('click', () => {
      currentRulerUnit = (currentRulerUnit === 'cm') ? 'mm' : 'cm';
      const rCorner = document.getElementById('ruler-corner');
      if (rCorner) rCorner.innerText = currentRulerUnit;
      updateUI();
    });

    const bindInput = (id, prop, isX = false, isY = false) => {
      const inp = document.getElementById(id);
      if (!inp) return;
      inp.addEventListener('change', () => {
        let val = parseFloat(inp.value);
        if (!isNaN(val)) {
          let valMm = (currentRulerUnit === 'cm') ? val * 10 : val;
          if (isX) valMm += originXMm;
          if (isY) valMm += originYMm;

          const transform = {};
          transform[prop] = Number(valMm.toFixed(2));
          engine.execute(new TransformFrameCommand(selectedFrame.id, transform));
          if (selectedFrame.type === 'text') engine.computeFlow();

          const node = nodeMap.get(selectedFrame.id);
          if (node) {
            node.x(mmToPx(selectedFrame.xMm));
            node.y(mmToPx(selectedFrame.yMm));
            node.width(mmToPx(selectedFrame.widthMm));
            node.height(mmToPx(selectedFrame.heightMm));
            renderFrameContents(node, selectedFrame);
            contentLayer.batchDraw();
            uiLayer.batchDraw();
          }
          updateUI();
        }
      });
    };

    bindInput('inpX', 'xMm', true, false);
    bindInput('inpY', 'yMm', false, true);
    bindInput('inpW', 'widthMm', false, false);
    bindInput('inpH', 'heightMm', false, false);

    document.getElementById('btnDeleteFrame').addEventListener('click', () => {
      engine.execute(new RemoveFrameCommand(selectedFrame.id));
      selectFrame(null);
      syncAllFrames();
      updateUI();
    });
  }

  function updateUI() {
    lblZoom.innerText = Math.round(stage.scaleX() * 100) + '%';
    btnUndo.disabled = !engine.history.canUndo();
    btnRedo.disabled = !engine.history.canRedo();
    updateInspector();
    updateRulers();
  }

  // Zoom Fit
  function zoomToFit() {
    const pageSetup = doc.pageSetup;
    const isFacing = pageSetup.facingPages && spread.pages.length > 1;

    let minX = 0;
    let maxX = pageSetup.widthMm;
    if (spread.pages.length > 0) {
      minX = Math.min(...spread.pages.map(p => p.offsetX));
      maxX = Math.max(...spread.pages.map(p => p.offsetX + pageSetup.widthMm));
    }
    const totalW = maxX - minX;
    const totalH = pageSetup.heightMm;

    const totalWPx = mmToPx(totalW);
    const totalHPx = mmToPx(totalH);

    const pad = 60;
    const availW = container.offsetWidth - pad * 2;
    const availH = container.offsetHeight - pad * 2;

    const scale = Math.min(2.0, Math.max(0.2, Math.min(availW / totalWPx, availH / totalHPx)));
    stage.scale({ x: scale, y: scale });

    const centerX = minX + totalW / 2;
    const centerY = totalH / 2;

    stage.x(container.offsetWidth / 2 - mmToPx(centerX) * scale);
    stage.y(container.offsetHeight / 2 - mmToPx(centerY) * scale);

    updateUI();
    stage.batchDraw();
  }

  // Botões de Ação do Topo
  btnUndo.onclick = () => {
    engine.undo();
    syncAllFrames();
    selectFrame(selectedFrame ? selectedFrame.id : null);
    updateUI();
  };

  btnRedo.onclick = () => {
    engine.redo();
    syncAllFrames();
    selectFrame(selectedFrame ? selectedFrame.id : null);
    updateUI();
  };

  document.getElementById('btnZoomIn').onclick = () => {
    stage.scale({ x: stage.scaleX() * 1.25, y: stage.scaleY() * 1.25 });
    updateUI();
    stage.batchDraw();
  };

  document.getElementById('btnZoomOut').onclick = () => {
    stage.scale({ x: stage.scaleX() / 1.25, y: stage.scaleY() / 1.25 });
    updateUI();
    stage.batchDraw();
  };

  document.getElementById('btnZoomReset').onclick = () => {
    stage.scale({ x: 1.0, y: 1.0 });
    updateUI();
    stage.batchDraw();
  };

  document.getElementById('btnZoomFit').onclick = () => {
    zoomToFit();
  };

  document.getElementById('btnExportPdf').onclick = () => {
    try {
      const pdfData = engine.exportPdf({ addPrePressMarks: true });
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OpenDTP_Documento_A4.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao exportar PDF: ' + err.message);
    }
  };

  const rulerCorner = document.getElementById('ruler-corner');
  if (rulerCorner) {
    rulerCorner.onclick = () => {
      currentRulerUnit = (currentRulerUnit === 'cm') ? 'mm' : 'cm';
      rulerCorner.innerText = currentRulerUnit;
      updateUI();
    };
  }

  window.addEventListener('resize', () => {
    stage.width(container.offsetWidth);
    stage.height(container.offsetHeight);
    updateUI();
    stage.batchDraw();
  });

  // Inicialização
  renderPages();
  syncAllFrames();
  zoomToFit();
  setTool('select');
  updateUI();
});
