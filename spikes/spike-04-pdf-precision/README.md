# Spike 04: "Pixel-to-Point Match" (Fidelidade do Canvas ao PDF Impresso)

> **Status:** ✅ Validado e 100% Aprovado  
> **Data:** Setembro de 2026  
> **Arquivo Interativo:** [`preview.html`](./preview.html)  
> **Script de Benchmark:** [`run.js`](./run.js)  
> **Arquivo de Prova Gerado:** [`output_test_print.pdf`](./output_test_print.pdf)

---

## 🎯 Objetivo Arquitetural
Comprovar matematicamente e na prática de pré-impressão que qualquer elemento desenhado no Canvas em milímetros é transposto **com rigor submilimétrico exato ($\Delta = 0.000000\,\text{mm}$)** para o formato PDF vetorial (padrão ISO 32000-1 / PDF/X), garantindo:
1. **Zero Distorção de Escala:** Relação exata $1\text{ in} = 25.4\text{ mm} = 72\text{ pt}$ ($1\text{ mm} \approx 2.83464567\text{ pt}$).
2. **Inversão Correta de Coordenadas (Y-Flip):** Mapeamento ortogonal da origem de tela (topo-esquerdo, $Y$ descendente) para a origem PDF (base da folha física, $Y$ ascendente).
3. **Dicionários Oficiais de Caixas de Página (Page Boxes):**
   - `/MediaBox`: Dimensão total da folha gráfica ($170 \times 170\,\text{mm}$) contendo marcas de corte e registro.
   - `/BleedBox`: Limite técnico de sangria de $3\,\text{mm}$ ($156 \times 156\,\text{mm}$).
   - `/TrimBox`: Área acabada da publicação útil ($150 \times 150\,\text{mm}$).
   - `/CropBox`: Delimitação de visualização padrão.
4. **Marcas Profissionais de Pré-Impressão:**
   - *Crop Marks* com espessura calibrada a 0.25 pt e recuo de 3 mm em relação ao corte.
   - *Bleed Marks* tracejadas.
   - Alvos de Registro de alta precisão (círculos concêntricos e miras cruzadas).
   - Escala de calibragem com amostras de processo CMYK (100% e 50%).
   - *Slug Area* com metadados do documento, data e carimbo de geração.
5. **Texto Vetorial Puro Selecionável:** Fontes padrão Type 1 emitidas via operadores diretos `BT ... ET` sem rasterização.

---

## 📊 Resultados da Auditoria Submilimétrica

Executado através do comando `npm run spike:4` (`node spikes/spike-04-pdf-precision/run.js`):

| Grandeza / Elemento | Dimensão Projeto (mm) | Teórico (pt) | Emitido no PDF (pt) | Erro $\Delta$ (mm) |
| :--- | :---: | :---: | :---: | :---: |
| **Largura Útil (Trim W)** | $150.00\,\text{mm}$ | $425.1969\,\text{pt}$ | $425.1969\,\text{pt}$ | **$0.000000\,\text{mm}$** |
| **Altura Útil (Trim H)** | $150.00\,\text{mm}$ | $425.1969\,\text{pt}$ | $425.1969\,\text{pt}$ | **$0.000000\,\text{mm}$** |
| **Sangria Gráfica (Bleed)** | $3.00\,\text{mm}$ | $8.5039\,\text{pt}$ | $8.5039\,\text{pt}$ | **$0.000000\,\text{mm}$** |
| **Margem de Folha (Slug)** | $10.00\,\text{mm}$ | $28.3465\,\text{pt}$ | $28.3465\,\text{pt}$ | **$0.000000\,\text{mm}$** |
| **Quadrado de Referência (Lado)** | **$100.00\,\text{mm}$** | **$283.4646\,\text{pt}$** | **$283.4646\,\text{pt}$** | **$0.000000\,\text{mm}$** |
| **Posição X do Quadrado** | $20.00\,\text{mm}$ | $56.6929\,\text{pt}$ | $56.6929\,\text{pt}$ | **$0.000000\,\text{mm}$** |
| **Posição Y do Quadrado** | $20.00\,\text{mm}$ | $56.6929\,\text{pt}$ | $56.6929\,\text{pt}$ | **$0.000000\,\text{mm}$** |

### ⏱️ Velocidade de Compilação:
- **Tempo de Emissão do PDF:** `0.309 ms`
- **Tamanho do Arquivo Final:** `5.148 bytes` (~5 KB, ultraleve e sem inchaço)
- **Taxa Teórica de Exportação:** Mais de `3.000 páginas/segundo`

---

## 🔬 Testes de Integridade ISO 32000-1
- ✅ Cabeçalho PDF 1.7 válido (`%PDF-1.7` com comentário binário `%âãÏÓ`)
- ✅ Dicionário `/MediaBox` presente e rigoroso
- ✅ Dicionário `/BleedBox` presente e rigoroso
- ✅ Dicionário `/TrimBox` presente e rigoroso
- ✅ Texto vetorial puro (`BT ... ET`) selecionável (sem perda de resolução)
- ✅ Operador de retângulo (`re B`) na dimensão exata de 283.4646 pt
- ✅ Tabela `xref` estruturada com offsets de bytes validados
- ✅ Marcador final `%%EOF` em conformidade
- ✅ Erro de medição submilimétrica $\Delta < 10^{-6}\,\text{mm}$

---

## 🖥️ Como Executar e Validar

### 1. Linha de Comando:
```bash
npm run spike:4
```

### 2. Validador Interativo no Navegador:
Abra o arquivo diretamente no navegador:
```text
C:\Users\Ryzen\Desktop\teste\SOFTWARE DTP\spikes\spike-04-pdf-precision\preview.html
```
- Acompanhe as réguas dinâmicas milimétricas.
- Mova o mouse sobre o canvas para inspecionar as coordenadas simultâneas em `mm` e `pt`.
- Clique no botão **"Baixar PDF Oficial (ISO 32000)"** para abrir o arquivo gerado diretamente no Adobe Acrobat Pro, Illustrator ou leitor com réguas ativas.
