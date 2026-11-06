import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AlertTriangle, ChevronRight, Clock, Truck } from "lucide-react";
import { useAbastecimento } from "@/lib/abastecimento-store";
import { useFinanceiro, formatarData, formatarMoeda } from "@/lib/financeiro-store";
import { calcularAlertas, fmtKm, kmConhecido, useFrota } from "@/lib/frota-store";

export const Route = createFileRoute("/_authenticated/veiculos/")({
  head: () => ({
    meta: [
      { title: "Veículos · ERP Brasilia Metais" },
      { name: "description", content: "Frota com KM atual, custos, manutenções e alertas de vencimento." },
      { property: "og:title", content: "Veículos · ERP Brasilia Metais" },
      { property: "og:description", content: "Painel da frota: custos por veículo e manutenções a vencer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VeiculosPage,
});

function VeiculosPage() {
  const { veiculos, abastecimentos, carregando: c1 } = useAbastecimento();
  const { manutencoes, carregando: c2, erro } = useFrota();
  const { gastos } = useFinanceiro();

  const kmDe = useMemo(() => {
    const m = new Map(veiculos.map((v) => [v.id, kmConhecido(v, abastecimentos, manutencoes)]));
    return (id: string) => m.get(id) ?? null;
  }, [veiculos, abastecimentos, manutencoes]);
  const alertas = useMemo(() => calcularAlertas(manutencoes, kmDe), [manutencoes, kmDe]);
  const placa = (id: string) => veiculos.find((v) => v.id === id)?.placa ?? "—";

  const custo = useMemo(() => {
    const m = new Map<string, number>();
    const add = (id: string | null | undefined, v: number) => { if (id) m.set(id, (m.get(id) ?? 0) + v); };
    abastecimentos.forEach((a) => add(a.veiculoId, a.valor));
    manutencoes.forEach((x) => add(x.veiculoId, x.valor));
    gastos.forEach((g) => add(g.veiculoId, g.valor));
    return m;
  }, [abastecimentos, manutencoes, gastos]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Veículos" />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Veículos</h1>
          <p className="text-sm text-muted-foreground">KM atual, custos (abastecimentos, manutenções e despesas vinculadas) e alertas.</p>
        </div>

        {erro && <p className="mb-4 rounded-lg border border-destructive p-3 text-sm text-destructive">Erro ao carregar: {erro.message}</p>}

        <section className="mb-6 rounded-lg border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Alertas de manutenção</h2>
          {alertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma manutenção atrasada ou a vencer (até 1.000 km, 50 horas ou 7 dias).</p>
          ) : (
            <ul className="grid gap-2">
              {alertas.map((a) => (
                <li key={a.manutencao.id}>
                  <Link to="/veiculos/$id" params={{ id: a.manutencao.veiculoId }}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent ${a.status === "atrasada" ? "border-destructive text-destructive" : "border-[color:var(--bag-pendente)]"}`}>
                    <span className="font-medium">{placa(a.manutencao.veiculoId)} · {a.manutencao.tipo || "Manutenção"}</span>
                    <span>
                      {a.status === "atrasada" ? "Atrasada" : "A vencer"}
                      {a.faltamKm != null && ` · ${a.faltamKm < 0 ? `${Math.abs(a.faltamKm).toLocaleString("pt-BR")} km passados` : `faltam ${a.faltamKm.toLocaleString("pt-BR")} km`}`}
                      {a.faltamHoras != null && ` · ${a.faltamHoras < 0 ? `${Math.abs(a.faltamHoras).toLocaleString("pt-BR")} h passadas` : `faltam ${a.faltamHoras.toLocaleString("pt-BR")} h`}`}
                      {a.manutencao.proximaData && ` · ${formatarData(a.manutencao.proximaData)}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {(c1 || c2) && <p className="text-muted-foreground">Carregando...</p>}
        {!c1 && veiculos.length === 0 && (
          <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Nenhum veículo cadastrado. Cadastre em Abastecimento → "Novo veículo".</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {veiculos.map((v) => {
            const n = alertas.filter((a) => a.manutencao.veiculoId === v.id);
            return (
              <Link key={v.id} to="/veiculos/$id" params={{ id: v.id }} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4 text-primary" />{v.placa}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{[v.modelo, v.ano].filter(Boolean).join(" · ") || "—"}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">KM atual</p><p className="font-medium">{fmtKm(kmDe(v.id))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Custo total</p><p className="font-medium">{formatarMoeda(custo.get(v.id) ?? 0)}</p></div>
                </div>
                {n.length > 0 && (
                  <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${n.some((a) => a.status === "atrasada") ? "text-destructive" : "text-[color:var(--bag-pendente)]"}`}>
                    <Clock className="h-3 w-3" /> {n.length} manutenção(ões) {n.some((a) => a.status === "atrasada") ? "atrasada(s)" : "a vencer"}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
