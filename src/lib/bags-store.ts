import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoBag = "entrada" | "saida" | "balanco";

export interface BagMov {
  id: string;
  tipo: TipoBag;
  data: string;
  quantidade: number;
  quantidadeRetornada: number;
  fornecedor: string;
  cliente: string;
  observacao: string;
  createdAt: number;
}
export type BagMovInput = Omit<BagMov, "id" | "createdAt">;

const KEY = ["bag_movimentos"] as const;
const PAGE = 1000;

function map(r: any): BagMov {
  return {
    id: r.id,
    tipo: r.tipo,
    data: r.data,
    quantidade: Number(r.quantidade),
    quantidadeRetornada: Number(r.quantidade_retornada),
    fornecedor: r.fornecedor ?? "",
    cliente: r.cliente ?? "",
    observacao: r.observacao ?? "",
    createdAt: new Date(r.created_at).getTime(),
  };
}

async function fetchAll(): Promise<BagMov[]> {
  const out: BagMov[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("bag_movimentos")
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(...rows.map(map));
    if (rows.length < PAGE) break;
  }
  return out;
}

function toRow(m: BagMovInput) {
  return {
    tipo: m.tipo,
    data: m.data,
    quantidade: m.quantidade,
    quantidade_retornada: m.tipo === "saida" ? m.quantidadeRetornada : 0,
    fornecedor: m.tipo === "entrada" ? m.fornecedor : "",
    cliente: m.tipo === "saida" ? m.cliente : "",
    observacao: m.observacao,
  };
}

export function compararBag(a: BagMov, b: BagMov) {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1;
  return a.createdAt - b.createdAt;
}

/** Efeito no estoque: entrada soma; saída tira (saiu − voltou); balanço define o valor. */
export function calcularSaldosBags(movs: BagMov[]) {
  const ord = [...movs].sort(compararBag);
  const saldos = new Map<string, { antes: number; depois: number }>();
  let s = 0;
  for (const m of ord) {
    const antes = s;
    if (m.tipo === "entrada") s += m.quantidade;
    else if (m.tipo === "saida") s -= m.quantidade - m.quantidadeRetornada;
    else s = m.quantidade;
    saldos.set(m.id, { antes, depois: s });
  }
  return { estoque: s, saldos };
}

export function useBags() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: KEY, queryFn: fetchAll });
  const refetch = useCallback(
    () => qc.refetchQueries({ queryKey: KEY, type: "all" }, { throwOnError: true }),
    [qc],
  );

  const add = useCallback(
    async (m: BagMovInput) => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
      const { error } = await supabase
        .from("bag_movimentos")
        .insert({ user_id: data.user.id, ...toRow(m) });
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );
  const update = useCallback(
    async (id: string, m: BagMovInput) => {
      const { error } = await supabase.from("bag_movimentos").update(toRow(m)).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );
  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("bag_movimentos").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const movimentos = useMemo(() => q.data ?? [], [q.data]);
  return { movimentos, carregando: q.isLoading, add, update, remove };
}
