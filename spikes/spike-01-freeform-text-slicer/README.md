# Spike 01: Fatiamento de Formas Livres, Text Threading & Hifenização

> **Status:** ✅ Validado e Aprovado  
> **Data:** Setembro de 2026  
> **Arquivo Interativo:** [`preview.html`](./preview.html)  
> **Módulos do Spike:** [`slicer.js`](./slicer.js) &bull; [`hyphenator.js`](./hyphenator.js) &bull; [`run.js`](./run.js)

---

## 🎯 Objetivo Arquitetural
Provar a viabilidade matemática, a flexibilidade tipográfica e o desempenho em tempo real (< 16 ms) de um **motor de fatiamento scanline desacoplado**, capaz de:
1. **Modo Positivo (In-Mold / Texto no Conteúdo):** Acomodar texto fluido no interior de formas livres arbitrárias (círculos, polígonos assimétricos com chanfro de revista e estrelas côncavas de 5 pontas com fatias paralelas simultâneas).
2. **Modo Negativo (Wrap / Contorno de Obstáculos):** Desviar o fluxo de texto de obstáculos complexos (manchas erráticas côncavas de 16 vértices e círculos), com controle de margem de contorno (*Wrap Offset*), suavização Bézier/Chaikin e políticas de contorno (`both`, `largest`, `jump`).
3. **Prevenção de Frestas e Ilhas:** Eliminar espaços vazios e linhas frouxas através de **Hifenização Silábica Fonética (Liang/ABL)** e **Filtro Paramétrico de Segmento Mínimo (`minWidth`)**.
4. **Transbordo Dinâmico (*Threaded Text Frames*):** Cortar com precisão o fluxo de tokens na capacidade geométrica do molde e transferir o excedente de forma contínua para uma página subsequente vinculada.

---

## 🏛️ Arquitetura em 4 Camadas Ortogonais

O spike foi construído sobre o princípio de **Zero Heurísticas Engessadas** e desacoplamento estrito entre geometria e tipografia:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GEOMETRY ENGINE (Pura Geometria 2D, Agnóstica de Texto)  │
│    - Scanline Ray-Casting [Y_start, Y_end, step = leading]  │
│    - Interseções de polígonos e arcos de círculos           │
│    - Subtração Booleana de Intervalos 1D                    │
│    - Suavização de cantos de Chaikin (0 a 4 iterações)      │
│    - Filtro de Segmento Mínimo (minWidth anti-ilhas)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Slices: [ { y, height, segments: [{x, width}] } ]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TOKENIZER & HYPHENATOR ENGINE (Estrutura e Fonética)     │
│    - Tokenização sem perda de caracteres e pontuação        │
│    - Hifenização Silábica Liang/ABL para Português          │
│    - Respeito às regras: minWordLength, minBefore, minAfter │
│    - Teto de hífens consecutivos (Hyphen Limit)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Tokens & Pontos de Corte Silábicos
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. FLOW ENGINE (Acomodação de Tokens nos Recipientes)       │
│    - Empacotamento de tokens nos segmentos disponíveis      │
│    - Aplicação de hífen se palavra estourar o segmento      │
│    - Cálculo de palavras restantes para transbordo (Page 2) │
└──────────────────────────────┬──────────────────────────────┘
                               │ Lines: [ { words, x, y, targetWidth } ]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ALIGNMENT STRATEGY (Estratégias Visuais Plugáveis)       │
│    - Flush Left (Alinhado à Esquerda)                       │
│    - Justificado Paramétrico com Teto de Tolerância         │
│      (Fallback limpo para Left se espaço extra > 1.8x)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Resultados dos Benchmarks (Medição em CPU - Node.js & Browser)

### 1. Modo Positivo (Texto Interno no Molde)
| Molde Geométrico | Geometria / Complexidade | Fatias Geradas | Linhas Compostas | Hífens Aplicados | Tempo Médio |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Polígono Assimétrico** | 5 vértices, chanfro diagonal de revista | 15 fatias | 11 linhas | 5 | **0.28 ms** |
| **Círculo Perfeito** | Raio 165px, calota contínua | 14 fatias | 14 linhas | 4 | **0.15 ms** |
| **Estrela Côncava** | 10 vértices, 5 pontas, múltiplos segmentos | 12 fatias | 14 linhas | 5 | **0.32 ms** |

### 2. Modo Negativo (Wrap em Torno de Obstáculo)
| Tipo de Obstáculo | Configuração de Wrap | Fatias Geradas | Segmentos Úteis | Hífens Aplicados | Tempo Médio |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Círculo Suave** | Offset 16px, Wrap Both Sides | 19 fatias | 28 segmentos | 10 | **0.42 ms** |
| **Mancha Errática** | 16 vértices, Chaikin (2 iterações), Jump | 19 fatias | 12 segmentos | 4 | **0.88 ms** |
| **Mancha Errática** | 16 vértices, Chaikin (2 iterações), Largest Area | 19 fatias | 19 segmentos | 8 | **0.95 ms** |

> ⚡ **Conclusão de Performance:** O ciclo completo de fatiamento geométrico + hifenização silábica roda consistentemente abaixo de **1.0 ms**, consumindo menos de **6% do orçamento de 16.6 ms de um frame a 60 FPS**.

---

## 🧩 Parâmetros Auditados vs. Padrões da Indústria

Todos os seletores e sliders implementados possuem respaldo direto nas convenções de softwares líderes:
- **Entrelinha (*Leading*):** 120% proporcional com desacoplamento livre (*Adobe InDesign Auto-Leading*).
- **Margem de Contorno (*Wrap Offset*):** 0 a 40px (*InDesign Text Wrap Panel*).
- **Políticas de Contorno (*Wrap Modes*):** `both` (*Both Sides*), `largest` (*Largest Area*), `jump` (*Jump Object*).
- **Suavização de Contorno:** Algoritmo de Chaikin com iterações configuráveis.
- **Filtro de Segmento Mínimo:** `minWidth` (elimina orfandade em frestas estreitas).
- **Hifenização Silábica:** `minWordLength: 5`, `minBefore: 2`, `minAfter: 2`, `hyphenLimit: 3` (*InDesign Hyphenation Dialog* / *W3C CSS Text 4*).

---

## 🖥️ Como Executar e Testar

### 1. Teste Interativo Visual (Navegador)
Abra diretamente o arquivo no browser:
```text
C:\Users\Ryzen\Desktop\teste\SOFTWARE DTP\spikes\spike-01-freeform-text-slicer\preview.html
```
- Alterne entre os botões **"Positivo (No Molde)"** e **"Negativo (Wrap)"**.
- Teste os diferentes moldes (*Polígono*, *Círculo*, *Estrela*).
- Ative e desative a checkbox de **Hifenização Silábica** para inspecionar em tempo real o preenchimento das bordas curvas e o contador de hífens na caixa de métricas.

### 2. Teste Automatizado via Terminal (CLI)
No diretório do projeto, execute:
```bash
node spikes/spike-01-freeform-text-slicer/run.js
```
