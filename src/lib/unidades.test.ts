import { describe, it, expect } from "vitest";
import { calcularFardos, ultimoApontamento, controlePorLocal, type Apontamento } from "./unidades";
import type { Lancamento } from "./inventory-store";
let t = 0;
const L = (tipo: Lancamento["tipo"], quantidade: number, fardos: number | null): Lancamento =>
  ({ id: String(++t), produtoId: "p", tipo, quantidade, unidade: "kg", data: "2026-11-04", hora: "10:00", observacao: "", fardos, createdAt: t });
const A = (tipo: Apontamento["tipo"], quantidade: number, pesoKg: number | null): Apontamento =>
  ({ id: String(++t), produtoId: "p", tipo, quantidade, pesoKg, saldoCalculado: null, responsavel: "", justificativa: "", data: "2026-11-04", createdAt: t });
describe("unidades físicas", () => {
  it("15 entradas = 15 fardos; saída de 10 = 5; saída só em kg mantém e gera pendência", () => {
    const ls = Array.from({ length: 15 }, () => L("entrada", 300, 1));
    expect(calcularFardos(ls, []).saldo).toBe(15);
    ls.push(L("saida", 3000, 10));
    expect(calcularFardos(ls, []).saldo).toBe(5);
    ls.push(L("saida", 500, null));
    const r = calcularFardos(ls, []);
    expect(r.saldo).toBe(5);
    expect(r.pendentes).toHaveLength(1);
  });
  it("lançamentos legados sem fardos não contam", () => {
    expect(calcularFardos([L("entrada", 100, null)], []).saldo).toBe(0);
  });
  it("contagem física redefine o saldo e zera pendências anteriores", () => {
    const ls = [L("entrada", 1, 1), L("saida", 1, null)];
    const ap = [A("contagem_fardo", 7, null)];
    ls.push(L("entrada", 1, 1));
    const r = calcularFardos(ls, ap);
    expect(r.saldo).toBe(8);
    expect(r.pendentes).toHaveLength(0);
  });
  it("bags/paletes: último registro substitui, histórico preservado", () => {
    for (const tipo of ["bag", "palete"] as const) {
      const ap = [A(tipo, 8, 2400), A(tipo, 3, 900)];
      const u = ultimoApontamento(ap, tipo)!;
      expect([u.quantidade, u.pesoKg]).toEqual([3, 900]);
      expect(ap).toHaveLength(2);
    }
  });
  it("detecta localização com variações", () => {
    expect(controlePorLocal("  material   enfardado ")).toBe("fardo");
    expect(controlePorLocal("Material Embegado")).toBe("bag");
    expect(controlePorLocal("MATERIAL EM PALETE")).toBe("palete");
    expect(controlePorLocal("Galpão")).toBeNull();
  });
});
