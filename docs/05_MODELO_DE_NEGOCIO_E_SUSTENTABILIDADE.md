# 05. Modelo de Negócio, Sustentação e Estratégia de Mercado

> **"Como financiar e sustentar anos de desenvolvimento diante de gigantes como Adobe e Canva/Affinity?"**

---

## 1. O Posicionamento Estratégico: Onde Lutar e Onde Não Lutar

Um erro fatal seria tentar disputar de imediato os clientes corporativos conservadores da Adobe (grandes agências de publicidade que dependem do ecossistema Adobe Creative Cloud há 25 anos).

### A Tese de Mercado: O "Efeito Blender" na Editoração
Assim como o Blender começou ignorado pela Autodesk e hoje é uma potência global na indústria 3D, o novo software de DTP deve capturar os públicos que o mercado atual abandonou:

1. **Editoras Independentes e Universitárias:** Cansadas dos custos recorrentes de centenas de licenças de InDesign.
2. **Criadores de Zines, RPG de Mesa e Literatura Independente:** Comunidades apaixonadas que exigem controle total de layout, mas não aceitam o modelo de assinatura.
3. **Desenvolvedores e Empresas de Web-to-Print:** Empresas que precisam gerar catálogos, manuais técnicos e relatórios gráficos complexos sob demanda via linha de comando (onde o InDesign Server custa dezenas de milhares de dólares por CPU).
4. **Engenheiros e Acadêmicos Atraídos pelo Typst:** Pessoas que amam a automação do Typst, mas precisam de controle visual milimétrico para ilustrações e capas.

---

## 2. Etapas de Financiamento e Sustentação Financeira

Para sustentar um projeto desse calibre sem sucumbir à falência antes do produto amadurecer, a captação e monetização devem ocorrer em três fases:

```
┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│          FASE 1           │     │          FASE 2           │     │          FASE 3           │
│   Grants & Fundações de   │ ──> │  Licenciamento Headless   │ ──> │   Nuvem Colaborativa &    │
│    Infraestrutura Aberta  │     │       & Suporte B2B       │     │     Marketplace Pro       │
│   (NLnet, STF, Sponsors)  │     │   (Web-to-Print / Server) │     │   (Modelo Obsidian/Canva) │
└───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘
```

### Fase 1: Grants Governamentais e Fundações de Código Aberto (Ano 1)
Projetos que promovem padrões abertos e reduzem monopólios digitais têm acesso a fundos de fomento consolidados:
* **[NLnet Foundation](https://nlnet.nl/):** Financia especificamente ferramentas de publicação aberta, padrões web (CSS Paged Media) e formatos livres na Europa (subvenções de €5.000 a €50.000 a fundo perdido).
* **[Sovereign Tech Fund (STF)](https://sovereigntechfund.de/):** Financia manutenção e criação de infraestrutura aberta crítica (já investiu milhões de euros em Rust, GNOME, cURL, Typst e Matrix).
* **GitHub Sponsors & Open Collective:** Engajamento da comunidade de tipografia e design com metas públicas de desenvolvimento.

### Fase 2: Modelo Dual-License para Automação Headless / Enterprise (Anos 2 a 3)
* **O Aplicativo Desktop:** Permanece **100% livre e gratuito** (código aberto sob licença permissiva ou copyleft amigável como AGPL/Apache 2.0). Nenhuma barreira para autores, estudantes ou designers individuais.
* **O Motor Headless para Servidores (DTP Engine Enterprise):**
  * Empresas de e-commerce, gráficas online e plataformas web-to-print que queiram embutir o motor em seus clusters de servidores para gerar milhões de PDFs pagam uma licença comercial anual de runtime (modelo similar ao de ferramentas como *PrinceXML* e *Sidecar*).

### Fase 3: Serviços Cloud & Marketplace Integrado (Ano 3+)
* **Cloud Sync & Colaboração em Equipe (SaaS Opcional):**
  * Um serviço de nuvem opcional (nos moldes do Obsidian Sync ou Penpot Cloud) para estúdios que precisam de colaboração simultânea, histórico de versões e backup automático sem configurar servidores próprios.
* **Marketplace Curado de Templates e Plugins:**
  * Plataforma onde designers e desenvolvedores podem vender templates prontos de livros, revistas e scripts de automação, com uma comissão retida pela plataforma.

---

## 3. Tamanho de Equipe e Execução Viável

| Período | Tamanho da Equipe | Perfis Essenciais | Foco Principal |
| :--- | :---: | :--- | :--- |
| **Ano 1 (MVP v0.1)** | **1 a 2 pessoas** | 1 Engenheiro Rust/WASM (Typst + Core) + 1 Desenvolvedor Frontend/Canvas (Konva/Tauri). | Fatiamento de frames, canvas interativo e exportação PDF inicial. |
| **Ano 2 (v0.2 a v0.5)** | **3 a 4 pessoas** | + 1 Designer de Produto/UX (especialista em tipografia) + 1 Engenheiro Gráfico (LittleCMS/Prepress). | Estabilidade de interface, pré-impressão CMYK e primeiros clientes B2B. |
| **Ano 3 (v1.0)** | **5 a 7 pessoas** | + Suporte Enterprise, Infraestrutura Cloud e Relações com Desenvolvedores (DevRel). | Escalar o ecossistema de plugins e serviços em nuvem. |
