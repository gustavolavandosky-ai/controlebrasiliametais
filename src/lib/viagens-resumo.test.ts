import { describe, expect, it } from "vitest";
import { bagsDaViagem, diariasDaViagem } from "@/lib/viagens-resumo";
import type { Diaria } from "@/lib/diarias-store";
import type { BagMov } from "@/lib/bags-store";

const diaria = (id: string, veiculoId: string | null, destino = "Tamires"): Diaria => ({
  id, data: "2026-11-13", colaborador: id, equipe: "LEO", tipo: "AJUDANTE", valor: 100,
  destino, veiculoId, situacao: "pago", troco: null, observacao: "", grupoId: null, createdAt: 1,
});
const bag = (id: string, quantidade: number, quantidadeRetornada: number): BagMov => ({
  id, tipo: "saida", data: "2026-11-13", quantidade, quantidadeRetornada,
  fornecedor: "", cliente: "Tamires", observacao: "", createdAt: 1,
});

describe("sincronização da viagem", () => {
  it("separa diárias pelo caminhão e mantém as antigas sem caminhão", () => {
    const lista = [diaria("a", "c1"), diaria("b", "c2"), diaria("c", null), diaria("d", "c1", "Outro")];
    expect(diariasDaViagem(lista, "2026-11-13", "Tamires", "c1").map((d) => d.id)).toEqual(["a", "c"]);
  });

  it("soma bags enviados e retornados na viagem", () => {
    expect(bagsDaViagem([bag("1", 30, 20), bag("2", 10, 10)], "2026-11-13", "Tamires")).toEqual({ quantidade: 40, retornada: 30 });
  });
});
