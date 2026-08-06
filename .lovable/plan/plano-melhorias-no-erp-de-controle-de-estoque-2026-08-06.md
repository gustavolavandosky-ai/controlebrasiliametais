# Plano: melhorias no ERP de controle de estoque

## Objetivo
Integrar o sistema de estoque enviado ao projeto atual e adicionar as melhorias solicitadas na tela de detalhes do produto, nos lançamentos e na importação de inventário.

## O que será entregue

1. **Integração do ERP no projeto**
   - Substituir a página inicial placeholder pelo dashboard de estoque.
   - Reaproveitar as rotas `/`, `/produtos` e `/produto/$id` já existentes no código enviado.
   - Manter a persistência local via Zustand, sem backend.
   - Importar o logo e os componentes customizados (`AppHeader`, `EntrySheet`, `ProductDialog`).

2. **Melhorias na tela de detalhes do produto (`/produto/$id`)**
   - Manter o botão "Incluir lançamento" visível no topo.
   - Tornar a linha do lançamento clicável para edição rápida (data, hora, quantidade, tipo).
   - Adicionar menu de ações (três pontinhos) ao lado de cada lançamento com as opções:
     - Editar lançamento
     - Excluir lançamento
     - Calcular saldo após lançamento

3. **Cálculo de saldo após lançamento**
   - Ao escolher "Calcular saldo", abrir um modal/drawer mostrando:
     - Data do lançamento
     - Tipo do lançamento (entrada/saída/balanço)
     - Quantidade antes do lançamento (saldo acumulado até o lançamento anterior)
     - Quantidade depois do lançamento (saldo após aplicar o lançamento)
   - O cálculo considera o estoque inicial e todos os lançamentos anteriores em ordem cronológica.

4. **Importação de inventário existente**
   - Adicionar botão "Importar inventário" na tela principal (`/`).
   - Aceitar arquivo Excel (`.xlsx`) com colunas mínimas: `Produto`, `Unidade`, `Estoque Inicial`.
   - Colunas opcionais: `Localização`, `Observações`.
   - Permitir pré-visualização dos dados antes de confirmar a importação.
   - Ao confirmar, criar os produtos novos e, opcionalmente, adicionar um lançamento de balanço com o estoque inicial informado.

## Fora do escopo
- Autenticação/login.
- Persistência em nuvem ou banco de dados.
- Relatórios avançados ou dashboards gráficos.
- Controle de múltiplos usuários.

## Notas técnicas
- O projeto usa TanStack Start + React + Tailwind v4 + shadcn/ui, mesma stack do código enviado.
- A persistência continua com Zustand + `localStorage`.
- A importação usa a biblioteca `xlsx` já presente no `package.json`.
- O menu de ações será implementado com o componente `DropdownMenu` do shadcn/ui.
- O modal de saldo pode reaproveitar o `Sheet` ou `Dialog` já utilizados.
- Não haverá alterações no backend, banco de dados ou autenticação.
