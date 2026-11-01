import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CentroCusto {
  id: string;
  nome: string;
  descricao: string;
}

export interface Gasto {
  id: string;
  centroId: string | null;
  veiculoId?: string | null;
  data: string;
  descricao: string;
  categoria: string;
  fornecedor: string;
  formaPagamento: string;
  notaFiscal: string;
  valor: number;
  observacao: string;
  createdAt: number;
}

export type GastoInput = Omit<Gasto, "id" | "createdAt">;

export const FORMAS_PAGAMENTO = ["Dinheiro", "PIX", "Cartão de crédito", "Cartão de débito", "Boleto", "Transferência", "Outro"];

const PAGE = 1000;

export const formatarMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function formatarData(d: string) {
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a}`;
}

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

async function fetchCentros(): Promise<CentroCusto[]> {
  const { data, error } = await supabase.from("centros_custo").select("*").order("nome");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, nome: r.nome, descricao: r.descricao ?? "" }));
}

async function fetchGastos(): Promise<Gasto[]> {
  const out: Gasto[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(
      ...rows.map((r) => ({
        id: r.id,
        centroId: r.centro_id ?? null,
        veiculoId: (r as any).veiculo_id ?? null,
        data: r.data,
        descricao: r.descricao ?? "",
        categoria: r.categoria ?? "",
        fornecedor: r.fornecedor ?? "",
        formaPagamento: r.forma_pagamento ?? "",
        notaFiscal: r.nota_fiscal ?? "",
        valor: Number(r.valor),
        observacao: r.observacao ?? "",
        createdAt: new Date(r.created_at).getTime(),
      })),
    );
    if (rows.length < PAGE) break;
  }
  return out;
}

function toRow(g: GastoInput) {
  return {
    centro_id: g.centroId || null,
    ...(g.veiculoId !== undefined ? { veiculo_id: g.veiculoId || null } : {}),
    data: g.data,
    descricao: g.descricao,
    categoria: g.categoria,
    fornecedor: g.fornecedor,
    forma_pagamento: g.formaPagamento,
    nota_fiscal: g.notaFiscal,
    valor: g.valor,
    observacao: g.observacao,
  };
}

export function useFinanceiro() {
  const qc = useQueryClient();
  const centrosQ = useQuery({ queryKey: ["centros_custo"], queryFn: fetchCentros });
  const gastosQ = useQuery({ queryKey: ["gastos"], queryFn: fetchGastos });

  const refetch = useCallback(async () => {
    await Promise.all([
      qc.refetchQueries({ queryKey: ["centros_custo"], type: "all" }, { throwOnError: true }),
      qc.refetchQueries({ queryKey: ["gastos"], type: "all" }, { throwOnError: true }),
    ]);
  }, [qc]);

  const salvarCentro = useCallback(
    async (c: { id?: string; nome: string; descricao: string }) => {
      if (c.id) {
        const { error } = await supabase.from("centros_custo").update({ nome: c.nome, descricao: c.descricao }).eq("id", c.id);
        if (error) throw error;
      } else {
        const user_id = await requireUserId();
        const { error } = await supabase.from("centros_custo").insert({ user_id, nome: c.nome, descricao: c.descricao });
        if (error) throw error;
      }
      await refetch();
    },
    [refetch],
  );

  const excluirCentro = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("centros_custo").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const salvarGasto = useCallback(
    async (g: GastoInput, id?: string) => {
      if (id) {
        const { error } = await supabase.from("gastos").update(toRow(g)).eq("id", id);
        if (error) throw error;
      } else {
        const user_id = await requireUserId();
        const { error } = await supabase.from("gastos").insert({ user_id, ...toRow(g) });
        if (error) throw error;
      }
      await refetch();
    },
    [refetch],
  );

  const excluirGasto = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const centros = useMemo(() => centrosQ.data ?? [], [centrosQ.data]);
  const gastos = useMemo(() => gastosQ.data ?? [], [gastosQ.data]);

  return {
    centros,
    gastos,
    carregando: centrosQ.isLoading || gastosQ.isLoading,
    salvarCentro,
    excluirCentro,
    salvarGasto,
    excluirGasto,
  };
}
