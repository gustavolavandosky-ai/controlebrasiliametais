import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Viagem {
  id: string; data: string; origem: string; destino: string; veiculoId: string | null;
  motorista: string; distanciaKm: number | null; tempoEstimadoMin: number | null;
  pedagioEstimado: number | null; tempoRealMin: number | null; pedagioReal: number | null;
  observacao: string; createdAt: number;
}
export type ViagemInput = Omit<Viagem, "id" | "createdAt">;

const K = ["viagens"] as const;
const n = (v: any) => (v == null ? null : Number(v));

async function fetchViagens(): Promise<Viagem[]> {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await (supabase as any).from("viagens").select("*")
      .order("data", { ascending: false }).order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return out.map((r) => ({
    id: r.id, data: r.data, origem: r.origem, destino: r.destino, veiculoId: r.veiculo_id,
    motorista: r.motorista ?? "", distanciaKm: n(r.distancia_km), tempoEstimadoMin: n(r.tempo_estimado_min),
    pedagioEstimado: n(r.pedagio_estimado), tempoRealMin: n(r.tempo_real_min), pedagioReal: n(r.pedagio_real),
    observacao: r.observacao ?? "", createdAt: new Date(r.created_at).getTime(),
  }));
}

const toRow = (v: ViagemInput) => ({
  data: v.data, origem: v.origem, destino: v.destino, veiculo_id: v.veiculoId, motorista: v.motorista,
  distancia_km: v.distanciaKm, tempo_estimado_min: v.tempoEstimadoMin, pedagio_estimado: v.pedagioEstimado,
  tempo_real_min: v.tempoRealMin, pedagio_real: v.pedagioReal, observacao: v.observacao,
});

export function useViagens() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: K, queryFn: fetchViagens });
  const refetch = useCallback(() => qc.refetchQueries({ queryKey: K, type: "all" }, { throwOnError: true }), [qc]);
  const salvar = useCallback(async (v: ViagemInput, id?: string | null) => {
    const t = (supabase as any).from("viagens");
    const { error } = id ? await t.update(toRow(v)).eq("id", id) : await t.insert(toRow(v));
    if (error) throw error;
    await refetch();
  }, [refetch]);
  const excluir = useCallback(async (id: string) => {
    const { error } = await (supabase as any).from("viagens").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }, [refetch]);
  return { viagens: q.data ?? [], carregando: q.isLoading, salvar, excluir };
}

/** "2h 15min" */
export function fmtTempo(min: number | null) {
  if (min == null) return "—";
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min`;
}
