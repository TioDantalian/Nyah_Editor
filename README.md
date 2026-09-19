# Nyah Editor — O Software de DTP Aberto, Moderno e Visual

> **Repositório de Pesquisa, Engenharia e Desenvolvimento do Nyah Editor** (antigo OpenDTP)  
> Localização: `F:\01_SOFTWARES_E_APPS\Nyah_Editor`  
> Revisão: Setembro de 2026

---

## 📂 Estrutura do Workspace

```text
Nyah_Editor/
├── README.md               # Visão geral do workspace e guia de início
├── package.json            # Scripts de execução e testes
├── docs/                   # Toda a documentação estratégica e técnica
│   ├── 01_ESTUDO_DE_MERCADO_E_DIAGNOSTICO.md
│   ├── 02_ARQUITETURA_DO_SOFTWARE.md
│   ├── 03_DESAFIOS_TECNICOS_E_PONTOS_DE_ATENCAO.md
│   ├── 04_ROTEIRO_MVP.md
│   ├── 05_MODELO_DE_NEGOCIO_E_SUSTENTABILIDADE.md
│   ├── 06_SPIKES_E_TESTES_FUNDAMENTAIS.md
│   ├── 07_VALIDACAO_PARAMETROS_DA_INDUSTRIA.md
│   └── 08_SISTEMA_DE_FERRAMENTAS_E_CANVAS_INTERATIVO.md
├── src/                    # Código-fonte oficial do OpenDTP
│   ├── core/               # Motor de documento, fatiamento, comandos e PDF
│   │   ├── commands.js     # Máquina de Undo/Redo e Command Pattern
│   │   ├── document.js     # DOM editorial (Spread, Page, Frame, Story)
│   │   ├── engine.js       # Orquestrador OpenDTPEngine
│   │   ├── hyphenator.js   # Hifenização silábica dinâmica
│   │   ├── pdf.js          # Compilador PDF vetorial ISO 32000-1
│   │   ├── schema.js       # Schemas JSON, validação e sangria
│   │   ├── slicer.js       # GeometryEngine, FlowEngine & Alinhamento
│   │   ├── spatial.js      # Indexador espacial e Bounding Boxes
│   │   ├── styles.js       # Gestão de estilos de caractere e parágrafo
│   │   └── units.js        # Conversões métricas (mm, pt, px)
│   └── ui/                 # Interface interativa e manipulação visual
│       ├── transform_handles.js # Matemática analítica das 8 alças cardeais
│       ├── tools.js        # Ferramentas: Seleção (V), Texto (T), Imagem (F), Forma (M), Pan (H)
│       ├── canvas.js       # Controlador do canvas, viewport e render loop
│       ├── app.html        # Estúdio gráfico interativo completo
│       └── app.js          # Inicialização e binding com o motor
├── samples/                # Arquivos reais de teste para validação gráfica
├── spikes/                 # Spikes práticos de validação técnica dos 4 pilares
└── test/                   # Suíte de testes automatizados
    ├── engine.test.js      # Testes de integridade do core engine
    └── interactive_tools.test.js # Testes das 8 alças e ferramentas interativas
```

---

## 🚀 Comandos Rápidos

```bash
# Executar a suíte de testes de arquitetura e do motor
npm test

# Executar os testes das ferramentas interativas e 8 alças cardeais
npm run test:tools

# Iniciar os protótipos de validação (spikes)
npm run spike:1
npm run spike:2
npm run spike:3
npm run spike:4
```
