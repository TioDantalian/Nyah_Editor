# 03. Desafios Técnicos e Pontos de Atenção (Riscos de P&D)

> **"Pensar com muita calma antes de codificar"**  
> Este documento analisa as armadilhas matemáticas, computacionais e gráficas que costumam inviabilizar projetos de DTP e define estratégias pragmáticas para contorná-las.

---

## 1. O Mito do Knuth-Plass Global Através de Múltiplos Frames

Um dos maiores riscos conceituais de um projeto de DTP é assumir que o algoritmo de quebra de parágrafo ótimo (Knuth-Plass) pode ser aplicado cegamente de forma "global" através de uma cadeia inteira de caixas de texto vinculadas (*Threaded Frames*).

### Por que isso é matematicamente complexo?
1. **Premissa Original:** O algoritmo de Knuth-Plass original do TeX foi formulado sob a premissa de uma **coluna de largura fixa e constante $w$**.
2. **A Realidade Editorial de Revistas:**
   * O `Frame 1` pode ter 120 mm de largura na página esquerda.
   * O `Frame 2` pode ser dividido em duas colunas de 45 mm na página direita.
   * Pode haver uma imagem no meio do caminho com *Text Wrap*, fazendo com que a largura disponível mude linha por linha ($w_1, w_2, w_3 \dots$).
3. **Explosão Combinatória:** Se tentarmos calcular a penalidade estética mínima de 10 páginas de uma só vez considerando geometrias variáveis e contornos de imagem que dependem de onde a linha quebrou, o espaço de busca se torna não-polinomial e impossível de rodar a 60 FPS no canvas interativo.

### Como a Indústria Resolve (A Abordagem do InDesign)
* **Nem o Adobe InDesign faz otimização global unificada entre múltiplos frames heterogêneos.**
* O InDesign adota uma abordagem híbrida:
  1. A otimização de quebra de parágrafo (*Adobe Paragraph Composer*) é calculada **localmente dentro do frame corrente**.
  2. Quando a capacidade vertical do frame é atingida, o texto restante é cortado na última quebra de linha válida e injetado como entrada no início do próximo frame (*Greedy Pass-Forward com Otimização Local de Parágrafo*).
* **Decisão Pragmática para Nosso Projeto:**
  * Não tentar inventar um solver global de múltiplos frames na v0.1.
  * Fazer a quebra com otimização local dentro dos limites do frame atual, repassando o overflow de forma sequencial para o frame seguinte.

---

## 2. Caixas Livres e Text Wrap: O Método Scanline Slicing (SVG & Bitmaps)

Você tocou no coração do design editorial expressivo: **o texto não pode ficar preso a retângulos**. Ele precisa:
* Correr dentro de formas arbitrárias (um molde SVG, um círculo, um polígono Bézier).
* Desviar de silhuetas de imagens (uma foto PNG com fundo transparente ou uma máscara vetorial).

### A Limitação do Typst e a Lição do Pacote `meander`
* O Typst puro foi feito para caixas e blocos retangulares. A comunidade criou o pacote `meander` para tentar contornar imagens, mas o pacote sofre com consumo de memória e lentidão porque tenta fazer geometria analítica dentro dos scripts do Typst.
* **A Solução:** O motor gráfico em **Rust** deve resolver a geometria antes de entregar para a tipografia.

### A Matemática da Decomposição por Linhas de Varredura (Scanline):
Para qualquer forma arbitrária (molde SVG ou silhueta bitmap):
1. Definimos a altura de linha $H_{line}$ (baseada no tamanho da fonte + entrelinha/leading).
2. Para cada linha vertical $Y_i$, traçamos um raio horizontal de varredura (*scanline*):
   * Se for um **molde SVG fechado**: calculamos os pontos de entrada e saída do raio no polígono, gerando o intervalo utilizável $[X_{start}, X_{end}]$.
   * Se for um **contorno de imagem PNG (Text Wrap)**: lemos os pixels do canal alfa (ou o contorno vetorial da imagem) e subtraímos essa área da caixa de texto:
     $$\text{Espaço Útil}(Y_i) = [\text{Caixa}_{X1}, \text{Caixa}_{X2}] \setminus \text{Silhueta}(Y_i)$$
3. O resultado entregue para o motor de texto é simplesmente um array leve de fatias:
   ```rust
   struct LineSlot {
       y: f32,
       height: f32,
       segments: Vec<(f32, f32)>, // Lista de intervalos (x_inicio, x_fim) utilizáveis
   }
   ```
4. O motor tipográfico preenche as palavras respeitando a largura de cada segmento.

---

## 3. Desempenho do Canvas em Documentos Longos (100 a 500 Páginas)

Se um documento de 300 páginas tentar manter todos os nós e texturas ativos no canvas simultaneamente, a memória do navegador atingirá gigabytes e o aplicativo travará.

### Estratégias Mandatórias de Engenharia:
1. **Virtualização de Viewport (Viewport Culling):**
   * O Konva.js / PixiJS deve renderizar estritamente os objetos que interceptam as coordenadas da tela visível no momento, acrescido de uma margem de segurança de um *spread* adjacente.
   * Páginas fora da visão têm sua renderização suspensa (`node.hide()`), mantendo apenas a estrutura semântica em memória.
2. **Gerenciamento de Imagens: Proxies vs. Alta Resolução:**
   * O software gera em background uma imagem proxy de visualização rápida em 72 DPI (WebP/JPEG leve) para exibição e movimentação fluida no canvas. A imagem original pesada só é lida no momento da exportação para PDF de alta fidelidade.
3. **Visão de Grade (Pages Overview):**
   * Ao afastar o zoom para ver o livro inteiro em miniaturas, o aplicativo desativa o motor de texto e desenha um bitmap pré-renderizado (*thumbnail* cacheado) de cada página.

---

## 4. Pré-Impressão e CMYK: Da Tela para a Gráfica Industrial

A transição da tela (sRGB) para o papel impresso (CMYK Offset) é repleta de requisitos de conformidade industrial:

1. **Sangria (Bleed):**
   * Elementos encostados na borda precisam ultrapassar os limites da página em 3 mm a 5 mm. O canvas precisa exibir visualmente a linha de corte (*trim line*) e a linha de sangria (*bleed line*).
2. **Espaço de Cores e Perfis ICC:**
   * Impressões comerciais exigem conversão controlada via perfis padrão (`ISO Coated v2`, `FOGRA39`, `SWOP`).
   * A integração do **LittleCMS (`lcms2`)** via Rust garante conversões colorimétricas exatas para a exportação em PDF/X.
3. **Escopo Realista:**
   * Na versão inicial (v0.1), focar em **PDF vetorial nítido em sRGB** com marcas de corte e sangria.
   * Suporte completo a PDF/X-1a e separação de canais CMYK deve ser uma meta de versões intermediárias (v0.3+).
