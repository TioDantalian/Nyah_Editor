# OpenDTP — Guia de Design System, Ícones e Integração Figma / MCP

## 1. Configuração do Servidor Figma MCP

O servidor MCP do Figma já foi configurado no arquivo global de MCP do ambiente:
`C:\Users\Ryzen\.gemini\config\mcp_config.json`

```json
{
  "mcpServers": {
    "after-effects": { ... },
    "figma": {
      "command": "cmd.exe",
      "args": ["/c", "npx", "-y", "ai-figma-mcp"],
      "env": {
        "FIGMA_API_KEY": "COLOQUE_SEU_TOKEN_AQUI"
      }
    }
  }
}
```

### Como Ativar quando for Usar:
1. No Figma, clique no seu avatar (canto superior esquerdo) > **Settings**.
2. Na aba **Security**, role até **Personal access tokens**.
3. Clique em **Generate token**, dê um nome (ex: `Antigravity-OpenDTP`) e marque permissões de leitura (`Read`).
4. Substitua `COLOQUE_SEU_TOKEN_AQUI` pelo token gerado no arquivo `mcp_config.json`.

---

## 2. Comparativo de Métodos: MCP vs. Design Tokens vs. SVG

| Método | Como Funciona | Prós | Contras | Recomendação |
| :--- | :--- | :--- | :--- | :--- |
| **Figma MCP (API Remota)** | O agente consulta nós, frames e estilos via API REST do Figma usando o ID do arquivo | Autônomo; o agente inspeciona o arquivo diretamente da nuvem | Requer token; nós brutos do Figma são árvores extensas; rate-limit de API | Excelente para inspecionar telas inteiras e layouts complexos |
| **Design Tokens (JSON / CSS)** | O Figma exporta as `Variables` (cores, raios, espaçamentos) para um `tokens.css` ou `tokens.json` no projeto | **Padrão da indústria**: 100% offline, versionável no Git, zero latência, variáveis CSS nativas consumidas diretamente pelo estúdio | Requer exportar as variáveis após grandes mudanças no Figma | **(Recomendado)** A melhor base para manter código e design sincronizados |
| **Ícones SVG Padronizados** | Uso de pacote de ícones vetoriais (Lucide / Phosphor) embutidos no código | Traço consistente (1.5px / 2px), viewBox uniforme (24x24), cores dinâmicas via CSS (`currentColor`), performance máxima | - | **(Recomendado)** Substitui os símbolos unicode provisórios por ícones profissionais |

---

## 3. Avaliação das Bibliotecas Citadas (Pós-Produção no Figma)

### A. Ícones: Lucide vs. Phosphor vs. Heroicons
1. **Lucide Icons (Altamente Recomendado)**:
   - Sucessor do Feather Icons, padrão adotado pelo ecossistema shadcn/ui e Tailwind.
   - Design cirúrgico com traço uniforme de 2px (ou 1.5px), perfeitamente legível em tamanhos pequenos (14px a 20px) em barras de ferramentas densas de DTP.
2. **Phosphor Icons**:
   - Muito popular em ferramentas de criação (estilo Figma/Canva) por oferecer variações de peso no mesmo ícone: *Regular, Thin, Light, Bold, Fill, Duotone*.
   - Excelente se quisermos ícones preenchidos para ferramentas ativas e contorno para inativas.
3. **Heroicons**:
   - Criado pelo time do Tailwind CSS. Muito polido para ações utilitárias (fechar, expandir, setas, chevron), mas menos focado em ferramentas gráficas.

### B. Sistemas de Componentes: shadcn/ui vs. Tamagui
1. **shadcn/ui**:
   - Não é uma dependência pesada de npm, mas um conjunto de padrões abertos de design tokens baseados em CSS semântico.
   - A paleta e variáveis (`--background`, `--foreground`, `--muted`, `--border`, `--primary`) podem ser aplicadas em CSS puro no OpenDTP Studio hoje, garantindo visual moderno e suporte nativo a Dark/Light Mode.
2. **Tamagui**:
   - Focado em React / React Native universal com compilador otimizador de estilos.
   - Muito interessante caso o OpenDTP expanda para mobile ou iPad/Tablet no futuro.

---

## 4. Próximos Passos no Fluxo de Trabalho (Workflow Handoff)

1. **Você cria no Figma**: cores, espaçamentos, layout da barra lateral, abas de páginas e inspetor.
2. **Handoff para o Código**: via tokens exportados, ou link do Figma com o MCP ativado, ou screenshots da tela.
3. **Implementação**: integramos os ícones vetoriais (Lucide/Phosphor) e o CSS semântico no estúdio.
