import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Viagem {
  id: string; data: string; origem: string; destino: string; veiculoId: string | null;
  motorista: string; distanciaKm: number | null; tempoEstimadoMin: number | null;
  tempoRealMin: number | null; observacao: string; createdAt: number;
  clienteId: string | null; saiuEmpresa: boolean; saidaEm: string | null; chegadaEm: string | null;
  houveParada: boolean; paradasQtd: number; paradasMin: number; paradasJustificativa: string;
}
export type ViagemInput = Omit<Viagem, "id" | "createdAt">;
export interface ClienteViagem { id: string; nome: string; endereco: string; observacao: string }

const K = ["viagens"] as const;
const KC = ["clientes_viagem"] as const;
const KE = ["empresa_config"] as const;
const n = (v: any) => (v == null ? null : Number(v));
const sb = supabase as any;

async function fetchViagens(): Promise<Viagem[]> {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("viagens").select("*")
      .order("data", { ascending: false }).order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return out.map((r) => ({
    id: r.id, data: r.data, origem: r.origem, destino: r.destino, veiculoId: r.veiculo_id,
    motorista: r.motorista ?? "", distanciaKm: n(r.distancia_km), tempoEstimadoMin: n(r.tempo_estimado_min),
    tempoRealMin: n(r.tempo_real_min), observacao: r.observacao ?? "", createdAt: new Date(r.created_at).getTime(),
    clienteId: r.cliente_id ?? null, saiuEmpresa: !!r.saiu_empresa, saidaEm: r.saida_em, chegadaEm: r.chegada_em,
    houveParada: !!r.houve_parada, paradasQtd: Number(r.paradas_qtd ?? 0), paradasMin: Number(r.paradas_min ?? 0),
    paradasJustificativa: r.paradas_justificativa ?? "",
  }));
}

const toRow = (v: ViagemInput) => ({
  data: v.data, origem: v.origem, destino: v.destino, veiculo_id: v.veiculoId, motorista: v.motorista,
  distancia_km: v.distanciaKm, tempo_estimado_min: v.tempoEstimadoMin, tempo_real_min: v.tempoRealMin,
  observacao: v.observacao, cliente_id: v.clienteId, saiu_empresa: v.saiuEmpresa,
  saida_em: v.saidaEm, chegada_em: v.chegadaEm, houve_parada: v.houveParada,
  paradas_qtd: v.houveParada ? v.paradasQtd : 0, paradas_min: v.houveParada ? v.paradasMin : 0,
  paradas_justificativa: v.houveParada ? v.paradasJustificativa : "",
});

/** Minutos entre saída e chegada (datetime-local ou ISO). */
export function duracaoMin(saida: string | null, chegada: string | null): number | null {
  if (!saida || !chegada) return null;
  const a = new Date(saida).getTime(), b = new Date(chegada).getTime();
  if (isNaN(a) || isNaN(b) || b < a) return null;
  return Math.round((b - a) / 60000);
}

/** Tempo rodando = real − paradas; diferença = rodando − estimado. */
export function diferencaMin(v: Pick<Viagem, "tempoRealMin" | "tempoEstimadoMin" | "houveParada" | "paradasMin">) {
  if (v.tempoRealMin == null || v.tempoEstimadoMin == null) return null;
  const rodando = v.tempoRealMin - (v.houveParada ? v.paradasMin : 0);
  return rodando - v.tempoEstimadoMin;
}

export function useViagens() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: K, queryFn: fetchViagens });
  const qc2 = useQuery({
    queryKey: KC, queryFn: async (): Promise<ClienteViagem[]> => {
      const { data, error } = await sb.from("clientes_viagem").select("*").order("nome");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ id: r.id, nome: r.nome, endereco: r.endereco, observacao: r.observacao }));
    },
  });
  const qe = useQuery({
    queryKey: KE, queryFn: async (): Promise<string> => {
      const { data, error } = await sb.from("empresa_config").select("endereco").limit(1);
      if (error) throw error;
      return data?.[0]?.endereco ?? "";
    },
  });
  const refetch = useCallback(() => qc.refetchQueries({ queryKey: K, type: "all" }, { throwOnError: true }), [qc]);
  const salvar = useCallback(async (v: ViagemInput, id?: string | null) => {
    const t = sb.from("viagens");
    const { error } = id ? await t.update(toRow(v)).eq("id", id) : await t.insert(toRow(v));
    if (error) throw error;
    await refetch();
  }, [refetch]);
  const excluir = useCallback(async (id: string) => {
    const { error } = await sb.from("viagens").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }, [refetch]);
  const salvarCliente = useCallback(async (c: Omit<ClienteViagem, "id">): Promise<string> => {
    const { data, error } = await sb.from("clientes_viagem").insert(c).select("id").single();
    if (error) throw error;
    await qc.refetchQueries({ queryKey: KC });
    return data.id;
  }, [qc]);
  const salvarEnderecoEmpresa = useCallback(async (endereco: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("empresa_config").upsert({ user_id: u.user?.id, endereco }, { onConflict: "user_id" });
    if (error) throw error;
    await qc.refetchQueries({ queryKey: KE });
  }, [qc]);
  return {
    viagens: q.data ?? [], carregando: q.isLoading, salvar, excluir,
    clientes: qc2.data ?? [], salvarCliente, enderecoEmpresa: qe.data ?? "", salvarEnderecoEmpresa,
  };
}

/** "2h 15min" */
export function fmtTempo(min: number | null) {
  if (min == null) return "—";
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min`;
}
