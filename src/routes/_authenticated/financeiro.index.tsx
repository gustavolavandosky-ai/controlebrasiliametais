import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Wallet, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAccess } from "@/hooks/use-access";
import { formatarMoeda, useFinanceiro } from "@/lib/financeiro-store";

export const Route = createFileRoute("/_authenticated/financeiro/")({
  head: () => ({
    meta: [
      { title: "Financeiro · ERP Brasilia Metais" },
      { name: "description", content: "Controle de gastos por centro de custo: locais e tipos de despesa." },
      { property: "og:title", content: "Financeiro · ERP Brasilia Metais" },
      { property: "og:description", content: "Gastos organizados por centro de custo, com totais do mês e geral." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { centros, gastos, carregando, salvarCentro } = useFinanceiro();
  const { somenteLeitura } = useAccess();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const mesAtual = new Date().toISOString().slice(0, 7);
  const resumo = useMemo(() => {
    const m = new Map<string, { total: number; mes: number; qtd: number }>();
    for (const g of gastos) {
      const r = m.get(g.centroId) ?? { total: 0, mes: 0, qtd: 0 };
      r.total += g.valor;
      r.qtd += 1;
      if (g.data.startsWith(mesAtual)) r.mes += g.valor;
      m.set(g.centroId, r);
    }
    return m;
  }, [gastos, mesAtual]);

  const totalGeral = gastos.reduce((s, g) => s + g.valor, 0);
  const totalMes = gastos.filter((g) => g.data.startsWith(mesAtual)).reduce((s, g) => s + g.valor, 0);

  const criar = async () => {
    if (!nome.trim()) return toast.error("Informe o nome.");
    setSalvando(true);
    try {
      await salvarCentro({ nome: nome.trim(), descricao: descricao.trim() });
      toast.success("Centro de custo criado");
      setAberto(false);
      setNome("");
      setDescricao("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Financeiro" />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Gastos separados por centro de custo (local ou tipo de gasto).</p>
          </div>
          {!somenteLeitura && (
            <Button onClick={() => setAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo centro de custo
            </Button>
          )}
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gasto total</p>
            <p className="mt-1 text-2xl font-semibold">{formatarMoeda(totalGeral)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gasto neste mês</p>
            <p className="mt-1 text-2xl font-semibold">{formatarMoeda(totalMes)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Centros de custo</p>
            <p className="mt-1 text-2xl font-semibold">{centros.length}</p>
          </div>
        </div>

        {carregando && <p className="text-muted-foreground">Carregando...</p>}
        {!carregando && centros.length === 0 && (
          <p className="rounded-lg border p-8 text-center text-muted-foreground">
            Nenhum centro de custo ainda. Crie um, por exemplo "Escritório", "Galpão" ou "Manutenção".
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {centros.map((c) => {
            const r = resumo.get(c.id) ?? { total: 0, mes: 0, qtd: 0 };
            return (
              <Link
                key={c.id}
                to="/financeiro/$id"
                params={{ id: c.id }}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{c.nome}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                {c.descricao && <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>}
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium">{formatarMoeda(r.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Este mês</p>
                    <p className="font-medium">{formatarMoeda(r.mes)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lançamentos</p>
                    <p className="font-medium">{r.qtd}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Dialog open={aberto} onOpenChange={(v) => !salvando && setAberto(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo centro de custo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="cc-nome">Nome (local ou tipo de gasto)</Label>
              <Input id="cc-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="cc-desc">Descrição</Label>
              <Textarea id="cc-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={salvando} onClick={() => void criar()}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
