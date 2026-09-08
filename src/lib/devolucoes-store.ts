import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Devolucao {
  id: string;
  data: string; // yyyy-mm-dd
  empresa: string;
  material: string;
  unidade: string;
  enviada: number;
  retornada: number;
  observacao: string;
  createdAt: number;
}

export type DevolucaoInput = Omit<Devolucao, "id" | "createdAt">;

export const UNIDADES_DEVOLUCAO = ["kg", "t", "un", "cx", "L", "m"] as const;

const PAGE = 1000;
const DEVOLUCOES_QUERY_KEY = ["devolucoes"] as const;

export function formatarData(d: string) {
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a}`;
}

export function formatarNumero(v: number) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

/** Diferença entre o que voltou e o que foi enviado. */
export function calcularDiferenca(d: Pick<Devolucao, "enviada" | "retornada">) {
  return d.retornada - d.enviada;
}

/** Percentual da diferença sobre o total enviado. */
export function percentualDiferenca(d: Pick<Devolucao, "enviada" | "retornada">) {
  if (!d.enviada) return 0;
  return (calcularDiferenca(d) / d.enviada) * 100;
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

function mapRow(r: any): Devolucao {
  return {
    id: r.id,
    data: r.data,
    empresa: r.empresa ?? "",
    material: r.material ?? "",
    unidade: r.unidade ?? "kg",
    enviada: Number(r.quantidade_enviada),
    retornada: Number(r.quantidade_retornada),
    observacao: r.observacao ?? "",
    createdAt: new Date(r.created_at).getTime(),
  };
}

async function fetchDevolucoes(): Promise<Devolucao[]> {
  const out: Devolucao[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("devolucoes")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(...rows.map(mapRow));
    if (rows.length < PAGE) break;
  }
  return out;
}

export function useDevolucoes() {
  const qc = useQueryClient();

  const query = useQuery({ queryKey: DEVOLUCOES_QUERY_KEY, queryFn: fetchDevolucoes });

  const refetchDevolucoes = useCallback(async () => {
    await qc.refetchQueries(
      { queryKey: DEVOLUCOES_QUERY_KEY, type: "all" },
      { throwOnError: true },
    );
  }, [qc]);

  const addDevolucao = useCallback(
    async (d: DevolucaoInput) => {
      const user_id = await requireUserId();
      const { data, error } = await supabase
        .from("devolucoes")
        .insert({
          user_id,
          data: d.data,
          empresa: d.empresa,
          material: d.material,
          unidade: d.unidade,
          quantidade_enviada: d.enviada,
          quantidade_retornada: d.retornada,
          observacao: d.observacao ?? "",
        })
        .select("*")
        .single();
      if (error) throw error;
      await refetchDevolucoes();
      return mapRow(data);
    },
    [refetchDevolucoes],
  );

  const updateDevolucao = useCallback(
    async (id: string, d: Partial<DevolucaoInput>) => {
      const { data, error } = await supabase
        .from("devolucoes")
        .update({
          ...(d.data !== undefined ? { data: d.data } : {}),
          ...(d.empresa !== undefined ? { empresa: d.empresa } : {}),
          ...(d.material !== undefined ? { material: d.material } : {}),
          ...(d.unidade !== undefined ? { unidade: d.unidade } : {}),
          ...(d.enviada !== undefined ? { quantidade_enviada: d.enviada } : {}),
          ...(d.retornada !== undefined ? { quantidade_retornada: d.retornada } : {}),
          ...(d.observacao !== undefined ? { observacao: d.observacao } : {}),
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      await refetchDevolucoes();
      return mapRow(data);
    },
    [refetchDevolucoes],
  );

  const deleteDevolucao = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("devolucoes").delete().eq("id", id);
      if (error) throw error;
      await refetchDevolucoes();
    },
    [refetchDevolucoes],
  );

  const devolucoes = useMemo(() => query.data ?? [], [query.data]);

  return {
    devolucoes,
    carregando: query.isLoading,
    addDevolucao,
    updateDevolucao,
    deleteDevolucao,
  };
}
