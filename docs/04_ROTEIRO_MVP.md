# 04. Roteiro Prático e Cronograma Realista do MVP

> **Revisão Estratégica de Escopo e Prazos**  
> A estimativa inicial ingênua de "8 semanas" foi ajustada para uma escala realista de **Trimestres (Quarters)**, combinada com um corte cirúrgico de escopo e a estratégia de **costurar o kernel do Typst** em vez de reescrever um motor tipográfico do zero.

---

## Estratégia de Escopo Mínimo Viável (Corte Cirúrgico da v0.1)

Para viabilizar o lançamento funcional sem anos de atraso:
* **O que ENTRA na v0.1:**
  * Canvas com páginas duplas (*Spreads*) e réguas em milímetros (Konva.js / MIT).
  * Manipulação livre de blocos: texto, imagens (bitmaps) e vetores (SVG).
  * Fluxo de texto contínuo entre frames encadeados (usando o compilador Typst embutido).
  * Formato de projeto aberto em pastas JSON amigável ao Git.
  * Exportação para PDF vetorial nítido (espaço sRGB) com sangria de 3 mm e marcas de corte.
  * Aplicativo desktop nativo multiplataforma (Tauri v2).
* **O que FICA PARA a v0.2 / v0.3:**
  * Suporte estrito a CMYK industrial e conformidade PDF/X-1a via LittleCMS (adiado para v0.2).
  * Contorno de texto (*Text Wrap*) por canal alfa de imagens ou curvas Bézier complexas (adiado para v0.3).
  * Colaboração em tempo real na nuvem (adiado para v1.0).

---

## Cronograma Realista por Trimestres (Para 1 a 2 Desenvolvedores)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│       Q1        │ ──> │       Q2        │ ──> │       Q3        │ ──> │       Q4        │
│ Spike Técnico:  │     │ Canvas DTP com  │     │ CLI Headless,   │     │ Alpha Público:  │
│ Typst + Frames  │     │ Konva.js (MIT)  │     │ PDF Vetorial e  │     │ Polimento UX e  │
│ em Rust/WASM    │     │ & Réguas mm     │     │ Tauri Desktop   │     │ Lançamento v0.1 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

### Trimestre 1 (Q1): O Kernel de Layout & O Fatiador de Frames (Spike Técnico)
* **Objetivo:** Provar a integração entre o compilador do Typst e o modelo de caixas vinculadas.
* **Entregas:**
  1. Compilar o core do Typst como biblioteca Rust e gerar bindings WASM para o frontend.
  2. Implementar o algoritmo de fatiamento (*Frame Slicer*):
     * O Typst formata o texto com tipografia perfeita (hifenização, kerning e ligaduras).
     * O fatiador calcula o corte vertical no ponto exato em que a `Caixa 1` enche e despeja o excedente na `Caixa 2`.
  3. Definir a especificação inicial do `project.json` e `spread.json`.

---

### Trimestre 2 (Q2): O Canvas DTP com Primitiva Livre (Konva.js)
* **Objetivo:** Ter um ambiente gráfico interativo sólido, sem reinventar a roda gráfica.
* **Entregas:**
  1. Configurar o Konva.js com arquitetura de camadas (*Layers*): Fundo da Página, Guias, Conteúdo, Alças de Seleção.
  2. Implementar as páginas duplas (*Facing Pages*) com réguas milimétricas sincronizadas ao zoom (25% a 800%).
  3. Integração do `Transformer` nativo do Konva para seleção múltipla, arrastar, redimensionar com proporção e rotacionar.
  4. Suporte a importação de:
     * Bitmaps (JPEG, PNG, WebP) com geração automática de proxies leves em 72 DPI.
     * Vetores SVG com renderização nítida.
  5. Virtualização básica de viewport para manter 60 FPS com dezenas de páginas.

---

### Trimestre 3 (Q3): Exportação PDF, CLI Headless e Shell Tauri v2
* **Objetivo:** Fechar o ciclo completo do documento (criar -> editar -> salvar em JSON -> exportar para PDF impresso).
* **Entregas:**
  1. **Motor de Exportação:**
     * Integrar `pdf-writer` em Rust para gerar PDFs vetoriais diretos, sem rasterizar textos.
     * Renderização precisa de marcas de corte (*crop marks*) e sangria (*bleed*) de 3 mm.
  2. **CLI Headless:**
     * Comando de terminal executável:
       ```bash
       dtp-engine render ./meu-livro -o saida.pdf --bleed 3mm
       ```
  3. **Shell Desktop Tauri v2:**
     * Empacotar a aplicação em instaladores nativos para Windows (.msi/.exe), macOS (.dmg) e Linux (.deb/AppImage).
     * Gerenciamento de arquivos nativo (`Ctrl+S`, `Ctrl+O`, salvar projeto em pasta).

---

### Trimestre 4 (Q4): Páginas-Mestre, Polimento de UX e Lançamento Alpha v0.1
* **Objetivo:** Transformar o protótipo técnico em um produto que designers independentes possam usar e validar no mundo real.
* **Entregas:**
  1. Sistema de Páginas-Mestre básicas (templates herdados com cabeçalho e numeração dinâmica de página).
  2. Painel lateral de propriedades (estilos de texto, cores, geometria milimétrica).
  3. Criação de landing page, documentação do schema JSON e repositório público no GitHub com licença permissiva.
  4. Lançamento da versão **Alpha v0.1** para comunidades de tipografia e design de código aberto.
