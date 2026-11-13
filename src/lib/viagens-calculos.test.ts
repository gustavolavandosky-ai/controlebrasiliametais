import { describe, expect, it } from "vitest";
import { calcularMediaPorVeiculo, type Abastecimento } from "@/lib/abastecimento-store";
import { calcularCombustivel, diferencaMin, distanciaTotalKm, tempoRealTotalMin } from "@/lib/viagens-store";

const ab = (id: string, veiculoId: string, data: string, litros: number, kmAtual: number): Abastecimento => ({
  id, veiculoId, data, combustivel: "DIESEL", valor: 0, litros, kmAtual,
  motorista: "", observacao: "", createdAt: new Date(`${data}T12:00:00Z`).getTime(),
});

describe("consumo dos trajetos", () => {
  it("calcula 20 litros na ida e 40 na volta para 100 km a 5 km/L", () => {
    expect(calcularCombustivel(100, 5, false)).toBe(20);
    expect(calcularCombustivel(100, 5, true)).toBe(40);
    expect(distanciaTotalKm({ distanciaKm: 100, temVolta: true })).toBe(200);
  });

  it("usa a média ponderada real do caminhão", () => {
    const lista = [ab("1", "v1", "2026-01-01", 10, 100), ab("2", "v1", "2026-01-02", 15, 250), ab("3", "v1", "2026-01-03", 20, 450)];
    expect(calcularMediaPorVeiculo(lista).get("v1")).toBe(10);
  });

  it("soma ida e volta e desconta paradas na diferença", () => {
    const v = { tempoRealMin: 60, tempoVoltaMin: 50, temVolta: true, tempoEstimadoMin: 45, houveParada: true, paradasMin: 10 };
    expect(tempoRealTotalMin(v)).toBe(110);
    expect(diferencaMin(v)).toBe(10);
  });
});
