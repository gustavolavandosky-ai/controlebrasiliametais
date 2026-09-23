import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Unidade } from "@/lib/inventory-store";

export type TipoEpiLancamento = "entrada" | "saida" | "balanco";

export interface Equipamento {
  id: string;
  nome: string;
  unidade: Unidade;
  estoqueInicial: number;
  localizacao: string;
  observacoes: string;
  createdAt: number;
}

export interface EpiLancamento {
  id: string;
  equipamentoId: string;
  tipo: TipoEpiLancamento;
  quantidade: number;
  unidade: Unidade;
  data: string;
  hora: string;
  retiradoPor: string;
  motivo: string;
  observacao: string;
  createdAt: number;
}

type EquipamentoInput = Omit<Equipamento, "id" | "createdAt">;
type EpiLancamentoInput = Omit<EpiLancamento, "id" | "createdAt">;

const PAGE = 1000;
const EQUIPAMENTOS_KEY = ["equipamentos"] as const;
const EPI_LANCAMENTOS_KEY = ["epi_lancamentos"] as const;

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

async function fetchAll<T>(tabela: "equipamentos" | "epi_lancamentos"): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

function mapEquipamento(r: any): Equipamento {
  return {
    id: r.id,
    nome: r.nome,
    unidade: r.unidade as Unidade,
    estoqueInicial: Number(r.estoque_inicial),
    localizacao: r.localizacao ?? "",
    observacoes: r.observacoes ?? "",
    createdAt: new Date(r.created_at).getTime(),
  };
}

function mapLancamento(r: any): EpiLancamento {
  return {
    id: r.id,
    equipamentoId: r.equipamento_id,
    tipo: r.tipo as TipoEpiLancamento,
    quantidade: Number(r.quantidade),
    unidade: r.unidade as Unidade,
    data: r.data,
    hora: r.hora,
    retiradoPor: r.retirado_por ?? "",
    motivo: r.motivo ?? "",
    observacao: r.observacao ?? "",
    createdAt: new Date(r.created_at).getTime(),
  };
}

export function useEpi() {
  const qc = useQueryClient();

  const equipamentosQuery = useQuery({
    queryKey: EQUIPAMENTOS_KEY,
    queryFn: async () => (await fetchAll<any>("equipamentos")).map(mapEquipamento),
  });
  const lancamentosQuery = useQuery({
    queryKey: EPI_LANCAMENTOS_KEY,
    queryFn: async () => (await fetchAll<any>("epi_lancamentos")).map(mapLancamento),
  });

  const refetchTudo = useCallback(async () => {
    await Promise.all([
      qc.refetchQueries({ queryKey: EQUIPAMENTOS_KEY, type: "all" }, { throwOnError: true }),
      qc.refetchQueries({ queryKey: EPI_LANCAMENTOS_KEY, type: "all" }, { throwOnError: true }),
    ]);
  }, [qc]);

  const addEquipamento = useCallback(
    async (e: EquipamentoInput) => {
      const user_id = await requireUserId();
      const { data, error } = await supabase
        .from("equipamentos")
        .insert({
          user_id,
          nome: e.nome,
          unidade: e.unidade,
          estoque_inicial: e.estoqueInicial,
          localizacao: e.localizacao,
          observacoes: e.observacoes,
        })
        .select("id")
        .single();
      if (error) throw error;
      await refetchTudo();
      return data.id as string;
    },
    [refetchTudo],
  );

  const updateEquipamento = useCallback(
    async (id: string, e: Partial<EquipamentoInput>) => {
      const { error } = await supabase
        .from("equipamentos")
        .update({
          ...(e.nome !== undefined ? { nome: e.nome } : {}),
          ...(e.unidade !== undefined ? { unidade: e.unidade } : {}),
          ...(e.estoqueInicial !== undefined ? { estoque_inicial: e.estoqueInicial } : {}),
          ...(e.localizacao !== undefined ? { localizacao: e.localizacao } : {}),
          ...(e.observacoes !== undefined ? { observacoes: e.observacoes } : {}),
        })
        .eq("id", id);
      if (error) throw error;
      await refetchTudo();
    },
    [refetchTudo],
  );

  const deleteEquipamento = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("equipamentos").delete().eq("id", id);
      if (error) throw error;
      await refetchTudo();
    },
    [refetchTudo],
  );

  const addLancamento = useCallback(
    async (l: EpiLancamentoInput) => {
      const user_id = await requireUserId();
      const { data, error } = await supabase
        .from("epi_lancamentos")
        .insert({
          user_id,
          equipamento_id: l.equipamentoId,
          tipo: l.tipo,
          quantidade: l.quantidade,
          unidade: l.unidade,
          data: l.data,
          hora: l.hora,
          retirado_por: l.retiradoPor ?? "",
          motivo: l.motivo ?? "",
          observacao: l.observacao ?? "",
        })
        .select("*")
        .single();
      if (error) throw error;
      const novo = mapLancamento(data);
      qc.setQueryData<EpiLancamento[]>(EPI_LANCAMENTOS_KEY, (atual) =>
        atual ? [...atual.filter((i) => i.id !== novo.id), novo] : [novo],
      );
      await refetchTudo();
      return novo;
    },
    [qc, refetchTudo],
  );

  const updateLancamento = useCallback(
    async (id: string, l: Partial<EpiLancamentoInput>) => {
      const { data, error } = await supabase
        .from("epi_lancamentos")
        .update({
          ...(l.tipo !== undefined ? { tipo: l.tipo } : {}),
          ...(l.quantidade !== undefined ? { quantidade: l.quantidade } : {}),
          ...(l.unidade !== undefined ? { unidade: l.unidade } : {}),
          ...(l.data !== undefined ? { data: l.data } : {}),
          ...(l.hora !== undefined ? { hora: l.hora } : {}),
          ...(l.retiradoPor !== undefined ? { retirado_por: l.retiradoPor } : {}),
          ...(l.motivo !== undefined ? { motivo: l.motivo } : {}),
          ...(l.observacao !== undefined ? { observacao: l.observacao } : {}),
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const atualizado = mapLancamento(data);
      qc.setQueryData<EpiLancamento[]>(EPI_LANCAMENTOS_KEY, (atual) =>
        atual?.map((i) => (i.id === id ? atualizado : i)),
      );
      await refetchTudo();
      return atualizado;
    },
    [qc, refetchTudo],
  );

  const deleteLancamento = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("epi_lancamentos").delete().eq("id", id);
      if (error) throw error;
      qc.setQueryData<EpiLancamento[]>(EPI_LANCAMENTOS_KEY, (atual) =>
        atual?.filter((i) => i.id !== id),
      );
      await refetchTudo();
    },
    [qc, refetchTudo],
  );

  const equipamentos = useMemo(() => equipamentosQuery.data ?? [], [equipamentosQuery.data]);
  const lancamentos = useMemo(() => lancamentosQuery.data ?? [], [lancamentosQuery.data]);

  return {
    equipamentos,
    lancamentos,
    carregando: equipamentosQuery.isLoading || lancamentosQuery.isLoading,
    addEquipamento,
    updateEquipamento,
    deleteEquipamento,
    addLancamento,
    updateLancamento,
    deleteLancamento,
  };
}

export function compararCronologicoEpi(a: EpiLancamento, b: EpiLancamento): number {
  const ka = `${a.data} ${a.hora ?? ""}`;
  const kb = `${b.data} ${b.hora ?? ""}`;
  if (ka !== kb) return ka < kb ? -1 : 1;
  return a.createdAt - b.createdAt;
}

export function calcularEstoqueEpi(
  equipamento: Equipamento,
  lancamentos: EpiLancamento[],
): number {
  const lots = lancamentos
    .filter((l) => l.equipamentoId === equipamento.id)
    .sort(compararCronologicoEpi);
  let saldo = equipamento.estoqueInicial;
  for (const l of lots) {
    if (l.tipo === "entrada") saldo += l.quantidade;
    else if (l.tipo === "saida") saldo -= l.quantidade;
    else saldo = l.quantidade;
  }
  return saldo;
}

export function calcularSaldoAteLancamentoEpi(
  equipamento: Equipamento,
  lancamentos: EpiLancamento[],
  lancamentoId: string,
): { antes: number; depois: number } {
  const lots = lancamentos
    .filter((l) => l.equipamentoId === equipamento.id)
    .sort(compararCronologicoEpi);
  let antes = equipamento.estoqueInicial;
  let depois = equipamento.estoqueInicial;
  for (const l of lots) {
    if (l.id === lancamentoId) antes = depois;
    if (l.tipo === "entrada") depois += l.quantidade;
    else if (l.tipo === "saida") depois -= l.quantidade;
    else depois = l.quantidade;
    if (l.id === lancamentoId) return { antes, depois };
  }
  return { antes, depois };
}
