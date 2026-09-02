import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Unidade = "un" | "kg" | "g" | "L" | "mL" | "cx" | "pct" | "m";
export const UNIDADES: Unidade[] = ["un", "kg", "g", "L", "mL", "cx", "pct", "m"];

export type TipoLancamento = "entrada" | "saida" | "balanco";

export interface Lancamento {
  id: string;
  produtoId: string;
  tipo: TipoLancamento;
  quantidade: number;
  unidade: Unidade;
  data: string; // yyyy-mm-dd
  hora: string; // HH:mm
  observacao: string;
  createdAt: number;
}

export interface Produto {
  id: string;
  nome: string;
  unidade: Unidade;
  estoqueInicial: number;
  observacoes: string;
  localizacao: string;
  createdAt: number;
}

type ProdutoInput = Omit<Produto, "id" | "createdAt">;
type LancamentoInput = Omit<Lancamento, "id" | "createdAt">;

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

const PAGE = 1000;

/** Busca todas as linhas contornando o limite padrão de 1000 do PostgREST. */
async function fetchAll<T>(tabela: "produtos" | "lancamentos"): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

async function fetchProdutos(): Promise<Produto[]> {
  const data = await fetchAll<any>("produtos");
  return data.map((r) => ({
    id: r.id,
    nome: r.nome,
    unidade: r.unidade as Unidade,
    estoqueInicial: Number(r.estoque_inicial),
    observacoes: r.observacoes ?? "",
    localizacao: r.localizacao ?? "",
    createdAt: new Date(r.created_at).getTime(),
  }));
}

async function fetchLancamentos(): Promise<Lancamento[]> {
  const data = await fetchAll<any>("lancamentos");
  return data.map((r) => ({
    id: r.id,
    produtoId: r.produto_id,
    tipo: r.tipo as TipoLancamento,
    quantidade: Number(r.quantidade),
    unidade: r.unidade as Unidade,
    data: r.data,
    hora: r.hora,
    observacao: r.observacao ?? "",
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export function useInventory() {
  const qc = useQueryClient();

  const produtosQuery = useQuery({ queryKey: ["produtos"], queryFn: fetchProdutos });
  const lancamentosQuery = useQuery({ queryKey: ["lancamentos"], queryFn: fetchLancamentos });

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["produtos"] }),
      qc.invalidateQueries({ queryKey: ["lancamentos"] }),
    ]);
  }, [qc]);

  const addProduto = useCallback(
    async (p: ProdutoInput) => {
      const user_id = await requireUserId();
      const { data, error } = await supabase
        .from("produtos")
        .insert({
          user_id,
          nome: p.nome,
          unidade: p.unidade,
          estoque_inicial: p.estoqueInicial,
          observacoes: p.observacoes,
          localizacao: p.localizacao,
        })
        .select("id")
        .single();
      if (error) throw error;
      await invalidate();
      return data.id as string;
    },
    [invalidate],
  );

  const updateProduto = useCallback(
    async (id: string, p: Partial<ProdutoInput>) => {
      const { error } = await supabase
        .from("produtos")
        .update({
          ...(p.nome !== undefined ? { nome: p.nome } : {}),
          ...(p.unidade !== undefined ? { unidade: p.unidade } : {}),
          ...(p.estoqueInicial !== undefined ? { estoque_inicial: p.estoqueInicial } : {}),
          ...(p.observacoes !== undefined ? { observacoes: p.observacoes } : {}),
          ...(p.localizacao !== undefined ? { localizacao: p.localizacao } : {}),
        })
        .eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const deleteProduto = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const addLancamento = useCallback(
    async (l: LancamentoInput) => {
      const user_id = await requireUserId();
      const { error } = await supabase.from("lancamentos").insert({
        user_id,
        produto_id: l.produtoId,
        tipo: l.tipo,
        quantidade: l.quantidade,
        unidade: l.unidade,
        data: l.data,
        hora: l.hora,
        observacao: l.observacao ?? "",
      });
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const updateLancamento = useCallback(
    async (id: string, l: Partial<LancamentoInput>) => {
      const { error } = await supabase
        .from("lancamentos")
        .update({
          ...(l.tipo !== undefined ? { tipo: l.tipo } : {}),
          ...(l.quantidade !== undefined ? { quantidade: l.quantidade } : {}),
          ...(l.unidade !== undefined ? { unidade: l.unidade } : {}),
          ...(l.data !== undefined ? { data: l.data } : {}),
          ...(l.hora !== undefined ? { hora: l.hora } : {}),
          ...(l.observacao !== undefined ? { observacao: l.observacao } : {}),
        })
        .eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const deleteLancamento = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("lancamentos").delete().eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const importarProdutos = useCallback(
    async (
      rows: (ProdutoInput & { saldoInicial?: number })[],
      criarBalanco: boolean,
    ) => {
      const user_id = await requireUserId();
      const { data, error } = await supabase
        .from("produtos")
        .insert(
          rows.map((r) => ({
            user_id,
            nome: r.nome,
            unidade: r.unidade,
            estoque_inicial: r.estoqueInicial,
            observacoes: r.observacoes,
            localizacao: r.localizacao,
          })),
        )
        .select("id");
      if (error) throw error;

      if (criarBalanco) {
        const now = new Date();
        const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const lancs = (data ?? [])
          .map((row, i) => ({ row, r: rows[i]! }))
          .filter(({ r }) => (r.saldoInicial ?? 0) !== 0)
          .map(({ row, r }) => ({
            user_id,
            produto_id: row.id,
            tipo: "balanco",
            quantidade: r.saldoInicial ?? 0,
            unidade: r.unidade,
            data: now.toISOString().slice(0, 10),
            hora,
          }));
        if (lancs.length > 0) {
          const { error: lErr } = await supabase.from("lancamentos").insert(lancs);
          if (lErr) throw lErr;
        }
      }

      await invalidate();
      return (data ?? []).length;
    },
    [invalidate],
  );

  const produtos = useMemo(() => produtosQuery.data ?? [], [produtosQuery.data]);
  const lancamentos = useMemo(() => lancamentosQuery.data ?? [], [lancamentosQuery.data]);

  return {
    produtos,
    lancamentos,
    carregando: produtosQuery.isLoading || lancamentosQuery.isLoading,
    addProduto,
    updateProduto,
    deleteProduto,
    addLancamento,
    updateLancamento,
    deleteLancamento,
    importarProdutos,
  };
}

/** Ordena do mais antigo para o mais novo por data + hora (empate: criação). */
export function compararCronologico(a: Lancamento, b: Lancamento): number {
  const ka = `${a.data} ${a.hora ?? ""}`;
  const kb = `${b.data} ${b.hora ?? ""}`;
  if (ka !== kb) return ka < kb ? -1 : 1;
  return a.createdAt - b.createdAt;
}

export function calcularEstoque(
  produto: Produto,
  lancamentos: Lancamento[],
): number {
  const lots = lancamentos
    .filter((l) => l.produtoId === produto.id)
    .sort(compararCronologico);
  let saldo = produto.estoqueInicial;
  for (const l of lots) {
    if (l.tipo === "entrada") saldo += l.quantidade;
    else if (l.tipo === "saida") saldo -= l.quantidade;
    else saldo = l.quantidade; // balanço
  }
  return saldo;
}

export function calcularSaldoAteLancamento(
  produto: Produto,
  lancamentos: Lancamento[],
  lancamentoId: string,
): { antes: number; depois: number } {
  const lots = lancamentos
    .filter((l) => l.produtoId === produto.id)
    .sort(compararCronologico);

  let antes = produto.estoqueInicial;
  let depois = produto.estoqueInicial;

  for (const l of lots) {
    if (l.id === lancamentoId) {
      antes = depois;
    }
    if (l.tipo === "entrada") depois += l.quantidade;
    else if (l.tipo === "saida") depois -= l.quantidade;
    else depois = l.quantidade;
    if (l.id === lancamentoId) {
      return { antes, depois };
    }
  }

  return { antes, depois };
}