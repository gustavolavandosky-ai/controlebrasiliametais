import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Abastecimento, Veiculo } from "@/lib/abastecimento-store";

export const TIPOS_MANUTENCAO = [
  "Troca de óleo", "Filtros", "Pneus", "Freios", "Suspensão", "Elétrica", "Motor",
  "Câmbio/Embreagem", "Revisão", "Funilaria", "Outro",
];
/** Alertas: vence em até 1.000 km e/ou nos próximos 7 dias. */
export const ALERTA_KM = 1000;
export const ALERTA_DIAS = 7;

export interface Manutencao {
  id: string; veiculoId: string; data: string; km: number | null; tipo: string; descricao: string;
  fornecedor: string; valor: number; proximaKm: number | null; proximaData: string | null;
  observacao: string; createdAt: number;
}
export type ManutencaoInput = Omit<Manutencao, "id" | "createdAt">;
export interface KmAuditoria {
  id: string; veiculoId: string; kmAnterior: number | null; kmNovo: number; motivo: string;
  alteradoPor: string; createdAt: string;
}

const sb = supabase as any;
const num = (v: any) => (v == null ? null : Number(v));
const KM = ["manutencoes"] as const;
const KA = ["km_auditoria"] as const;

async function paged(table: string, order: string) {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select("*").order(order, { ascending: false })
      .order("id", { ascending: true }).range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

/** KM conhecido: o valor gravado no veículo; se ainda vazio, o maior KM dos registros. */
export function kmConhecido(v: Veiculo, abs: Abastecimento[], mans: Manutencao[]): number | null {
  if (v.kmAtual != null) return v.kmAtual;
  let mx: number | null = null;
  for (const a of abs) if (a.veiculoId === v.id && a.kmAtual != null) mx = Math.max(mx ?? 0, a.kmAtual);
  for (const m of mans) if (m.veiculoId === v.id && m.km != null) mx = Math.max(mx ?? 0, m.km);
  return mx;
}

export type StatusAlerta = "atrasada" | "a_vencer";
export interface Alerta { manutencao: Manutencao; status: StatusAlerta; faltamKm: number | null; faltamDias: number | null }

function diasAte(d: string, hoje: Date) {
  const alvo = new Date(d + "T00:00:00");
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo.getTime() - base.getTime()) / 86400000);
}

/** Só a manutenção mais recente de cada tipo por veículo gera alerta (sem duplicar avisos). */
export function calcularAlertas(mans: Manutencao[], km: (veiculoId: string) => number | null, hoje = new Date()): Alerta[] {
  const ultima = new Map<string, Manutencao>();
  for (const m of mans) {
    if (m.proximaKm == null && !m.proximaData) continue;
    const k = `${m.veiculoId}|${m.tipo.toLowerCase()}`;
    const atual = ultima.get(k);
    if (!atual || m.data > atual.data || (m.data === atual.data && m.createdAt > atual.createdAt)) ultima.set(k, m);
  }
  const out: Alerta[] = [];
  for (const m of ultima.values()) {
    const kmAtual = km(m.veiculoId);
    const faltamKm = m.proximaKm != null && kmAtual != null ? m.proximaKm - kmAtual : null;
    const faltamDias = m.proximaData ? diasAte(m.proximaData, hoje) : null;
    let status: StatusAlerta | null = null;
    if ((faltamKm != null && faltamKm < 0) || (faltamDias != null && faltamDias < 0)) status = "atrasada";
    else if ((faltamKm != null && faltamKm <= ALERTA_KM) || (faltamDias != null && faltamDias <= ALERTA_DIAS)) status = "a_vencer";
    if (status) out.push({ manutencao: m, status, faltamKm, faltamDias });
  }
  return out.sort((a, b) => (a.status === b.status ? 0 : a.status === "atrasada" ? -1 : 1));
}

export function useFrota() {
  const qc = useQueryClient();
  const qm = useQuery({
    queryKey: KM,
    queryFn: async (): Promise<Manutencao[]> => (await paged("manutencoes", "data")).map((r) => ({
      id: r.id, veiculoId: r.veiculo_id, data: r.data, km: num(r.km), tipo: r.tipo ?? "", descricao: r.descricao ?? "",
      fornecedor: r.fornecedor ?? "", valor: Number(r.valor ?? 0), proximaKm: num(r.proxima_km),
      proximaData: r.proxima_data ?? null, observacao: r.observacao ?? "", createdAt: new Date(r.created_at).getTime(),
    })),
  });
  const qa = useQuery({
    queryKey: KA,
    queryFn: async (): Promise<KmAuditoria[]> => (await paged("km_auditoria", "created_at")).map((r) => ({
      id: r.id, veiculoId: r.veiculo_id, kmAnterior: num(r.km_anterior), kmNovo: Number(r.km_novo),
      motivo: r.motivo, alteradoPor: r.alterado_por, createdAt: r.created_at,
    })),
  });

  const refetch = useCallback(async () => {
    await Promise.all([
      qc.refetchQueries({ queryKey: KM, type: "all" }, { throwOnError: true }),
      qc.refetchQueries({ queryKey: KA, type: "all" }, { throwOnError: true }),
      qc.refetchQueries({ queryKey: ["veiculos"], type: "all" }, { throwOnError: true }),
    ]);
  }, [qc]);

  const salvarManutencao = useCallback(async (m: ManutencaoInput, id?: string) => {
    const row = {
      veiculo_id: m.veiculoId, data: m.data, km: m.km, tipo: m.tipo, descricao: m.descricao, fornecedor: m.fornecedor,
      valor: m.valor, proxima_km: m.proximaKm, proxima_data: m.proximaData || null, observacao: m.observacao,
    };
    if (id) {
      const { error } = await sb.from("manutencoes").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
      const { error } = await sb.from("manutencoes").insert({ user_id: data.user.id, ...row });
      if (error) throw error;
    }
    await refetch();
  }, [refetch]);

  const corrigirKm = useCallback(async (veiculoId: string, km: number, motivo: string) => {
    const { error } = await sb.rpc("corrigir_km_veiculo", { _veiculo: veiculoId, _km: km, _motivo: motivo });
    if (error) throw error;
    await refetch();
  }, [refetch]);

  const manutencoes = useMemo(() => qm.data ?? [], [qm.data]);
  const auditoria = useMemo(() => qa.data ?? [], [qa.data]);
  return {
    manutencoes, auditoria, carregando: qm.isLoading || qa.isLoading,
    erro: (qm.error ?? qa.error) as Error | null, salvarManutencao, corrigirKm,
  };
}

export const fmtKm = (v: number | null) => (v == null ? "—" : `${v.toLocaleString("pt-BR")} km`);
