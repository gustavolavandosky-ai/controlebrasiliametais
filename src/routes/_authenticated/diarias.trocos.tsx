import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-access";
import { formatarData, formatarMoeda, useDiarias } from "@/lib/diarias-store";
import { FORMAS_TROCO, resumirTrocos, type TrocoDesconto } from "@/lib/trocos";

export const Route = createFileRoute("/_authenticated/diarias/trocos")({
  head: () => ({
    meta: [
      { title: "Controle de Trocos · ERP Brasilia Metais" },
      { name: "description", content: "Quem ainda deve devolver troco das diárias e quanto já foi descontado." },
      { property: "og:title", content: "Controle de Trocos · ERP Brasilia Metais" },
      { property: "og:description", content: "Saldo de troco por colaborador com histórico de descontos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrocosPage,
});

const K = ["troco_descontos"];
const hoje = () => new Date().toISOString().slice(0, 10);

function TrocosPage() {
  const { somenteLeitura } = useAccess();
  const { diarias } = useDiarias();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: K,
    queryFn: async (): Promise<TrocoDesconto[]> => {
      const { data, error } = await supabase.from("troco_descontos").select("*").order("data", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.id, colaborador: r.colaborador, data: r.data, valor: Number(r.valor), forma: r.forma, observacao: r.observacao }));
    },
  });
  const descontos = q.data ?? [];
  const resumo = useMemo(() => resumirTrocos(diarias, descontos), [diarias, descontos]);
  const [mostrarQuitados, setMostrarQuitados] = useState(false);
  const [abater, setAbater] = useState<{ colaborador: string; saldo: number } | null>(null);
  const [hist, setHist] = useState<string | null>(null);
  const [f, setF] = useState({ data: hoje(), valor: "", forma: "desconto_diaria", observacao: "" });
  const [salvando, setSalvando] = useState(false);

  const pendente = resumo.reduce((s, r) => s + Math.max(0, r.saldo), 0);
  const recuperado = resumo.reduce((s, r) => s + r.descontado, 0);
  const abertos = resumo.filter((r) => r.saldo > 0).length;
  const lista = resumo.filter((r) => mostrarQuitados || r.saldo > 0);

  async function salvar() {
    if (!abater || salvando) return;
    const v = Number(f.valor.replace(",", "."));
    if (!isFinite(v) || v <= 0) { toast.error("Informe um valor maior que zero."); return; }
    setSalvando(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sessão expirada.");
      const { error } = await supabase.from("troco_descontos").insert({ user_id: u.user.id, colaborador: abater.colaborador, data: f.data, valor: v, forma: f.forma, observacao: f.observacao });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: K });
      toast.success("Desconto registrado.");
      setAbater(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar."); }
    finally { setSalvando(false); }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este desconto?")) return;
    const { error } = await supabase.from("troco_descontos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: K });
    toast.success("Desconto excluído.");
  }

  const histItens = hist ? descontos.filter((d) => d.colaborador.trim().toUpperCase() === hist.toUpperCase()) : [];
  const histDiarias = hist ? diarias.filter((d) => d.troco && d.troco > 0 && d.colaborador.trim().toUpperCase() === hist.toUpperCase()) : [];

  return (
    <div className="min-h-screen">
      <AppHeader title="Controle de Trocos" />
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <Button asChild variant="outline" size="sm"><Link to="/diarias"><ArrowLeft className="mr-2 h-4 w-4" />Voltar às diárias</Link></Button>
        <div className="grid gap-3 sm:grid-cols-3">
          <Resumo label="Pendente a voltar" valor={formatarMoeda(pendente)} cls="text-destructive" />
          <Resumo label="Já descontado / devolvido" valor={formatarMoeda(recuperado)} cls="text-primary" />
          <Resumo label="Colaboradores em aberto" valor={String(abertos)} cls="" />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={mostrarQuitados} onChange={(e) => setMostrarQuitados(e.target.checked)} /> Mostrar quitados
        </label>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Colaborador</TableHead><TableHead className="text-right">Troco gerado</TableHead>
              <TableHead className="text-right">Descontado</TableHead><TableHead className="text-right">Falta voltar</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {lista.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{q.isLoading ? "Carregando..." : "Ninguém com troco pendente."}</TableCell></TableRow>}
              {lista.map((r) => (
                <TableRow key={r.colaborador}>
                  <TableCell className="font-medium">{r.colaborador}</TableCell>
                  <TableCell className="text-right font-mono">{formatarMoeda(r.gerado)}</TableCell>
                  <TableCell className="text-right font-mono">{formatarMoeda(r.descontado)}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${r.saldo > 0 ? "text-destructive" : "text-primary"}`}>{formatarMoeda(Math.max(0, r.saldo))}</TableCell>
                  <TableCell><span className="rounded-full border px-2 py-0.5 text-xs">{r.status === "quitado" ? "Quitado" : r.status === "parcial" ? "Parcial" : "Pendente"}</span></TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap text-right">
                    <Button size="sm" variant="outline" onClick={() => setHist(r.colaborador)}>Histórico</Button>
                    {!somenteLeitura && r.saldo > 0 && <Button size="sm" onClick={() => { setF({ data: hoje(), valor: String(r.saldo), forma: "desconto_diaria", observacao: "" }); setAbater(r); }}>Descontar</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={!!abater} onOpenChange={(o) => !o && setAbater(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Descontar troco · {abater?.colaborador}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Falta voltar: {formatarMoeda(abater?.saldo ?? 0)}</p>
          <div className="grid gap-3">
            <div><Label>Data</Label><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
            <div><Label>Valor (R$)</Label><Input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
            <div><Label>Forma</Label>
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.forma} onChange={(e) => setF({ ...f, forma: e.target.value })}>
                {Object.entries(FORMAS_TROCO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><Label>Observação</Label><Textarea value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar desconto"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!hist} onOpenChange={(o) => !o && setHist(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de troco · {hist}</DialogTitle></DialogHeader>
          <h3 className="text-sm font-semibold">Trocos gerados nas diárias</h3>
          {histDiarias.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> :
            histDiarias.map((d) => <div key={d.id} className="flex justify-between border-b py-1 text-sm"><span>{formatarData(d.data)} · {d.destino || "—"}</span><span className="font-mono">{formatarMoeda(d.troco ?? 0)}</span></div>)}
          <h3 className="mt-3 text-sm font-semibold">Descontos / devoluções</h3>
          {histItens.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum desconto ainda.</p> :
            histItens.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 border-b py-1 text-sm">
                <span>{formatarData(d.data)} · {FORMAS_TROCO[d.forma] ?? d.forma}{d.observacao ? ` · ${d.observacao}` : ""}</span>
                <span className="flex items-center gap-2 font-mono text-primary">-{formatarMoeda(d.valor)}
                  {!somenteLeitura && <Button size="sm" variant="ghost" aria-label="Excluir" onClick={() => excluir(d.id)}><Trash2 className="h-4 w-4" /></Button>}</span>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Resumo({ label, valor, cls }: { label: string; valor: string; cls: string }) {
  return <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-bold ${cls}`}>{valor}</p></div>;
}
