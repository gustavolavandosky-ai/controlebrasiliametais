import { describe, expect, it } from "vitest";
import { resumirTrocos } from "./trocos";
describe("resumirTrocos", () => {
  it("desconto parcial deixa saldo restante", () => {
    const r = resumirTrocos([{ colaborador: "Adelson", troco: 200 }], [{ colaborador: "adelson", valor: 50 }]);
    expect(r[0]).toMatchObject({ gerado: 200, descontado: 50, saldo: 150, status: "parcial" });
  });
  it("desconto total quita", () => {
    const r = resumirTrocos([{ colaborador: "Peteca", troco: 80 }], [{ colaborador: "Peteca", valor: 80 }]);
    expect(r[0]?.status).toBe("quitado");
  });
});
