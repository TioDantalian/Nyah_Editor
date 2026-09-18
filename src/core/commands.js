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
