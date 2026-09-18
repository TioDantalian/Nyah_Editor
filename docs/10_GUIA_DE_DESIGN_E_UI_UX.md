# OpenDTP — Guia Oficial de Design, UI/UX e Design System

Este documento é a referência completa para a concepção, prototipação no **Figma** e posterior implementação de interface do **OpenDTP Studio**. Ele reúne a filosofia visual, tokens de design, especificações de componentes, iconografia e o fluxo de handoff (MCP e Tokens).

---

## 1. Filosofia Visual e Diretrizes de UX

O OpenDTP Studio é um ambiente de editoração gráfica profissional (DTP — *Desktop Publishing*). Seu design deve seguir os princípios de ferramentas de alta produtividade como Adobe InDesign, Affinity Publisher e Figma:

1. **Foco Absoluto no Conteúdo**: A área central (Canvas) e as páginas brancas do documento são o centro das atenções. A interface ao redor deve ser sóbria, neutra e discreta.
2. **Densidade de Informação Profissional**: Espaçamentos compactos e funcionais (botões de 32 a 36px, réguas de 24px, tipografia de 11 a 13px). Nada de elementos gigantes ou excesso de espaços vazios típicos de apps casuais.
3. **Tema Escuro com Contraste Calibrado (Dark Theme Default)**: Reduz o cansaço visual em longas jornadas de diagramação e faz o papel branco contrastar de forma limpa.
4. **Precisão Visual 1:1**: Bordas nítidas de 1px, alinhamentos à grade de 4px/8px e divisões métricas exatas (centímetros e milímetros).

---

## 2. Design Tokens (Especificação de Variáveis)

Estes tokens devem ser criados no Figma como **Variables / Styles** e serão espelhados no CSS (`src/ui/app.html` ou `tokens.css`):

### A. Paleta de Cores Semântica

| Token CSS | Nome no Figma | Valor Hex | Aplicação |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `Background / App` | `#0b1120` | Fundo do canvas / mesa de trabalho geral |
| `--bg-surface` | `Background / Surface` | `#0f172a` | Cabeçalho, rodapé e fundo das réguas |
| `--bg-panel` | `Background / Panel` | `#1e293b` | Barra lateral de ferramentas e painel Inspetor |
| `--bg-hover` | `Background / Hover` | `#334155` | Estado de hover de botões e itens de lista |
| `--border-subtle` | `Border / Subtle` | `#1e293b` | Linhas divisórias suaves |
| `--border-default` | `Border / Default` | `#334155` | Bordas de inputs, réguas e divisores de painel |
| `--border-focus` | `Border / Focus` | `#0284c7` | Foco de teclado e contorno de seleção ativa |
| `--accent-primary` | `Accent / Primary` | `#0284c7` | Alças de transformação, botões de ação e abas ativas |
| `--accent-cyan` | `Accent / Cyan` | `#38bdf8` | Marcador de mira das réguas, limites de folha A4 e badges |
| `--text-primary` | `Text / Primary` | `#f8fafc` | Títulos, valores ativos e rótulos principais |
| `--text-secondary` | `Text / Secondary` | `#94a3b8` | Labels de inputs, atalhos de teclado e legendas |
| `--text-muted` | `Text / Muted` | `#64748b` | Textos desabilitados, IDs técnicos e placeholders |
| `--status-error` | `Status / Error` | `#ef4444` | Alerta de transbordo tipográfico (+), exclusão |
| `--status-success` | `Status / Success` | `#4ade80` | Encaixe de texto perfeito, status de 60 FPS |

### B. Tipografia de Interface

| Nível | Família | Tamanho | Peso | Line Height | Aplicação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Header Title** | Sans-serif (Inter / System) | 13px | Semi-Bold (600) | 18px | Nome do documento e títulos de painel |
| **Body Label** | Sans-serif (Inter / System) | 11px | Medium (500) | 16px | Nomes de campos de X, Y, W, H, camadas |
| **Input Value** | Monospace / Sans-serif | 12px | Regular (400) | 16px | Valores numéricos em inputs e coordenadas |
| **Micro Tag** | Sans-serif / Mono | 9px | Bold (700) | 12px | Badges de atalhos (V, T, F, M, H), unidade (cm/mm) |

### C. Geometria, Espaçamentos e Raios

* **Grid Base**: 4px e 8px.
* **Border Radius**:
  * `0px`: Réguas, viewport do canvas e bordas de divisão de painéis.
  * `4px` (`--radius-sm`): Inputs numéricos, botões da toolbar e tags de atalho.
  * `6px` (`--radius-md`): Botões de ação do cabeçalho e cards internos.
* **Dimensões Críticas de Layout**:
  * **Barra de Ferramentas (Toolbar)**: 48px de largura; botões de 36x36px.
  * **Réguas Superior e Lateral**: 24px de altura/largura.
  * **Painel Inspetor (Direito)**: 280px a 320px de largura fixa.
  * **Cabeçalho (Header)**: 48px de altura.
  * **Rodapé (Footer / Status Bar)**: 28px de altura.

---

## 3. Especificação de Componentes para o Figma

Ao desenhar as telas no Figma, componha estes componentes com seus respectivos estados:

### 1. Botão de Ferramenta da Toolbar (`ToolButton`)
* **Tamanho**: 36 x 36 px.
* **Conteúdo**: Ícone centralizado (20x20px) + Badge de atalho (letra minúscula no canto inferior direito, 9px mono).
* **Estados**:
  * *Default*: Fundo transparente, ícone `--text-secondary` (`#94a3b8`).
  * *Hover*: Fundo `--bg-hover` (`#334155`), ícone `--text-primary`.
  * *Active (Selecionado)*: Fundo `#0284c7`, borda suave `#38bdf8`, ícone `#ffffff`.
  * *Disabled*: Opacidade 40%.

### 2. Canto e Réguas Métricas (`RulerCorner` & `RulerBar`)
* **Canto (`#ruler-corner`)**: 24 x 24 px; fundo escuro `#0f172a`; exibe `cm` ou `mm` em ciano negrito (`#38bdf8`); cursor pointer com hover sutil.
* **Réguas**: Fundo `#0f172a`; linhas de divisão em 3 alturas:
  * 1 cm (14px de altura + número)
  * 0.5 cm (8px de altura)
  * 1 mm (4px de altura)
  * Marcador de borda da folha A4 em ciano brilhante.

### 3. Painel Inspetor de Propriedades (`InspectorPanel`)
* **Bloco de Identificação**: Título da caixa selecionada + Badge do tipo (`Quadro de Texto`, `Moldura de Imagem`, `Forma`).
* **Grid de Geometria**: 2 colunas com inputs:
  * `X` e `Y` (comutável entre cm e mm)
  * `Largura` e `Altura`
* **Seção de Fluxo Tipográfico**:
  * Nome da matéria associada.
  * Contagem de linhas formatadas.
  * Indicador de Status: Verde (`Encaixe Perfeito`) ou Vermelho com ícone de alerta (`Transbordo (+)`).
* **Ação Destrutiva**: Botão sutil com fundo vermelho translúcido (`Excluir Quadro`).

### 4. Árvore de Camadas (`LayersTreePanel` — Para Desenhar no Figma)
* Lista de quadros da página:
  * Ícone do tipo (Texto, Imagem, Forma).
  * Nome do quadro com suporte a duplo clique para renomear.
  * Ícone de Visibilidade (Olho: visível / oculto).
  * Ícone de Bloqueio (Cadeado: livre / travado contra seleção).
  * Estado de item selecionado com highlight azul.

---

## 4. Guia de Ícones (Iconografia Padronizada)

Recomendamos utilizar o **Lucide Icons** (ou alternativamente **Phosphor Icons**):

| Ferramenta / Ação | Nome do Ícone no Lucide | Nome no Phosphor | Descrição de Uso |
| :--- | :--- | :--- | :--- |
| **Seleção (V)** | `mouse-pointer-2` | `cursor` | Ferramenta principal de seleção e 8 alças |
| **Quadro de Texto (T)** | `type` | `text-t` | Ferramenta de criação de caixas tipográficas |
| **Moldura de Imagem (F)** | `image-plus` / `frame` | `image` | Criação de molduras com placeholder 'X' |
| **Formas Vetoriais (M)** | `square` | `rectangle` | Retângulos e vetores |
| **Mão / Navegação (H)** | `hand` | `hand-palm` | Pan pela mesa de trabalho sem mover objetos |
| **Desfazer (Undo)** | `undo-2` | `arrow-u-up-left` | Desfazer comando anterior |
| **Refazer (Redo)** | `redo-2` | `arrow-u-up-right` | Refazer comando |
| **Zoom Fit** | `maximize-2` | `arrows-out-simple` | Enquadrar página inteira na tela |
| **Exportar PDF** | `file-down` | `file-pdf` | Botão primário de exportação pré-impressão |
| **Visibilidade** | `eye` / `eye-off` | `eye` / `eye-slash` | Mostrar/ocultar camadas |
| **Bloqueio** | `lock` / `unlock` | `lock-simple` | Travar/destravar camadas contra edição |
| **Excluir** | `trash-2` | `trash` | Remover quadro selecionado |

* **Parâmetros Técnicos de Ícones**:
  * Grid base do ícone: 24 x 24 px (ferramentas) e 32 x 32 px (cursores).
  * Espessura de traço (*Stroke width*): 1.75px a 2px.
  * Cor do traço: Herdar via CSS (`currentColor`).

### C. Ícone Guia Exclusivo: `Mouse_Click_Final` (Ponteiro & Seleção)
* **Origem**: Figma File `"DTP"`, Node `2:332` (`Mouse_Click_Final`).
* **Especificação Técnica**:
  * Forma vetorial híbrida: Sombra de extrusão sólida preta (`#000000`) sobreposta ao corpo principal branco (`#ffffff`) com contorno de 3px e junções arredondadas (`round`).
  * **Hotspot Calibrado**: Vértice de impacto cirúrgico em $(X: 10\text{px}, Y: 1\text{px})$ no grid $32\times 32\text{ px}$.
  * **Destinos Oficiais**:
    1. Cursor do Canvas (modo Seleção `V`): Data URI SVG embutido.
    2. Ícone da Barra de Ferramentas: Versão vetorial adaptada para $20\times 20\text{ px}$ com resposta de cor dinâmica (`#94a3b8` inativo, `#38bdf8` / `#ffffff` ativo com sombra neon).
  * **Arquivos-Mestre Salvos**:
    * Vector SVG: [`docs/mouse_click_final.svg`](file:///c:/Users/Ryzen/Desktop/teste/SOFTWARE%20DTP/docs/mouse_click_final.svg)
    * Cursor 32px: [`docs/mouse_click_cursor_32.svg`](file:///c:/Users/Ryzen/Desktop/teste/SOFTWARE%20DTP/docs/mouse_click_cursor_32.svg)
    * Toolbar 20px: [`docs/mouse_click_icon_20.svg`](file:///c:/Users/Ryzen/Desktop/teste/SOFTWARE%20DTP/docs/mouse_click_icon_20.svg)

---

## 5. Como Funciona o Handoff Figma → OpenDTP Studio

Quando você concluir ou iterar os desenhos no Figma, temos 3 caminhos complementares para absorver as alterações:

```
┌────────────────────────────────────────────────────────┐
│                   SEU DESIGN NO FIGMA                  │
│       (Cores, Ícones Lucide, Toolbar, Inspetor)        │
└───────────┬────────────────────┬───────────────────┬───┘
            │                    │                   │
            ▼                    ▼                   ▼
    ┌───────────────┐    ┌───────────────┐   ┌───────────────┐
    │  1. DESIGN    │    │  2. FIGMA MCP │   │ 3. SCREENSHOT │
    │    TOKENS     │    │    SERVER     │   │   MULTIMODAL  │
    │  (tokens.css) │    │  (API REST)   │   │  (PNG / SVG)  │
    └───────┬───────┘    └───────┬───────┘   └───────┬───────┘
            │                    │                   │
            └────────────────────┼───────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │    AGENTE AI (ANTIGRAVITY)    │
                 │  Aplica cores, ícones e CSS   │
                 │  mantendo 100% da lógica DTP  │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │     OPENDTP STUDIO PRONTO     │
                 │     (Navegador Web e Tauri)   │
                 └───────────────────────────────┘
```

1. **Caminho dos Tokens (`tokens.css`)**:
   * Exporte as variáveis do Figma como CSS. Eu simplesmente substituo os valores no `app.html`, e todo o estúdio adota suas cores e espaçamentos instantaneamente.
2. **Caminho do Figma MCP (Já configurado em `mcp_config.json`)**:
   * Com o seu token do Figma ativo, basta me fornecer o link do frame no Figma. Eu consulto a árvore de nós pela API do MCP e reproduzo o layout exato.
3. **Caminho Visual (Screenshot / SVG)**:
   * Cole uma captura da prancheta no chat. Eu faço a inspeção visual dos contrastes e pesos para afinar o CSS.
