import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Situacao = "pago" | "pendente";

export interface Diaria {
  id: string;
  data: string;
  colaborador: string;
  equipe: string;
  tipo: string;
  valor: number;
  destino: string;
  situacao: Situacao;
  troco: number | null;
  observacao: string;
  grupoId: string | null;
  createdAt: number;
}

export interface Colaborador {
  id: string;
  nome: string;
  equipe: string;
}

export interface TipoDiaria {
  id: string;
  nome: string;
  valorPadrao: number;
}

export interface Destino {
  id: string;
  nome: string;
}

export type DiariaInput = Omit<Diaria, "id" | "grupoId" | "createdAt"> & {
  grupoId?: string | null;
};

export interface GrupoDiaria {
  chave: string;
  grupoId: string | null;
  itens: Diaria[];
}

export const EQUIPES = ["LEO", "ADELSON", "ALMI", "GIL"] as const;

export const CORES_EQUIPE: Record<string, string> = {
  LEO: "var(--equipe-leo)",
  ADELSON: "var(--equipe-adelson)",
  ALMI: "var(--equipe-almi)",
  GIL: "var(--equipe-gil)",
};

export function formatarMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(d: string) {
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a}`;
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

async function fetchDiarias(): Promise<Diaria[]> {
  const PAGE = 1000;
  const data: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: rows, error } = await supabase
      .from("diarias")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    data.push(...(rows ?? []));
    if ((rows ?? []).length < PAGE) break;
  }
  return data.map((r) => ({
    id: r.id,
    data: r.data,
    colaborador: r.colaborador,
    equipe: r.equipe ?? "",
    tipo: r.tipo ?? "",
    valor: Number(r.valor),
    destino: r.destino ?? "",
    situacao: (r.situacao === "pago" ? "pago" : "pendente") as Situacao,
    troco: r.troco === null || r.troco === undefined ? null : Number(r.troco),
    observacao: r.observacao ?? "",
    grupoId: (r as { grupo_id?: string | null }).grupo_id ?? null,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export function agruparDiarias(lista: Diaria[]): GrupoDiaria[] {
  const grupos: GrupoDiaria[] = [];
  const porChave = new Map<string, GrupoDiaria>();
  for (const d of lista) {
    const chave = d.grupoId ?? d.id;
    const existente = porChave.get(chave);
    if (existente) {
      existente.itens.push(d);
    } else {
      const g: GrupoDiaria = { chave, grupoId: d.grupoId, itens: [d] };
      porChave.set(chave, g);
      grupos.push(g);
    }
  }
  return grupos;
}

async function fetchColaboradores(): Promise<Colaborador[]> {
  const { data, error } = await supabase
    .from("colaboradores")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, nome: r.nome, equipe: r.equipe ?? "" }));
}

async function fetchTipos(): Promise<TipoDiaria[]> {
  const { data, error } = await supabase
    .from("tipos_diaria")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    valorPadrao: Number(r.valor_padrao),
  }));
}

async function fetchDestinos(): Promise<Destino[]> {
  const { data, error } = await supabase
    .from("destinos")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, nome: r.nome }));
}

export function useDiarias() {
  const qc = useQueryClient();

  const diariasQuery = useQuery({ queryKey: ["diarias"], queryFn: fetchDiarias });
  const colaboradoresQuery = useQuery({
    queryKey: ["colaboradores"],
    queryFn: fetchColaboradores,
  });
  const tiposQuery = useQuery({ queryKey: ["tipos_diaria"], queryFn: fetchTipos });
  const destinosQuery = useQuery({ queryKey: ["destinos"], queryFn: fetchDestinos });

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["diarias"] }),
      qc.invalidateQueries({ queryKey: ["colaboradores"] }),
      qc.invalidateQueries({ queryKey: ["tipos_diaria"] }),
      qc.invalidateQueries({ queryKey: ["destinos"] }),
    ]);
  }, [qc]);

  const toRow = (d: DiariaInput, user_id: string) => ({
    user_id,
    data: d.data,
    colaborador: d.colaborador,
    equipe: d.equipe || null,
    tipo: d.tipo,
    valor: d.valor,
    destino: d.destino,
    situacao: d.situacao,
    troco: d.troco,
    observacao: d.observacao ?? "",
    grupo_id: d.grupoId ?? null,
  });

  const addDiaria = useCallback(
    async (d: DiariaInput) => {
      const user_id = await requireUserId();
      const { error } = await supabase.from("diarias").insert(toRow(d, user_id));
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const updateDiaria = useCallback(
    async (id: string, d: DiariaInput) => {
      const user_id = await requireUserId();
      const { user_id: _ignored, ...campos } = toRow(d, user_id);
      const { error } = await supabase.from("diarias").update(campos).eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const deleteDiaria = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("diarias").delete().eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const deleteDiarias = useCallback(
    async (ids: string[]) => {
      const { error } = await supabase.from("diarias").delete().in("id", ids);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  /** Salva um lançamento de equipe: uma linha por colaborador, com o mesmo grupo. */
  const salvarGrupo = useCallback(
    async (linhas: DiariaInput[], substituirIds: string[] = []) => {
      const user_id = await requireUserId();
      const grupoId = crypto.randomUUID();
      if (substituirIds.length > 0) {
        const { error } = await supabase.from("diarias").delete().in("id", substituirIds);
        if (error) throw error;
      }
      const { error } = await supabase
        .from("diarias")
        .insert(linhas.map((l) => toRow({ ...l, grupoId }, user_id)));
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const importarDiarias = useCallback(
    async (rows: DiariaInput[]) => {
      const user_id = await requireUserId();
      const { error } = await supabase
        .from("diarias")
        .insert(rows.map((r) => toRow(r, user_id)));
      if (error) throw error;
      await invalidate();
      return rows.length;
    },
    [invalidate],
  );

  const salvarColaborador = useCallback(
    async (valores: { nome: string; equipe: string | null }, id?: string) => {
      if (id) {
        const { error } = await supabase.from("colaboradores").update(valores).eq("id", id);
        if (error) throw error;
      } else {
        const user_id = await requireUserId();
        const { error } = await supabase.from("colaboradores").insert({ ...valores, user_id });
        if (error) throw error;
      }
      await invalidate();
    },
    [invalidate],
  );

  const salvarTipo = useCallback(
    async (valores: { nome: string; valor_padrao: number }, id?: string) => {
      if (id) {
        const { error } = await supabase.from("tipos_diaria").update(valores).eq("id", id);
        if (error) throw error;
      } else {
        const user_id = await requireUserId();
        const { error } = await supabase.from("tipos_diaria").insert({ ...valores, user_id });
        if (error) throw error;
      }
      await invalidate();
    },
    [invalidate],
  );

  const salvarDestino = useCallback(
    async (valores: { nome: string }, id?: string) => {
      if (id) {
        const { error } = await supabase.from("destinos").update(valores).eq("id", id);
        if (error) throw error;
      } else {
        const user_id = await requireUserId();
        const { error } = await supabase.from("destinos").insert({ ...valores, user_id });
        if (error) throw error;
      }
      await invalidate();
    },
    [invalidate],
  );

  const excluirCadastro = useCallback(
    async (tabela: "colaboradores" | "tipos_diaria" | "destinos", id: string) => {
      const { error } = await supabase.from(tabela).delete().eq("id", id);
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  return {
    diarias: useMemo(() => diariasQuery.data ?? [], [diariasQuery.data]),
    colaboradores: useMemo(
      () => colaboradoresQuery.data ?? [],
      [colaboradoresQuery.data],
    ),
    tipos: useMemo(() => tiposQuery.data ?? [], [tiposQuery.data]),
    destinos: useMemo(() => destinosQuery.data ?? [], [destinosQuery.data]),
    carregando:
      diariasQuery.isLoading ||
      colaboradoresQuery.isLoading ||
      tiposQuery.isLoading ||
      destinosQuery.isLoading,
    addDiaria,
    updateDiaria,
    deleteDiaria,
    deleteDiarias,
    salvarGrupo,
    importarDiarias,
    salvarColaborador,
    salvarTipo,
    salvarDestino,
    excluirCadastro,
  };
}