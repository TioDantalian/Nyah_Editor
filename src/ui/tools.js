/**
 * OpenDTP - Interactive Tools Framework
 * 
 * Implementação das ferramentas de manipulação visual:
 * - SelectionTool (V): Seleção, arraste, 8 alças cardeais e marquee
 * - TextFrameTool (T): Criação de caixas de texto com fluxo
 * - ImageFrameTool (F): Criação de molduras de imagem com 'X' transversal
 * - ShapeFrameTool (M): Criação de retângulos/formas vetoriais
 * - PanTool (H): Navegação da mesa de trabalho
 */

const { TransformHandles } = (typeof require !== 'undefined') ? require('./transform_handles') : window.OpenDTPHandles;
const { TextFrame, ImageFrame, ShapeFrame } = (typeof require !== 'undefined') ? require('../core/document') : window.OpenDTPDocument;
const { AddFrameCommand, RemoveFrameCommand, TransformFrameCommand } = (typeof require !== 'undefined') ? require('../core/commands') : window.OpenDTPCommands;

class BaseTool {
  constructor(id, name, cursor = 'default') {
    this.id = id;
    this.name = name;
    this.cursor = cursor;
  }

  activate(context) {}
  deactivate(context) {}

  onPointerDown(evt, context) {}
  onPointerMove(evt, context) {}
  onPointerUp(evt, context) {}
  onKeyDown(evt, context) {}
  onKeyUp(evt, context) {}
}

class SelectionTool extends BaseTool {
  constructor() {
    super('select', 'Seleção (V)', 'default');
    this.mode = 'idle'; // 'idle' | 'moving' | 'resizing' | 'marquee'
    this.activeHandle = null;
    this.dragStart = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
    this.initialBox = null;
    this.marqueeBox = null;
  }

  onPointerDown(evt, context) {
    const { world, screen, controller } = context;
    const selectedFrame = controller.getSelectedFrame();

    // 1. Verificar clique nas 8 alças do quadro selecionado
    if (selectedFrame) {
      const hitHandle = controller.hitTestHandle(screen.x, screen.y, selectedFrame, 10);

      if (hitHandle) {
        this.mode = 'resizing';
        this.activeHandle = hitHandle.id;
        this.dragStart = { screenX: screen.x, screenY: screen.y, worldX: world.x, worldY: world.y };
        this.initialBox = {
          xMm: selectedFrame.xMm,
          yMm: selectedFrame.yMm,
          widthMm: selectedFrame.widthMm,
          heightMm: selectedFrame.heightMm
        };
        controller.setCursor(hitHandle.cursor);
        return;
      }
    }

    // 2. Verificar clique dentro de um quadro
    const hitFrame = controller.hitTestFrame(world.x, world.y);
    if (hitFrame) {
      if (evt.shiftKey && selectedFrame && selectedFrame.id !== hitFrame.id) {
        // Multi-seleção (toggle ou expansão)
        controller.toggleSelection(hitFrame.id);
      } else {
        controller.selectFrame(hitFrame.id);
      }

      this.mode = 'moving';
      this.dragStart = { screenX: screen.x, screenY: screen.y, worldX: world.x, worldY: world.y };
      this.initialBox = {
        xMm: hitFrame.xMm,
        yMm: hitFrame.yMm,
        widthMm: hitFrame.widthMm,
        heightMm: hitFrame.heightMm
      };
      controller.setCursor('move');
      return;
    }

    // 3. Clique no vazio: limpar seleção ou iniciar Marquee
    if (!evt.shiftKey) {
      controller.clearSelection();
    }
    this.mode = 'marquee';
    this.dragStart = { screenX: screen.x, screenY: screen.y, worldX: world.x, worldY: world.y };
    this.marqueeBox = { xMm: world.x, yMm: world.y, widthMm: 0, heightMm: 0 };
    controller.setMarquee(this.marqueeBox);
  }

  onPointerMove(evt, context) {
    const { world, screen, controller } = context;
    const selectedFrame = controller.getSelectedFrame();

    if (this.mode === 'idle') {
      // Atualizar cursor conforme hover em alças ou quadros
      if (selectedFrame) {
        const hitHandle = controller.hitTestHandle(screen.x, screen.y, selectedFrame, 10);
        if (hitHandle) {
          controller.setCursor(hitHandle.cursor);
          return;
        }
      }

      const hitFrame = controller.hitTestFrame(world.x, world.y);
      if (hitFrame) {
        controller.setCursor('move');
      } else {
        controller.setCursor('default');
      }
      return;
    }

    if (this.mode === 'resizing' && selectedFrame && this.initialBox) {
      const dxMm = world.x - this.dragStart.worldX;
      const dyMm = world.y - this.dragStart.worldY;

      const newBox = TransformHandles.computeResize(
        this.activeHandle,
        this.initialBox,
        dxMm,
        dyMm,
        {
          lockAspect: evt.shiftKey,
          fromCenter: evt.altKey,
          minWidthMm: 5.0,
          minHeightMm: 5.0
        }
      );

      // Atualização transitória em tempo real no quadro
      selectedFrame.xMm = newBox.xMm;
      selectedFrame.yMm = newBox.yMm;
      selectedFrame.widthMm = newBox.widthMm;
      selectedFrame.heightMm = newBox.heightMm;

      // Se for quadro de texto, recalcula o fluxo interativamente
      if (selectedFrame.type === 'text') {
        controller.engine.computeFlow();
      }

      controller.requestRender();
      return;
    }

    if (this.mode === 'moving' && selectedFrame && this.initialBox) {
      const dxMm = world.x - this.dragStart.worldX;
      const dyMm = world.y - this.dragStart.worldY;

      selectedFrame.xMm = Number((this.initialBox.xMm + dxMm).toFixed(3));
      selectedFrame.yMm = Number((this.initialBox.yMm + dyMm).toFixed(3));

      controller.requestRender();
      return;
    }

    if (this.mode === 'marquee') {
      const x = Math.min(this.dragStart.worldX, world.x);
      const y = Math.min(this.dragStart.worldY, world.y);
      const w = Math.abs(world.x - this.dragStart.worldX);
      const h = Math.abs(world.y - this.dragStart.worldY);

      this.marqueeBox = { xMm: x, yMm: y, widthMm: w, heightMm: h };
      controller.setMarquee(this.marqueeBox);

      // Selecionar quadros que interceptam o marquee
      controller.selectFramesInBox(this.marqueeBox);
      controller.requestRender();
    }
  }

  onPointerUp(evt, context) {
    const { controller } = context;
    const selectedFrame = controller.getSelectedFrame();

    if (this.mode === 'resizing' && selectedFrame && this.initialBox) {
      const hasChanged = (
        selectedFrame.xMm !== this.initialBox.xMm ||
        selectedFrame.yMm !== this.initialBox.yMm ||
        selectedFrame.widthMm !== this.initialBox.widthMm ||
        selectedFrame.heightMm !== this.initialBox.heightMm
      );

      if (hasChanged) {
        // Criação de comando transacional para registrar no histórico de Undo/Redo
        const finalTransform = {
          xMm: selectedFrame.xMm,
          yMm: selectedFrame.yMm,
          widthMm: selectedFrame.widthMm,
          heightMm: selectedFrame.heightMm
        };

        // Reverter temporariamente para aplicar através do comando auditável
        selectedFrame.xMm = this.initialBox.xMm;
        selectedFrame.yMm = this.initialBox.yMm;
        selectedFrame.widthMm = this.initialBox.widthMm;
        selectedFrame.heightMm = this.initialBox.heightMm;

        const cmd = new TransformFrameCommand(selectedFrame.id, finalTransform);
        controller.engine.execute(cmd);
        if (selectedFrame.type === 'text') {
          controller.engine.computeFlow();
        }
      }
    } else if (this.mode === 'moving' && selectedFrame && this.initialBox) {
      const hasChanged = (
        selectedFrame.xMm !== this.initialBox.xMm ||
        selectedFrame.yMm !== this.initialBox.yMm
      );

      if (hasChanged) {
        const finalTransform = {
          xMm: selectedFrame.xMm,
          yMm: selectedFrame.yMm
        };

        selectedFrame.xMm = this.initialBox.xMm;
        selectedFrame.yMm = this.initialBox.yMm;

        const cmd = new TransformFrameCommand(selectedFrame.id, finalTransform);
        controller.engine.execute(cmd);
      }
    } else if (this.mode === 'marquee') {
      controller.setMarquee(null);
    }

    this.mode = 'idle';
    this.activeHandle = null;
    this.initialBox = null;
    controller.setCursor('default');
    controller.requestRender();
  }

  onKeyDown(evt, context) {
    const { controller } = context;
    // Deletar com tecla Delete ou Backspace
    if (evt.key === 'Delete' || evt.key === 'Backspace') {
      const selected = controller.getSelectedFrame();
      if (selected) {
        evt.preventDefault();
        controller.engine.execute(new RemoveFrameCommand(selected.id));
        controller.clearSelection();
        controller.requestRender();
      }
    }
  }
}

class CreateFrameTool extends BaseTool {
  constructor(id, name, frameType, cursor = 'crosshair') {
    super(id, name, cursor);
    this.frameType = frameType;
    this.isCreating = false;
    this.startWorld = { x: 0, y: 0 };
    this.previewBox = null;
  }

  onPointerDown(evt, context) {
    const { world, controller } = context;
    this.isCreating = true;
    this.startWorld = { x: world.x, y: world.y };
    this.previewBox = { xMm: world.x, yMm: world.y, widthMm: 0, heightMm: 0 };
    controller.setCreationPreview(this.previewBox, this.frameType);
  }

  onPointerMove(evt, context) {
    if (!this.isCreating) return;
    const { world, controller } = context;

    let x = Math.min(this.startWorld.x, world.x);
    let y = Math.min(this.startWorld.y, world.y);
    let w = Math.abs(world.x - this.startWorld.x);
    let h = Math.abs(world.y - this.startWorld.y);

    // Shift: trava proporção 1:1 (quadrado perfeito)
    if (evt.shiftKey) {
      const size = Math.max(w, h);
      w = size;
      h = size;
      if (world.x < this.startWorld.x) x = this.startWorld.x - size;
      if (world.y < this.startWorld.y) y = this.startWorld.y - size;
    }

    this.previewBox = {
      xMm: Number(x.toFixed(3)),
      yMm: Number(y.toFixed(3)),
      widthMm: Number(w.toFixed(3)),
      heightMm: Number(h.toFixed(3))
    };

    controller.setCreationPreview(this.previewBox, this.frameType);
    controller.requestRender();
  }

  onPointerUp(evt, context) {
    if (!this.isCreating) return;
    this.isCreating = false;
    const { controller, world } = context;
    controller.setCreationPreview(null);

    const activeSpread = controller.getActiveSpread();
    if (!activeSpread) return;

    let boxW = this.previewBox ? this.previewBox.widthMm : 0;
    let boxH = this.previewBox ? this.previewBox.heightMm : 0;
    let boxX = this.previewBox ? this.previewBox.xMm : world.x;
    let boxY = this.previewBox ? this.previewBox.yMm : world.y;

    // Se o usuário deu apenas um clique (sem arrastar), cria uma caixa com tamanho padrão editorial
    if (boxW < 5.0 || boxH < 5.0) {
      boxW = (this.frameType === 'text') ? 80.0 : ((this.frameType === 'image') ? 70.0 : 60.0);
      boxH = (this.frameType === 'text') ? 50.0 : ((this.frameType === 'image') ? 50.0 : 40.0);
      boxX = Number((world.x - boxW / 2).toFixed(3));
      boxY = Number((world.y - boxH / 2).toFixed(3));
    }

    let newFrame;
    const opts = {
      name: `${this.name} ${Date.now().toString().slice(-4)}`,
      xMm: boxX,
      yMm: boxY,
      widthMm: boxW,
      heightMm: boxH
    };

      if (this.frameType === 'text') {
        newFrame = new TextFrame(opts);
        // Vincular a uma matéria padrão se houver
        const firstStory = Array.from(controller.engine.document.stories.values())[0];
        if (firstStory) {
          newFrame.storyId = firstStory.id;
        }
      } else if (this.frameType === 'image') {
        newFrame = new ImageFrame(opts);
      } else {
        newFrame = new ShapeFrame({ ...opts, fillColorSwatchId: 'swatch-paper', strokeWidthPt: 1.0 });
      }

      // Executar via AddFrameCommand
      controller.engine.execute(new AddFrameCommand(activeSpread.id, newFrame));
      if (newFrame.type === 'text') {
        controller.engine.computeFlow();
      }

      // Selecionar o novo quadro e retornar para ferramenta de seleção
      controller.selectFrame(newFrame.id);
      controller.setTool('select');

    this.previewBox = null;
    controller.requestRender();
  }
}

class PanTool extends BaseTool {
  constructor() {
    super('pan', 'Mão / Pan (H)', 'grab');
    this.isPanning = false;
    this.startScreen = { x: 0, y: 0 };
    this.initialPan = { x: 0, y: 0 };
  }

  onPointerDown(evt, context) {
    const { screen, controller } = context;
    this.isPanning = true;
    this.startScreen = { x: screen.x, y: screen.y };
    this.initialPan = { x: controller.panX, y: controller.panY };
    controller.setCursor('grabbing');
  }

  onPointerMove(evt, context) {
    if (!this.isPanning) return;
    const { screen, controller } = context;
    const dx = screen.x - this.startScreen.x;
    const dy = screen.y - this.startScreen.y;
    controller.panX = this.initialPan.x + dx;
    controller.panY = this.initialPan.y + dy;
    controller.requestRender();
  }

  onPointerUp(evt, context) {
    this.isPanning = false;
    const { controller } = context;
    controller.setCursor('grab');
  }
}

const ToolsModule = {
  BaseTool,
  SelectionTool,
  CreateFrameTool,
  PanTool,
  TextFrameTool: class extends CreateFrameTool {
    constructor() { super('text', 'Quadro de Texto (T)', 'text', 'crosshair'); }
  },
  ImageFrameTool: class extends CreateFrameTool {
    constructor() { super('image', 'Moldura de Imagem (F)', 'image', 'crosshair'); }
  },
  ShapeFrameTool: class extends CreateFrameTool {
    constructor() { super('shape', 'Retângulo / Forma (M)', 'shape', 'crosshair'); }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToolsModule;
}

if (typeof window !== 'undefined') {
  window.OpenDTPTools = ToolsModule;
}
