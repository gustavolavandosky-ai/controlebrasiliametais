export interface TrocoDesconto { id: string; colaborador: string; data: string; valor: number; forma: string; observacao: string }
export interface ResumoTroco { colaborador: string; gerado: number; descontado: number; saldo: number; status: "pendente" | "parcial" | "quitado" }

export const FORMAS_TROCO: Record<string, string> = {
  desconto_diaria: "Descontado na diária",
  devolucao: "Devolveu (dinheiro/Pix)",
  outro: "Outro acerto",
};

/** Agrupa troco gerado nas diárias menos descontos, por colaborador. */
export function resumirTrocos(
  diarias: { colaborador: string; troco: number | null }[],
  descontos: Pick<TrocoDesconto, "colaborador" | "valor">[],
): ResumoTroco[] {
  const m = new Map<string, ResumoTroco>();
  const get = (c: string) => {
    const k = c.trim();
    let r = m.get(k.toUpperCase());
    if (!r) { r = { colaborador: k, gerado: 0, descontado: 0, saldo: 0, status: "pendente" }; m.set(k.toUpperCase(), r); }
    return r;
  };
  for (const d of diarias) if (d.troco && d.troco > 0) get(d.colaborador).gerado += d.troco;
  for (const x of descontos) get(x.colaborador).descontado += x.valor;
  const out = [...m.values()].map((r) => {
    const saldo = Math.round((r.gerado - r.descontado) * 100) / 100;
    const status: ResumoTroco["status"] = saldo <= 0 ? "quitado" : r.descontado > 0 ? "parcial" : "pendente";
    return { ...r, saldo, status };
  });
  return out.sort((a, b) => b.saldo - a.saldo || a.colaborador.localeCompare(b.colaborador));
}
