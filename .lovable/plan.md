# Controle de Diárias — nova aba no ERP

## Objetivo
Adicionar ao ERP uma área de **Diárias** (separada do Estoque), com os dados da sua planilha já importados e agrupados por equipe/motorista.

## Nova aba no menu
Menu no topo com **Estoque** e **Diárias**. Mesma conta e mesmas regras de acesso (você edita, convidados só visualizam).

## Tela de Diárias
Lista de lançamentos com as colunas da planilha:

```text
Data | Colaborador | Equipe | Tipo de diária | Valor | Destino/Cliente | Situação | Troco
```

- Cada linha ganha uma faixa colorida da equipe: verde = LEO, azul = ADELSON, laranja = ALMI, amarelo = GIL. Linhas sem cor ficam como "sem equipe".
- Botão **Novo lançamento**: data, colaborador, equipe, tipo de diária, valor, destino, situação (pago/pendente) e troco.
- Editar e excluir por linha.
- Filtros: período (De/Até), colaborador, equipe, destino e situação; busca por texto.

## Cadastros (listas)
Telas simples para manter as listas usadas nos menus, evitando nomes duplicados:
- **Colaboradores** (com equipe padrão): ADELSON, ALMI, AMERICO, BROCA, CLAUDEMIR, FLORIANO, GIL, GILDEMAR, GUSTAVO, LEO, MATHEUS, PEDRO, PETECA, SANDRAK, ESCOLTA.
- **Tipos de diária** com valor sugerido: ALMOÇO, ALMOÇO + CAFÉ, ALMOÇO + CAFÉ + JANTA, ALMOÇO + PEDÁGIO, CAFÉ, JANTA, JANTA + PERNOITE, PERNOITE, ESCOLTA, ESCOLTA + PEDÁGIO, DIÁRIA DOMINGO, DIÁRIA ESCOLTA, DIÁRIA ESCOLTA DOMINGO + PEDÁGIO, DIÁRIA PERNOITE DOMINGO, DIÁRIAS + PEDÁGIO + GASOLINA.
- **Destinos/clientes**: ALUER, CASCUDO, CBL, DANIEL RIO CLARO, DATDORIA, FABIANO SÃO CARLOS, GRIMALDI, MENUDO, MURILO / FABIANO S.C., NARDINE/ROBINHO, ROTA MOGI, TAMIRES, VALTER ACERRA.

## Resumos
No topo da tela, cartões e tabelas que respeitam os filtros aplicados:
- Total do período (valor e nº de diárias)
- Total por colaborador
- Total por destino/cliente
- Total pendente de pagamento (separado do pago)

## Importação da sua planilha
Os 106 lançamentos de 15/07 a 11/08 entram já cadastrados, com nomes limpos (ex.: "ALMI " vira "ALMI") e a equipe deduzida pela cor da linha. Também fica disponível um botão para importar novas planilhas no mesmo formato.

## Notas técnicas
- Novas tabelas: `colaboradores`, `tipos_diaria`, `destinos`, `diarias` — mesmas políticas já usadas em `produtos`/`lancamentos` (dono edita, aprovados leem via `pode_ver`).
- Dados históricos entram por INSERT no mesmo passo da criação das tabelas.
- Novas rotas: `/diarias` e `/diarias/cadastros` dentro de `_authenticated`.
- Leitura/escrita via TanStack Query, no mesmo padrão de `inventory-store.ts`.
- Barra de navegação adicionada em `AppHeader`.