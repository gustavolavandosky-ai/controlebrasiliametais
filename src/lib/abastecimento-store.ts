import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const COMBUSTIVEIS = ["DIESEL", "GASOLINA", "ETANOL", "GNV"] as const;

export interface Veiculo { id: string; placa: string; modelo: string; ano: string; observacoes: string }
export type VeiculoInput = Omit<Veiculo, "id">;

export interface Abastecimento {
  id: string; veiculoId: string; data: string; combustivel: string;
  valor: number; litros: number; kmAtual: number | null;
  motorista: string; observacao: string; createdAt: number;
}
export type AbastecimentoInput = Omit<Abastecimento, "id" | "createdAt">;

const KV = ["veiculos"] as const;
const KA = ["abastecimentos"] as const;
const PAGE = 1000;

async function fetchPaged(table: "veiculos" | "abastecimentos") {
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select("*")
      .order("created_at", { ascending: true }).order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }
  return out;
}

const mapV = (r: any): Veiculo => ({ id: r.id, placa: r.placa, modelo: r.modelo, ano: r.ano, observacoes: r.observacoes });
const mapA = (r: any): Abastecimento => ({
  id: r.id, veiculoId: r.veiculo_id, data: r.data, combustivel: r.combustivel,
  valor: Number(r.valor), litros: Number(r.litros),
  kmAtual: r.km_atual == null ? null : Number(r.km_atual),
  motorista: r.motorista ?? "", observacao: r.observacao ?? "",
  createdAt: new Date(r.created_at).getTime(),
});
const toRowA = (a: AbastecimentoInput) => ({
  veiculo_id: a.veiculoId, data: a.data, combustivel: a.combustivel, valor: a.valor,
  litros: a.litros, km_atual: a.kmAtual, motorista: a.motorista, observacao: a.observacao,
});

export function compararAbast(a: Abastecimento, b: Abastecimento) {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1;
  return a.createdAt - b.createdAt;
}

/** KM rodados = KM atual − KM do abastecimento anterior do mesmo veículo; média = KM rodados ÷ litros. */
export function calcularMedias(abs: Abastecimento[]) {
  const res = new Map<string, { kmRodados: number | null; media: number | null }>();
  const porVeiculo = new Map<string, Abastecimento[]>();
  for (const a of abs) {
    const l = porVeiculo.get(a.veiculoId) ?? [];
    l.push(a); porVeiculo.set(a.veiculoId, l);
  }
  for (const lista of porVeiculo.values()) {
    lista.sort(compararAbast);
    let anterior: number | null = null;
    for (const a of lista) {
      let km: number | null = null;
      if (a.kmAtual != null && anterior != null && a.kmAtual > anterior) km = a.kmAtual - anterior;
      res.set(a.id, { kmRodados: km, media: km != null && a.litros > 0 ? km / a.litros : null });
      if (a.kmAtual != null) anterior = a.kmAtual;
    }
  }
  return res;
}

export function useAbastecimento() {
  const qc = useQueryClient();
  const qv = useQuery({ queryKey: KV, queryFn: async () => (await fetchPaged("veiculos")).map(mapV) });
  const qa = useQuery({ queryKey: KA, queryFn: async () => (await fetchPaged("abastecimentos")).map(mapA) });
  const refetch = useCallback(async () => {
    await Promise.all([
      qc.refetchQueries({ queryKey: KV, type: "all" }, { throwOnError: true }),
      qc.refetchQueries({ queryKey: KA, type: "all" }, { throwOnError: true }),
    ]);
  }, [qc]);

  const uid = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
    return data.user.id;
  };

  const salvarVeiculo = useCallback(async (v: VeiculoInput, id?: string) => {
    const { error } = id
      ? await supabase.from("veiculos").update(v).eq("id", id)
      : await supabase.from("veiculos").insert({ user_id: await uid(), ...v });
    if (error) throw error;
    await refetch();
  }, [refetch]);
  const excluirVeiculo = useCallback(async (id: string) => {
    const { error } = await supabase.from("veiculos").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }, [refetch]);
  const salvar = useCallback(async (a: AbastecimentoInput, id?: string) => {
    const { error } = id
      ? await supabase.from("abastecimentos").update(toRowA(a)).eq("id", id)
      : await supabase.from("abastecimentos").insert({ user_id: await uid(), ...toRowA(a) });
    if (error) throw error;
    await refetch();
  }, [refetch]);
  const excluir = useCallback(async (id: string) => {
    const { error } = await supabase.from("abastecimentos").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }, [refetch]);

  const veiculos = useMemo(
    () => [...(qv.data ?? [])].sort((a, b) => a.placa.localeCompare(b.placa, "pt-BR")),
    [qv.data],
  );
  const abastecimentos = useMemo(() => qa.data ?? [], [qa.data]);
  return { veiculos, abastecimentos, carregando: qv.isLoading || qa.isLoading, salvarVeiculo, excluirVeiculo, salvar, excluir };
}
