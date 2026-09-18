# 08. Sistema de Ferramentas e Canvas Interativo

> **Especificação da Camada de Apresentação e Interação (Q2 do MVP)**  
> Integração entre o motor editorial (`OpenDTPEngine`), a pilha de comandos transacionais (`Commands`) e a superfície de manipulação direta via ponteiro.

---

## 1. Visão Geral da Arquitetura de Interação

O OpenDTP adota o modelo de **Manipulação Direta com Mutações Transacionais**. Toda e qualquer alteração realizada pelo usuário no canvas visual segue um ciclo estrito que preserva a pureza dos dados e o histórico de ações:

```
[ Usuário: Mouse / Pointer ]
            │
            ▼
┌───────────────────────────────────────┐
│     InteractionManager / Canvas       │ ──> Converte Screen (px) <-> World (mm)
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│       Ferramenta Ativa (Tool)         │ ──> SelectionTool / TextFrameTool / etc.
└───────────────────┬───────────────────┘
                    │ (arrasto em tempo real a 60 FPS)
                    ├───> Atualiza coordenadas visuais transitórias
                    │
                    ▼ (no PointerUp)
┌───────────────────────────────────────┐
│       Comando Transacional            │ ──> AddFrameCommand / TransformFrameCommand
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│         OpenDTPEngine (Core)          │ ──> Registra no Undo/Redo & Notifica 'change'
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│       Recalcula Fluxo & Redesenha     │ ──> FlowEngine / Viewport Render Loop
└───────────────────────────────────────┘
```

---

## 2. A Geometria das 8 Alças Cardeais de Transformação

Quando um ou mais elementos gráficos estão selecionados, a ferramenta de seleção projeta um **Bounding Box Orientado** contornado com 8 alças quadradas brancas com contorno na cor de destaque da camada.

```
(NW) ┌─────── (N) ───────┐ (NE)
     │                   │
 (W) │      QUADRO       │ (E)
     │                   │
(SW) └─────── (S) ───────┘ (SE)
```

### 2.1. Matriz de Comportamento e Liberdade Direcional

| Alça | ID | Âncora Fixa Oposta | Propriedades Afetadas | Cursor CSS | Modificador Shift | Modificador Alt |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Noroeste** | `nw` | Canto SE $(x+w, y+h)$ | $x, y, w, h$ | `nwse-resize` | Trava Proporção $W/H$ | Expansão Simétrica pelo Centro |
| **Norte** | `n` | Borda Sul $(y+h)$ | $y, h$ | `ns-resize` | Apenas vertical | Expansão Simétrica pelo Centro |
| **Nordeste** | `ne` | Canto SW $(x, y+h)$ | $y, w, h$ | `nesw-resize` | Trava Proporção $W/H$ | Expansão Simétrica pelo Centro |
| **Leste** | `e` | Borda Oeste $(x)$ | $w$ | `ew-resize` | Apenas horizontal | Expansão Simétrica pelo Centro |
| **Sudeste** | `se` | Canto NW $(x, y)$ | $w, h$ | `nwse-resize` | Trava Proporção $W/H$ | Expansão Simétrica pelo Centro |
| **Sul** | `s` | Borda Norte $(y)$ | $h$ | `ns-resize` | Apenas vertical | Expansão Simétrica pelo Centro |
| **Sudoeste** | `sw` | Canto NE $(x+w, y)$ | $x, w, h$ | `nesw-resize` | Trava Proporção $W/H$ | Expansão Simétrica pelo Centro |
| **Oeste** | `w` | Borda Leste $(x+w)$ | $x, w$ | `ew-resize` | Apenas horizontal | Expansão Simétrica pelo Centro |

---

## 3. Regras Físicas e Restrições de Manipulação

1. **Mínimo Dimensional Inviolável ($W_{min}, H_{min}$):**
   - $W \ge 5.0\text{ mm}$
   - $H \ge 5.0\text{ mm}$
   - Nenhuma alça pode empurrar a dimensão para valores negativos ou zero, eliminando o efeito indesejado de inversão acidental de quadros editoriais.
2. **Projeção Subpixel e Anti-Aliasing:**
   - As alças mantêm dimensão visual constante na tela (tamanho fixo de 8x8 pixels em coordenadas de viewport), independentemente do nível de zoom aplicado (25% a 800%).
3. **Área de Captura Aumentada (Hit Target):**
   - Para conforto ergonômico, a área de clique de cada alça é expandida para um raio de tolerância de 12px ao redor do centro da alça.

---

## 4. Ferramentas Primárias de DTP e Teclas de Atalho

| Ferramenta | Atalho | Ícone DTP | Ação Primária no Canvas |
| :--- | :---: | :---: | :--- |
| **Seleção** | `V` | Seta Preta | Clica para selecionar; arrasta para mover; manipula pelas 8 alças; arrasta no vazio para seleção em área (*Marquee*). |
| **Quadro de Texto** | `T` | Letra T | Clica e arrasta para criar caixa de texto com preenchimento de fluxo tipográfico automático. |
| **Quadro de Imagem** | `F` | Retângulo com "X" | Clica e arrasta para criar moldura gráfica com indicação transversal de placeholder para importação de fotos/vetores. |
| **Quadro de Forma** | `M` | Retângulo Sólido | Clica e arrasta para criar formas geométricas vetoriais de diagramação (caixas de destaque, filetes e fundos). |
| **Mão / Pan** | `H` ou `Espaço` | Mão | Arrasta para navegar livremente pela mesa de trabalho e páginas duplas (*Spreads*). |

---

## 5. Fluxo de Vida do Histórico Transacional (Undo / Redo)

```text
[ MouseDown ]  ──> Salva estado inicial { x, y, width, height }
[ MouseMove ]  ──> Atualiza visualmente o quadro em tempo real (60 FPS)
[ MouseUp ]    ──> Se houver alteração:
                     history.execute(new TransformFrameCommand(frameId, novoEstado))
                   Permite Ctrl+Z desfazer toda a transformação em 1 passo!
```
