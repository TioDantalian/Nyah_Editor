# 02. Arquitetura do Software: O "InDesign Moderno"

## O Princípio Fundamental da Modularidade Ortogonal (Zero Heurísticas Engessadas)

Uma das maiores armadilhas no desenvolvimento de software de DTP é a proliferação de "regras específicas e números mágicos" espalhados pelo código (como `if (fontSize > 20) ...`). Esse tipo de remendo ad-hoc torna o sistema frágil e imprevisível.

A norma arquitetural do projeto é a **Modularidade Ortogonal**: o pipeline é dividido em camadas completamente desacopladas, onde cada módulo resolve exclusivamente o seu domínio sem conhecer detalhes do próximo.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CAMADA 1: GEOMETRIA PURA (GEOMETRY)                  │
│   • Entrada: Contornos (SVG, Círculos, Polígonos), Margens e Offsets.    │
│   • Saída: Array de Fatias Horizontais: [{ y, height, segments: [x, w]}] │
│   • Responsabilidade: Matemática 2D analítica. ZERO conhecimento de texto│
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                   CAMADA 2: MEDIÇÃO & SHAPING (TYPOGRAPHY)               │
│   • Entrada: String de texto, família tipográfica, tamanho, entrelinha.  │
│   • Saída: Tokens medidos (largura individual de cada glifo e espaço).   │
│   • Responsabilidade: Shaping OpenType / HarfBuzz / Typst Kernel.        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                     CAMADA 3: MOTOR DE FLUXO (FLOW ENGINE)               │
│   • Entrada: Fila de Tokens Medidos + Lista de Fatias Geométricas.       │
│   • Saída: Linhas empacotadas + Tokens excedentes (Overflow Stream).      │
│   • Responsabilidade: Algoritmo de encaixe sequencial entre recipientes. │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                 CAMADA 4: ESTRATÉGIAS DE ALINHAMENTO (STRATEGY)          │
│   • Entrada: Linhas empacotadas + Política configurada (Left, Justify).  │
│   • Saída: Coordenadas X/Y finais de renderização no Canvas ou PDF.      │
│   • Responsabilidade: Ajuste paramétrico de espaçamento entre palavras.  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. As 4 Camadas Modulares em Detalhes

### Camada 1: Geometria Pura (`GeometryEngine`)
* O módulo geométrico não sabe se o conteúdo é um texto de romance, um poema em hebraico ou uma sequência de ícones.
* Ele recebe apenas:
  * O retângulo do container base ($X, Y, W, H$).
  * A lista de obstáculos e polígonos.
  * O valor de entrelinha vertical ($H_{line}$).
  * O filtro de largura mínima utilizável (`minWidth`).
* Ele executa a decomposição por Scanline e entrega fatias úteis.

### Camada 2: Medição & Shaping
* Fornece a função de alta precisão `measureToken(token) -> width`.
* Em ambiente web, utiliza o motor do navegador (`ctx.measureText`); em ambiente desktop/CLI nativo, utiliza o motor HarfBuzz do compilador do Typst via Rust.

### Camada 3: Motor de Fluxo (`FlowEngine`)
* É um motor de empacotamento abstrato.
* Ele consome tokens enquanto houver largura disponível no segmento geométrico atual.
* Quando os segmentos da Página 1 se esgotam, ele interrompe o consumo e retorna uma tupla limpa:
  $$\{ \text{linhas\_geradas},\; \text{tokens\_remanescentes} \}$$
* Os tokens remanescentes são então injetados na Página 2 (ou 3, 4...) de forma idêntica e sem duplicação de lógica.

### Camada 4: Estratégias de Alinhamento Plugáveis (`AlignmentEngine`)
* Implementa o clássico padrão de projeto **Strategy Pattern**:
  * `LeftAlignStrategy`: simples e determinístico.
  * `JustifyStrategy`: redistribui o espaço excedente entre as palavras, respeitando um fator de tolerância configurado pelo usuário (`maxSpacingFactor`), sem travas ocultas.

---

## 2. O Modelo de Dados do Projeto (Git-First)

O projeto é armazenado em disco como uma pasta aberta (ou arquivo compactado `.dtp`), estruturada para facilitar o controle de versão:

```text
meu-projeto/
├── project.json         # Metadados: tamanho de página (A4, Carta), sangria (bleed), margens
├── styles.json          # Estilos de parágrafo, fontes padrão, paleta de cores
├── masters/             # Templates de páginas-mestre
│   ├── master-padrao.json
│   └── master-capitulo.json
├── stories/             # Conteúdo puro das matérias / capítulos
│   ├── artigo-01.typ    # Conteúdo estruturado processável pelo Typst
│   └── artigo-02.typ
├── pages/               # Geometria visual desenhada no canvas
│   ├── spread-01.json   # Posição X/Y/W/H dos frames, links de fluxo, imagens
│   ├── spread-02.json
│   └── ...
└── assets/              # Bitmaps e vetores SVG referenciados por caminho relativo
    ├── foto.jpg
    └── infografico.svg
```

---

## 3. Benefícios Práticos da Arquitetura Modular

1. **Sem Código Espaguete:** Nenhuma camada depende de truques ou números mágicos da outra.
2. **Substituição Fácil de Motores:** Se amanhã quisermos trocar o motor de geometria de JavaScript puro para uma biblioteca de alta velocidade em Rust (como `lyon` ou `geo-booleanop`), a Camada de Fluxo e a Camada de Alinhamento nem sequer perceberão a mudança.
3. **Controle Total na Mão do Usuário:** O software nunca "adivinha" o que o designer quer; ele expõe parâmetros claros na interface (tolerância, margem, suavização) e executa as estratégias de forma previsível e matemática.
