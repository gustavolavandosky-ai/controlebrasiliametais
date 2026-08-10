# Contas com aprovação e convidados somente leitura

## O que muda para você

- Qualquer pessoa pode criar conta, mas ela fica **aguardando aprovação** e não vê nada do ERP.
- Você (gustavo.lavandosky@icloud.com) é o administrador: uma página **Acessos** lista quem pediu entrada, com botões Aprovar e Recusar.
- Nessa mesma página você **convida por e-mail** pessoas para visualizar seu controle. Quando a pessoa criar a conta com aquele e-mail, ela já entra aprovada como **visualizador**.
- Visualizador vê o estoque, os produtos e todos os lançamentos (com observações), mas **não** consegue criar, editar, importar nem excluir nada — os botões somem e o banco também bloqueia.
- Quem está aguardando vê uma tela simples: "Sua conta está aguardando aprovação".

## Fluxo

```text
cria conta
   |
   +-- e-mail é o do admin  -> aprovado como admin
   +-- e-mail tem convite   -> aprovado como visualizador da sua conta
   +-- nenhum dos dois      -> pendente -> você aprova -> vira visualizador
```

## Detalhes técnicos

**Banco de dados (migração)**
- Tabela `perfis`: `user_id`, `email`, `nome`, `status` (`pendente` | `aprovado` | `recusado`), `papel` (`admin` | `visualizador`), `dono_id` (dono do estoque que ele enxerga), timestamps + trigger de `updated_at`. GRANTs para `authenticated` e `service_role`.
- Tabela `convites`: `email` (único, normalizado), `criado_por`, `usado_em`, timestamps.
- Funções `SECURITY DEFINER` (evitam recursão em RLS):
  - `is_admin(uid)` — papel admin e status aprovado.
  - `pode_ver(dono uuid)` — true se `auth.uid() = dono` ou existe perfil aprovado com `user_id = auth.uid()` e `dono_id = dono`.
  - `registrar_perfil()` — cria/retorna o perfil do usuário logado, decidindo status/papel pela regra do fluxo acima (e-mail admin, convite existente, ou pendente). Chamada no primeiro login, sem trigger no schema `auth`.
- RLS:
  - `produtos` e `lancamentos`: leitura com `pode_ver(user_id)`; criar/editar/excluir continuam só para `auth.uid() = user_id`.
  - `perfis`: cada um lê o próprio; admin lê e atualiza todos.
  - `convites`: só o admin gerencia.

**Aplicação**
- `src/lib/access.functions.ts` (server functions com `requireSupabaseAuth`): garantir perfil no login, listar pendentes, aprovar/recusar, listar/criar/remover convites.
- `src/hooks/use-access.ts`: expõe `status`, `papel`, `donoId`, `somenteLeitura`, `isAdmin`.
- Wrapper dentro de `src/routes/_authenticated/`: após o gate de sessão, registra o perfil e mostra a tela de "aguardando aprovação" / "acesso recusado" quando aplicável.
- Nova rota `src/routes/_authenticated/acessos.tsx` (só admin): aprovações pendentes + convites, com `head()` próprio.
- Leitura dos dados passa a usar `donoId` (estoque do dono) em vez do próprio `user_id` quando o usuário é visualizador — ajuste em `src/lib/inventory-store.ts`.
- Esconder ações de escrita quando `somenteLeitura`: `AppHeader` (link Acessos só para admin), `estoque.tsx`, `produtos.tsx`, `produto.$id.tsx`, `EntrySheet`, `ProductDialog`, `ImportDialog`.