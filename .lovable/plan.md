# Paginação do histórico de lançamentos

## Objetivo
Na tela de controle de cada material (`/produto/:id`), dividir o histórico em páginas de 50 lançamentos, em vez de exibir todos de uma vez.

## O que muda
- A tabela de lançamentos passa a mostrar no máximo 50 registros por página.
- Abaixo da tabela aparece uma barra de navegação: Anterior / números de página / Próxima, além do texto "Mostrando 1–50 de 200".
- A ordem cronológica atual (mais recente no topo) é mantida.
- A paginação respeita os filtros já existentes (busca por observação e intervalo de datas): ao alterar um filtro, volta automaticamente para a página 1.
- Nada muda no cálculo do estoque, no saldo histórico nem nos dados salvos — apenas a exibição.

## Detalhes técnicos
- Em `src/routes/_authenticated/produto.$id.tsx`: novo estado `pagina`, constante `POR_PAGINA = 50`, e `useMemo` que fatia a lista já filtrada.
- Reset de `pagina` quando busca/datas mudam ou quando o total de páginas diminui.
- UI com o componente `Pagination` do shadcn já presente em `src/components/ui/pagination.tsx`.
- Sem alterações no banco, nas consultas ao backend ou nas permissões.
