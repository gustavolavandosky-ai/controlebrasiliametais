import type { BagMov } from "@/lib/bags-store";
import type { Diaria } from "@/lib/diarias-store";

export const normalizarCliente = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/\s+/g, " ");

/** Liga diárias à viagem por cliente e data; quando informado, o caminhão também precisa coincidir. */
export function diariasDaViagem(diarias: Diaria[], data: string, cliente: string, veiculoId: string | null) {
  const nome = normalizarCliente(cliente);
  return diarias.filter((d) => d.data === data && normalizarCliente(d.destino) === nome &&
    (!d.veiculoId || d.veiculoId === veiculoId));
}

/** Bags enviados ao mesmo cliente na data da viagem. */
export function bagsDaViagem(movimentos: BagMov[], data: string, cliente: string) {
  const nome = normalizarCliente(cliente);
  const saidas = movimentos.filter((m) => m.tipo === "saida" && m.data === data && normalizarCliente(m.cliente) === nome);
  return {
    quantidade: saidas.reduce((s, m) => s + m.quantidade, 0),
    retornada: saidas.reduce((s, m) => s + m.quantidadeRetornada, 0),
  };
}
