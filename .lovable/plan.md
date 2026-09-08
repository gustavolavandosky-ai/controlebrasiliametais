# Setor de Devoluções

Nova aba "Devoluções" no sistema, ao lado de Estoque e Diárias, para registrar quanto material foi enviado a uma empresa e quanto voltou, com a diferença calculada automaticamente.

## O que você vai poder fazer

- Abrir a aba **Devoluções** no menu do topo.
- Registrar uma devolução com: data, empresa (texto livre), material (texto livre), unidade, quantidade enviada, quantidade retornada e observação.
- Ver a **diferença** calculada sozinha (retornado − enviado):
  - negativa em vermelho (voltou menos do que foi enviado);
  - positiva em verde (voltou mais);
  - zero em cinza neutro.
- Ver também o percentual de perda/impureza em relação ao enviado.
- Filtrar por período (data de/até) e buscar por empresa, material ou observação.
- Totais no topo: total enviado, total retornado e diferença total do período filtrado.
- Editar e excluir registros; quem tem acesso somente leitura apenas visualiza.
- Lista em ordem cronológica (mais recente primeiro), 50 registros por página.

As devoluções ficam em um registro próprio e **não alteram o saldo do estoque**.

## Detalhes técnicos

- Migração: tabela `public.devolucoes` com `user_id`, `data`, `empresa`, `material`, `unidade`, `quantidade_enviada`, `quantidade_retornada`, `observacao`, `created_at`, `updated_at`; GRANTs para `authenticated`/`service_role`, RLS habilitada e políticas no mesmo padrão das demais tabelas (leitura via `pode_ver(user_id)`, escrita apenas do dono), mais trigger `update_updated_at_column`.
- `src/lib/devolucoes-store.ts`: hook `useDevolucoes` com TanStack Query, leitura paginada (1000 por página, como estoque/diárias), `addDevolucao`/`updateDevolucao`/`deleteDevolucao` com refetch antes do toast e helper `calcularDiferenca`.
- `src/components/DevolucaoSheet.tsx`: formulário em Sheet para criar/editar, com botão bloqueado durante o salvamento (proteção contra duplo envio).
- `src/routes/_authenticated/devolucoes.tsx`: tabela com filtros, totais, paginação e coluna de diferença colorida por tokens semânticos do design system.
- Cores de positivo/negativo definidas como tokens em `src/styles.css` (sem cores fixas nos componentes).
- Link "Devoluções" em `src/components/AppHeader.tsx` e `head()` próprio na rota com título e descrição.
