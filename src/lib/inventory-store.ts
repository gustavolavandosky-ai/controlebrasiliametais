import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Unidade = "un" | "kg" | "g" | "L" | "mL" | "cx" | "pct" | "m";
export const UNIDADES: Unidade[] = ["un", "kg", "g", "L", "mL", "cx", "pct", "m"];

export type TipoLancamento = "entrada" | "saida" | "balanco";

export interface Lancamento {
  id: string;
  produtoId: string;
  tipo: TipoLancamento;
  quantidade: number;
  unidade: Unidade;
  data: string; // yyyy-mm-dd
  hora: string; // HH:mm
  createdAt: number;
}

export interface Produto {
  id: string;
  nome: string;
  unidade: Unidade;
  estoqueInicial: number;
  observacoes: string;
  localizacao: string;
  createdAt: number;
}

interface State {
  produtos: Produto[];
  lancamentos: Lancamento[];
  addProduto: (p: Omit<Produto, "id" | "createdAt">) => void;
  updateProduto: (id: string, p: Partial<Produto>) => void;
  deleteProduto: (id: string) => void;
  addLancamento: (l: Omit<Lancamento, "id" | "createdAt">) => void;
  updateLancamento: (id: string, l: Partial<Lancamento>) => void;
  deleteLancamento: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useInventory = create<State>()(
  persist(
    (set) => ({
      produtos: [],
      lancamentos: [],
      addProduto: (p) =>
        set((s) => ({
          produtos: [...s.produtos, { ...p, id: uid(), createdAt: Date.now() }],
        })),
      updateProduto: (id, p) =>
        set((s) => ({
          produtos: s.produtos.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),
      deleteProduto: (id) =>
        set((s) => ({
          produtos: s.produtos.filter((x) => x.id !== id),
          lancamentos: s.lancamentos.filter((x) => x.produtoId !== id),
        })),
      addLancamento: (l) =>
        set((s) => ({
          lancamentos: [
            ...s.lancamentos,
            { ...l, id: uid(), createdAt: Date.now() },
          ],
        })),
      updateLancamento: (id, l) =>
        set((s) => ({
          lancamentos: s.lancamentos.map((x) => (x.id === id ? { ...x, ...l } : x)),
        })),
      deleteLancamento: (id) =>
        set((s) => ({
          lancamentos: s.lancamentos.filter((x) => x.id !== id),
        })),
    }),
    { name: "erp-estoque" },
  ),
);

export function calcularEstoque(
  produto: Produto,
  lancamentos: Lancamento[],
): number {
  const lots = lancamentos
    .filter((l) => l.produtoId === produto.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  let saldo = produto.estoqueInicial;
  for (const l of lots) {
    if (l.tipo === "entrada") saldo += l.quantidade;
    else if (l.tipo === "saida") saldo -= l.quantidade;
    else saldo = l.quantidade; // balanço
  }
  return saldo;
}

export function calcularSaldoAteLancamento(
  produto: Produto,
  lancamentos: Lancamento[],
  lancamentoId: string,
): { antes: number; depois: number } {
  const lots = lancamentos
    .filter((l) => l.produtoId === produto.id)
    .sort((a, b) => a.createdAt - b.createdAt);

  let antes = produto.estoqueInicial;
  let depois = produto.estoqueInicial;

  for (const l of lots) {
    if (l.id === lancamentoId) {
      antes = depois;
    }
    if (l.tipo === "entrada") depois += l.quantidade;
    else if (l.tipo === "saida") depois -= l.quantidade;
    else depois = l.quantidade;
    if (l.id === lancamentoId) {
      return { antes, depois };
    }
  }

  return { antes, depois };
}
