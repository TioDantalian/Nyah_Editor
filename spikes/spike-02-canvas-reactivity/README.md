# Spike 02: Reatividade do Laço Canvas (60 FPS) & Text Threading

> **Status:** ✅ Validado e Aprovado  
> **Data:** Setembro de 2026  
> **Arquivo Interativo:** [`preview.html`](./preview.html)  
> **Script de Benchmark:** [`run.js`](./run.js)

---

## 🎯 Objetivo Arquitetural
Provar experimentalmente se a união dos nossos motores modulares (**Geometria Scanline**, **Fluxo Tipográfico**, **Hifenização Silábica Liang/ABL** e **Renderização Canvas**) consegue sustentar uma taxa estável de **60 FPS** (orçamento máximo de **16.667 ms por frame**) durante:
1. **Arrasto Contínuo de Obstáculos:** Mover livremente uma mancha errática de 16 vértices com suavização de Chaikin sobre duas caixas de texto vinculadas.
2. **Redimensionamento em Tempo Real:** Alterar a largura e altura de caixas de texto com refluxo instantâneo (*Threaded Text Flow*).
3. **Navegação de Prancheta Infinita:** Pan e Zoom suaves (10% a 1000%) centrados no cursor do mouse.

---

## 📊 Resultados da Telemetria (Benchmark de Estresse com 1.000 Frames Contínuos)

Executado através de `npm run spike:2` (`node spikes/spike-02-canvas-reactivity/run.js`):

| Métrica de Performance | Resultado Obtido | Limite de Orçamento 60 FPS | Margem de Segurança (Headroom) |
| :--- | :---: | :---: | :---: |
| **Tempo Médio por Frame** | **0.167 ms** | 16.667 ms | **99.0% livre** |
| **Mediana (P50)** | **0.111 ms** | 16.667 ms | **99.3% livre** |
| **Percentil 95 (P95)** | **0.368 ms** | 16.667 ms | **97.8% livre** |
| **Percentil 99 (P99)** | **0.583 ms** | 16.667 ms | **96.5% livre** |
| **Pior Caso (Latência Máxima)** | **2.975 ms** | 16.667 ms | **82.2% livre** |
| **Taxa Teórica Máxima** | **~5.990 FPS** | 60 FPS | **100x superior ao necessário** |

### Decomposição de Tempo Médio por Fase:
```
┌──────────────────────────────────────────────────────────────┐
│ Geometria (Scanline + Chaikin + Boolean): 0.055 ms  (32.8%)  │
├──────────────────────────────────────────────────────────────┤
│ Fluxo & Hifenização Silábica Liang/ABL:    0.112 ms  (67.0%)  │
├──────────────────────────────────────────────────────────────┤
│ Total Médio de Cálculo:                    0.167 ms (100.0%) │
└──────────────────────────────────────────────────────────────┘
```

---

## 💡 Conclusões Técnicas

1. **Inexistência de Gargalo no Laço Reativo:**
   Mesmo combinando fatiamento geométrico não-linear, suavização de cantos de Chaikin, hifenização fonética de palavras em português e distribuição em múltiplos frames vinculados, o tempo de cálculo médio é de apenas **0.167 ms**.
2. **Não é Necessário Web Worker para Layout Básico:**
   Por rodar em menos de 1 ms, o motor de layout não bloqueia a *Main Thread* da UI nem a entrada do mouse. Um Web Worker só se tornará necessário para documentos com centenas de páginas em lote.
3. **Threading Perfeito entre Caixas:**
   O corte de tokens no Frame 1 e o transbordo para o Frame 2 ocorrem com zero alocação intermediária de strings pesadas, garantindo que o arrasto do obstáculo transfira linhas entre as páginas sem saltos visuais.

---

## 🖥️ Como Testar no Navegador

Abra o arquivo diretamente no navegador:
```text
C:\Users\Ryzen\Desktop\teste\SOFTWARE DTP\spikes\spike-02-canvas-reactivity\preview.html
```

### Controles Interativos:
- **Arrastar Obstáculo:** Clique no objeto vermelho e arraste-o sobre o Frame 1 ou Frame 2. Observe o texto se abrindo em tempo real e o HUD exibindo 60 FPS estáveis.
- **Redimensionar Caixas:** Arraste a alça azul no canto inferior direito de qualquer frame para vê-lo alargar/encurtar com refluxo instantâneo de texto para a página vizinha.
- **Mover Caixas:** Arraste pela barra de título superior de qualquer caixa de texto.
- **Navegar na Prancheta:**
  - Segure <kbd>Espaço</kbd> e arraste com o mouse para dar **Pan**.
  - Use a **Roda do Mouse** para aplicar **Zoom contínuo** (10% a 600%) centrado na posição do cursor.
  - Utilize os botões do canto inferior direito (`+`, `−`, `100%`, `Enquadrar`).
- **HUD de Telemetria:** No canto inferior esquerdo, acompanhe o gráfico em barra e os milissegundos de cada etapa da computação.
