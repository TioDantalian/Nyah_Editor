# Nyah Editor — Software de Editoração Gráfica & DTP Aberto

> **Ambiente editorial profissional, visual e moderno para publicação digital e pré-impressão.**  
> *Antigo OpenDTP — Integrado ao ecossistema Nyah.*

---

## 📖 Sobre o Nyah Editor

O **Nyah Editor** é um software de **Desktop Publishing (DTP)** moderno, aberto e visualmente reativo, projetado para preencher a lacuna entre ferramentas tradicionais pesadas e ecossistemas fechados (como InDesign e Affinity) e o desenvolvimento aberto orientado a dados e versionável no Git.

Com uma arquitetura desacoplada e modular, o Nyah Editor oferece:
- **DOM Editorial Estruturado**: Documentos organizados em Spreads (páginas duplas), Páginas (Recto/Verso), Quadros de Conteúdo (Texto, Imagens e Formas Vetoriais) e Matérias (*Stories*).
- **Fatiamento & Fluxo Tipográfico**: Encadeamento reativo de texto entre múltiplos quadros (*Text Threading*) com suporte a hifenização silábica dinâmica.
- **Espaço de Trabalho Visual (Konva.js)**: Manipulação direta em canvas a 60 FPS com 8 alças cardeais analíticas (`NW`, `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`), restrições dimensionais e modificadores (`Shift` para proporção e `Alt` a partir do centro).
- **Máquina de Comandos Transacionais (Undo/Redo)**: Histórico completo via Command Pattern com serialização JSON determinística.
- **Compilador PDF Vetorial Puro (ISO 32000-1)**: Geração de PDFs de pré-impressão de alta fidelidade sem dependências binárias nativas pesadas, com marcas de corte, marcas de registro e cálculo milimétrico de sangria (*bleed*).

---

## 🚀 Como Iniciar

### Pré-requisitos
- **Node.js** (v18 ou superior recomendado). Nenhuma dependência externa pesada necessária (motor e servidor nativos).

### Executar o Nyah Editor Studio
Inicia o servidor local integrado e abre a interface gráfica no navegador padrão:
```bash
npm run studio
```
Ou acesse diretamente: `http://localhost:3000/`

Para abrir o arquivo HTML diretamente no navegador:
```bash
npm run studio:file
```

---

## 🧪 Testes Automatizados

O motor do Nyah Editor possui 100% de cobertura nos pilares centrais de arquitetura e manipulação interativa:

```bash
# Executar todos os testes
npm run test:all

# Testes de arquitetura do documento e compilador PDF
npm test

# Testes das 8 alças cardeais e ferramentas interativas
npm run test:tools
```

### Spikes Técnicos de Validação
```bash
npm run spike:1   # Fatiamento livre de texto
npm run spike:2   # Reatividade de canvas
npm run spike:3   # Teste de carga de 100 páginas com Viewport Culling
npm run spike:4   # Benchmark de precisão submétrica Canvas-to-PDF
```

---

## 📂 Estrutura do Projeto

```text
Nyah_Editor/
├── README.md               # Este arquivo de referência
├── package.json            # Scripts de execução e testes
├── docs/                   # Documentação estratégica, técnica e design system
│   ├── 01_ESTUDO_DE_MERCADO_E_DIAGNOSTICO.md
│   ├── 02_ARQUITETURA_DO_SOFTWARE.md
│   ├── 03_DESAFIOS_TECNICOS_E_PONTOS_DE_ATENCAO.md
│   ├── 04_ROTEIRO_MVP.md
│   ├── 05_MODELO_DE_NEGOCIO_E_SUSTENTABILIDADE.md
│   ├── 06_SPIKES_E_TESTES_FUNDAMENTAIS.md
│   ├── 07_VALIDACAO_PARAMETROS_DA_INDUSTRIA.md
│   ├── 08_SISTEMA_DE_FERRAMENTAS_E_CANVAS_INTERATIVO.md
│   ├── 09_DESIGN_SYSTEM_FIGMA_E_MCP.md
│   └── 10_GUIA_DE_DESIGN_E_UI_UX.md
├── src/                    # Código-fonte oficial do Nyah Editor
│   ├── core/               # Motor editorial, tipografia, comandos e emissão de PDF
│   │   ├── commands.js     # Máquina de Undo/Redo e Command Pattern
│   │   ├── document.js     # DOM editorial (Spread, Page, Frame, Story)
│   │   ├── engine.js       # Orquestrador editorial (OpenDTPEngine)
│   │   ├── hyphenator.js   # Hifenização silábica dinâmica
│   │   ├── pdf.js          # Compilador PDF vetorial ISO 32000-1
│   │   ├── schema.js       # Schemas JSON, validação e sangria
│   │   ├── slicer.js       # GeometryEngine, FlowEngine & alinhamento
│   │   ├── spatial.js      # Indexador espacial e bounding boxes
│   │   ├── styles.js       # Gestão de estilos tipográficos
│   │   └── units.js        # Conversões métricas analíticas (mm, pt, px)
│   ├── ui/                 # Interface interativa gráfica
│   │   ├── transform_handles.js # Matemática das 8 alças cardeais
│   │   ├── tools.js        # Ferramentas: Seleção (V), Texto (T), Imagem (F), Forma (M), Pan (H)
│   │   ├── canvas.js       # Controlador do canvas, viewport e render loop
│   │   ├── app.html        # Interface de estúdio DTP
│   │   └── app.js          # Orquestração do estúdio e integração com motor
│   └── server.js           # Servidor HTTP local zero-dependency
├── samples/                # Ativos e amostras reais de teste
├── spikes/                 # Protótipos experimentais isolados
└── test/                   # Suíte de testes automatizados
    ├── engine.test.js      # Validação do core engine e emissão PDF
    └── interactive_tools.test.js # Validação das alças e ferramentas
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
