import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lancamento } from "@/lib/inventory-store";

export type ControleUnidade = "fardo" | "bag" | "palete" | null;
export type TipoApontamento = "bag" | "palete" | "contagem_fardo";

export interface Apontamento {
  id: string;
  produtoId: string;
  tipo: TipoApontamento;
  quantidade: number;
  pesoKg: number | null;
  saldoCalculado: number | null;
  responsavel: string;
  justificativa: string;
  data: string;
  createdAt: number;
}

/** Normaliza (maiúsculas, acentos, espaços) sem renomear o dado salvo. */
export function normalizarLocal(s: string) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function controlePorLocal(localizacao: string): ControleUnidade {
  const n = normalizarLocal(localizacao);
  if (n === "MATERIAL ENFARDADO") return "fardo";
  if (n === "MATERIAL EMBEGADO") return "bag";
  if (n === "MATERIAL EM PALETE") return "palete";
  return null;
}

export const NOME_UNIDADE = { fardo: "Fardos", bag: "Bags", palete: "Paletes" } as const;

/**
 * Saldo de fardos: parte da última contagem física (ou 0) e soma os lançamentos
 * criados depois dela que tenham fardos informados. Saídas sem fardos viram pendência.
 */
export function calcularFardos(lancs: Lancamento[], aponts: Apontamento[]) {
  const contagem = aponts
    .filter((a) => a.tipo === "contagem_fardo")
    .sort((a, b) => a.createdAt - b.createdAt)
    .at(-1);
  const corte = contagem?.createdAt ?? -Infinity;
  let saldo = contagem?.quantidade ?? 0;
  const pendentes: Lancamento[] = [];
  for (const l of [...lancs].sort((a, b) => a.createdAt - b.createdAt)) {
    if (l.createdAt <= corte) continue;
    if (l.tipo === "entrada" && l.fardos != null) saldo += l.fardos;
    else if (l.tipo === "saida") {
      if (l.fardos != null) saldo -= l.fardos;
      else pendentes.push(l);
    }
  }
  return { saldo, pendentes, contagem: contagem ?? null };
}

/** Apenas o último apontamento vale como situação atual. */
export function ultimoApontamento(aponts: Apontamento[], tipo: "bag" | "palete") {
  return (
    aponts
      .filter((a) => a.tipo === tipo)
      .sort((a, b) => a.createdAt - b.createdAt)
      .at(-1) ?? null
  );
}

const KEY = ["unidades_apontamentos"] as const;

function map(r: any): Apontamento {
  return {
    id: r.id,
    produtoId: r.produto_id,
    tipo: r.tipo,
    quantidade: Number(r.quantidade),
    pesoKg: r.peso_kg == null ? null : Number(r.peso_kg),
    saldoCalculado: r.saldo_calculado,
    responsavel: r.responsavel ?? "",
    justificativa: r.justificativa ?? "",
    data: r.data,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export function useApontamentos(produtoId: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: [...KEY, produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_apontamentos")
        .select("*")
        .eq("produto_id", produtoId)
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map(map);
    },
  });
  const add = useCallback(
    async (a: Omit<Apontamento, "id" | "createdAt" | "produtoId">) => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
      const { error } = await supabase.from("unidades_apontamentos").insert({
        user_id: data.user.id,
        produto_id: produtoId,
        tipo: a.tipo,
        quantidade: a.quantidade,
        peso_kg: a.pesoKg,
        saldo_calculado: a.saldoCalculado,
        responsavel: a.responsavel,
        justificativa: a.justificativa,
        data: a.data,
      });
      if (error) throw error;
      await qc.refetchQueries({ queryKey: [...KEY, produtoId] }, { throwOnError: true });
    },
    [qc, produtoId],
  );
  const apontamentos = useMemo(() => q.data ?? [], [q.data]);
  return { apontamentos, add };
}
