# 01. Estudo de Mercado e Diagnóstico

## O Vazio Arquitetural da Editoração Digital

O mercado de software de publicação de mesa (*Desktop Publishing* - DTP) sofre de uma estagnação tecnológica de quase duas décadas. Enquanto ferramentas de desenvolvimento de software, design de interfaces e modelagem 3D evoluíram dramaticamente para stacks reativas, colaborativas e abertas, o design editorial permaneceu fragmentado em dois extremos incompatíveis:

1. **Extremo Puramente Visual e Fechado (Adobe InDesign / Affinity Publisher)**
2. **Extremo Puramente Declarativo / Código (LaTeX / Typst / Motores CLI)**

---

## Análise Detalhada dos Players Existentes

### 1. Adobe InDesign
* **Natureza:** Comercial (Assinatura mensal/anual - Adobe Creative Cloud).
* **Pontos Fortes:**
  * É o padrão incontestável da indústria gráfica e editorial.
  * Suporte robusto a *Threaded Text Frames* (texto contínuo entre páginas).
  * Controle minucioso de microtipografia (Optical Margin Alignment, kerning métrico e óptico).
  * Gestão profissional de cores (CMYK, Pantone, separações de cor, perfis ICC, PDF/X-1a e PDF/X-4).
  * Scriptabilidade madura através de ExtendScript e UXP.
* **Gargalos e Dores:**
  * Monopólio com custo abusivo de assinatura perpétua.
  * Base de código herdada dos anos 90 em C++, com débito técnico acumulado de mais de 30 anos.
  * Formato de arquivo binário fechado (`.indd`), impossível de inspecionar com diff ou versionar no Git.
  * Performance pesada e inicialização lenta.

---

### 2. Scribus
* **Natureza:** Open Source (GPL).
* **Pontos Fortes:**
  * É a única alternativa aberta histórica que possui a arquitetura correta de um DTP tradicional.
  * Suporta páginas-mestre (*master pages*), caixas vinculadas e normas de pré-impressão (PDF/X).
  * Possui API interna em Python (`import scribus`), permitindo automação de layout por scripts.
* **Gargalos e Dores:**
  * Interface gráfica construída em Qt antigo, com ergonomia visual dos anos 2000.
  * Experiência de usuário (UX) ruidosa, cheia de janelas modais e atritos constantes.
  * Renderização de tela pesada ao lidar com centenas de páginas contendo vetores e bitmaps.
  * Dificuldade extrema da comunidade em refatorar a base legada monolítica em C++.

---

### 3. Penpot
* **Natureza:** Open Source (MPL 2.0).
* **Pontos Fortes:**
  * Stack moderníssima baseada em padrões abertos da web e SVG nativo.
  * Canvas interativo excepcional (nível Figma), com aceleração e manipulação vetorial perfeita.
  * Totalmente programável via API REST, Webhooks e sistema de Plugins em TypeScript/JavaScript.
* **Por que tentar adaptá-lo via Plugins é um erro arquitetural:**
  * **Modelo mental de UI, não de DTP:** O Penpot enxerga o mundo como pranchetas (*Boards*) isoladas. Não existe o conceito de um texto que flui de um *Board* para o próximo de forma reativa e bidirecional a 60 FPS.
  * **Falta de estrutura de livro:** Sem suporte nativo a páginas espelhadas (*facing pages* com margem interna de encadernação), cabeçalhos dinâmicos baseados no capítulo e numeração automática vinculada ao documento.
  * **Pré-impressão:** Não possui pipeline nativo de cores CMYK para saída industrial de gráfica.
  * **Barreira do Core:** O núcleo é em Clojure/ClojureScript, o que afasta a vasta maioria de desenvolvedores que gostariam de contribuir com TypeScript/Rust/Python.

---

### 4. Typst
* **Natureza:** Open Source (Apache 2.0).
* **Pontos Fortes:**
  * Construído na melhor stack moderna possível para renderização: **Rust** com compilação instantânea e suporte a WebAssembly (WASM).
  * O ecossistema que mais cresce no GitHub como substituto moderno do LaTeX.
  * Totalmente programável, determinístico e com renderização de fontes de nível cirúrgico.
* **Por que não atende revistas como aplicativo final:**
  * É 100% focado em código declarativo.
  * Não possui canvas visual interativo para arrastar, rotacionar, alinhar visualmente e experimentar diagramação gráfica livre.
* **O Pulo do Gato Estratégico:**
  * O Typst **não deve ser visto como um concorrente a ser reescrito**, mas como o **candidato ideal para ser o kernel de tipografia embutido** do novo software.

---

## O Panorama dos SDKs e Primitivas de Canvas (Setembro/2026)

Um ponto crítico é entender o que existe para a camada de canvas e o risco das licenças comerciais:

### 1. O Caso `tldraw` (A Armadilha de Licenciamento)
* O `tldraw` é hoje o SDK de canvas infinito mais polido tecnicamente (usado por Replit, Shopify, etc.).
* **Por que descartar:** A partir da versão 5.1+, o uso em produção exige chave de licença comercial proprietária e mantém marca d'água forçada (*"Made with tldraw"*). Construir um software de DTP livre em cima de um SDK proprietário criaria um bloqueador comercial imediato. Além disso, ele herda a mesma limitação estrutural do Penpot: shapes soltos num plano infinito, sem qualquer semântica de página de livro.

### 2. Primitivas 100% Abertas e Livres (Licença MIT Puro)
Para a camada de canvas visual, existem bibliotecas maduras, livres de royalties, marcas d'água ou restrições de produção:

| Biblioteca | Licença | Características e Utilidade para DTP |
| :--- | :---: | :--- |
| **Konva.js** | **MIT** | Renderização por camadas (*layers*), cache de formas, manipulação nativa via `Transformer` (resize, rotate, scale interativo com alças visuais) e serialização direta via `toJSON()` / `Konva.Node.create()`. Encaixa de forma quase natural com o formato JSON de projeto. |
| **PixiJS** | **MIT** | Motor WebGL 2D acelerado por GPU de altíssima performance. Excelente se o foco for velocidade bruta de viewport com centenas de páginas abertas. |
| **Fabric.js** | **MIT** | Framework veterano de canvas 2D, muito usado em web-to-print simples, mas com arquitetura de eventos mais pesada que o Konva. |
| **Paper.js** | **MIT** | Foco em matemática vetorial pura, curvas Bézier e operações booleanas em caminhos vetoriais (essencial para o cálculo de recortes e *text wrap* avançado). |

---

## A Pergunta Central: Construir vs. Costurar

A chave do projeto não é escolher cegamente "construir tudo do zero" nem "costurar tudo de terceiros", mas aplicar uma **matriz de decisão pragmática camada por camada**:

| Camada do Software | Construir ou Costurar? | Justificativa Estratégica |
| :--- | :---: | :--- |
| **Canvas / Modelo de DTP** | **Construir** (sobre primitiva livre) | Nenhuma biblioteca no mundo possui o modelo semântico de *Spreads*, *Master Pages* e *Threaded Frames*. Usar primitivas MIT (Konva/Pixi) para desenho/interação, mas construir a lógica editorial própria. |
| **Motor Tipográfico** | **Costurar (Embutir Typst)** | **Não reinventar a roda.** O Typst (Apache 2.0 / Rust) já resolveu *shaping* com HarfBuzz, hifenização, quebra ótima e renderização com qualidade de produção. Embutir o compilador do Typst como kernel poupa 3 a 5 anos de desenvolvimento árduo. |
| **Exportação PDF / Gráfica** | **Costurar** | Usar crates e bibliotecas consolidadas da indústria (`pdf-writer`, `printpdf`, `lcms2` para conversão de perfis ICC). |
