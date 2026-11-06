import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAccess } from "@/hooks/use-access";
import { useAbastecimento } from "@/lib/abastecimento-store";
import { useFinanceiro, formatarData, formatarMoeda } from "@/lib/financeiro-store";
import { useViagens } from "@/lib/viagens-store";
import { TIPOS_MANUTENCAO, calcularAlertas, fmtHoras, fmtKm, horasConhecidas, kmConhecido, useFrota, type ManutencaoInput } from "@/lib/frota-store";

export const Route = createFileRoute("/_authenticated/veiculos/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do veículo · ERP Brasilia Metais" },
      { name: "description", content: "Custos, manutenções, abastecimentos e viagens de um veículo." },
      { property: "og:title", content: "Detalhe do veículo · ERP Brasilia Metais" },
      { property: "og:description", content: "Histórico completo e custo por período de um veículo da frota." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VeiculoPage,
});

const hoje = () => new Date().toISOString().slice(0, 10);
const noPeriodo = (d: string, de: string, ate: string) => (!de || d >= de) && (!ate || d <= ate);

function VeiculoPage() {
  const { id } = Route.useParams();
  const { isAdmin, somenteLeitura } = useAccess();
  const { veiculos, abastecimentos } = useAbastecimento();
  const { manutencoes, auditoria, salvarManutencao, corrigirKm, carregando } = useFrota();
  const { gastos } = useFinanceiro();
  const { viagens } = useViagens() as any;
  const v = veiculos.find((x) => x.id === id);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [form, setForm] = useState<ManutencaoInput | null>(null);
  const [editId, setEditId] = useState<string>();
  const [salvando, setSalvando] = useState(false);
  const [corr, setCorr] = useState<{ km: string; motivo: string } | null>(null);

  const km = v ? kmConhecido(v, abastecimentos, manutencoes) : null;
  const abs = abastecimentos.filter((a) => a.veiculoId === id && noPeriodo(a.data, de, ate));
  const mans = manutencoes.filter((m) => m.veiculoId === id && noPeriodo(m.data, de, ate));
  const desp = gastos.filter((g) => g.veiculoId === id && noPeriodo(g.data, de, ate));
  const vgs = ((viagens ?? []) as any[]).filter((x) => x.veiculoId === id && noPeriodo(x.data, de, ate));
  const alertas = useMemo(() => calcularAlertas(manutencoes.filter((m) => m.veiculoId === id), () => km), [manutencoes, id, km]);
  const tA = abs.reduce((s, a) => s + a.valor, 0), tM = mans.reduce((s, m) => s + m.valor, 0), tD = desp.reduce((s, g) => s + g.valor, 0);

  if (!v) return (
    <div className="min-h-screen bg-background"><AppHeader title="Veículo" />
      <main className="mx-auto max-w-7xl p-6 text-muted-foreground">{carregando ? "Carregando..." : "Veículo não encontrado."}</main></div>
  );

  const salvar = async () => {
    if (!form) return;
    if (!form.tipo.trim()) return void toast.error("Informe o tipo da manutenção.");
    if (form.valor < 0) return void toast.error("Valor inválido.");
    const hAt = horasConhecidas(id, manutencoes);
    if (form.medida === "horas" && !editId && form.horimetro != null && hAt != null && form.horimetro < hAt)
      return void toast.error(`Horímetro menor que o último registrado (${fmtHoras(hAt)}).`);
    if (form.medida === "km" && !editId && form.km != null && km != null && form.km < km)
      return void toast.error(`KM informado é menor que o KM atual (${fmtKm(km)}). Peça a um administrador para corrigir o KM com motivo.`);
    setSalvando(true);
    try { await salvarManutencao(form, editId); toast.success("Manutenção salva"); setForm(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSalvando(false); }
  };
  const corrigir = async () => {
    if (!corr) return;
    const n = Number(corr.km);
    if (!corr.km || isNaN(n) || n < 0) return void toast.error("KM inválido.");
    if (corr.motivo.trim().length < 3) return void toast.error("Motivo obrigatório.");
    setSalvando(true);
    try { await corrigirKm(id, n, corr.motivo); toast.success("KM corrigido e registrado no histórico"); setCorr(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível corrigir."); }
    finally { setSalvando(false); }
  };
  const card = (t: string, val: string) => (
    <div className="rounded-lg border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{t}</p><p className="mt-1 text-xl font-semibold">{val}</p></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={`Veículo ${v.placa}`} />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <Link to="/veiculos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Veículos</Link>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{v.placa}</h1>
            <p className="text-sm text-muted-foreground">{[v.modelo, v.ano].filter(Boolean).join(" · ")} · KM atual: <b>{fmtKm(km)}</b></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && <Button variant="outline" onClick={() => setCorr({ km: "", motivo: "" })}>Corrigir KM</Button>}
            {!somenteLeitura && (
              <Button onClick={() => { setEditId(undefined); setForm({ veiculoId: id, data: hoje(), km, tipo: "", descricao: "", fornecedor: "", valor: 0, proximaKm: null, proximaData: null, observacao: "", medida: "km", horimetro: null, proximaHoras: null }); }}>
                <Plus className="mr-2 h-4 w-4" /> Nova manutenção
              </Button>
            )}
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="mb-4 grid gap-2">
            {alertas.map((a) => (
              <p key={a.manutencao.id} className={`rounded-md border px-3 py-2 text-sm ${a.status === "atrasada" ? "border-destructive text-destructive" : "border-[color:var(--bag-pendente)] text-[color:var(--bag-pendente)]"}`}>
                {a.status === "atrasada" ? "Atrasada" : "A vencer"}: {a.manutencao.tipo}
                {a.manutencao.proximaKm != null && ` · próxima em ${fmtKm(a.manutencao.proximaKm)}`}
                {a.manutencao.proximaHoras != null && ` · próxima em ${fmtHoras(a.manutencao.proximaHoras)}`}
                {a.manutencao.proximaData && ` · ${formatarData(a.manutencao.proximaData)}`}
              </p>
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
          <div className="grid gap-1"><Label>De</Label><Input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Até</Label><Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></div>
          {(de || ate) && <Button variant="ghost" onClick={() => { setDe(""); setAte(""); }}>Limpar período</Button>}
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {card("Custo total do período", formatarMoeda(tA + tM + tD))}
          {card("Abastecimentos", formatarMoeda(tA))}
          {card("Manutenções", formatarMoeda(tM))}
          {card("Despesas vinculadas", formatarMoeda(tD))}
        </div>

        <Secao titulo={`Manutenções (${mans.length})`}>
          {mans.length === 0 ? <Vazio /> : (
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Serviço</TableHead><TableHead>KM / Horas</TableHead><TableHead>Oficina</TableHead><TableHead>Próxima</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>{mans.map((m) => (
                <TableRow key={m.id} className={somenteLeitura ? "" : "cursor-pointer"} onClick={() => { if (somenteLeitura) return; setEditId(m.id); setForm({ ...m }); }}>
                  <TableCell>{formatarData(m.data)}</TableCell><TableCell>{m.tipo}</TableCell><TableCell>{m.descricao}</TableCell>
                  <TableCell>{m.medida === "horas" ? fmtHoras(m.horimetro) : fmtKm(m.km)}</TableCell><TableCell>{m.fornecedor}</TableCell>
                  <TableCell>{[m.proximaKm != null ? fmtKm(m.proximaKm) : "", m.proximaHoras != null ? fmtHoras(m.proximaHoras) : "", m.proximaData ? formatarData(m.proximaData) : ""].filter(Boolean).join(" / ") || "—"}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(m.valor)}</TableCell>
                </TableRow>))}</TableBody></Table>
          )}
        </Secao>
        <Secao titulo={`Abastecimentos (${abs.length})`}>
          {abs.length === 0 ? <Vazio /> : (
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Combustível</TableHead><TableHead>Litros</TableHead><TableHead>KM</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>{[...abs].sort((a, b) => (a.data < b.data ? 1 : -1)).map((a) => (
                <TableRow key={a.id}><TableCell>{formatarData(a.data)}</TableCell><TableCell>{a.combustivel}</TableCell><TableCell>{a.litros.toLocaleString("pt-BR")}</TableCell><TableCell>{fmtKm(a.kmAtual)}</TableCell><TableCell className="text-right">{formatarMoeda(a.valor)}</TableCell></TableRow>))}</TableBody></Table>
          )}
        </Secao>
        <Secao titulo={`Despesas financeiras vinculadas (${desp.length})`}>
          {desp.length === 0 ? <Vazio /> : (
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>{desp.map((g) => (<TableRow key={g.id}><TableCell>{formatarData(g.data)}</TableCell><TableCell>{g.descricao}</TableCell><TableCell>{g.categoria}</TableCell><TableCell className="text-right">{formatarMoeda(g.valor)}</TableCell></TableRow>))}</TableBody></Table>
          )}
        </Secao>
        <Secao titulo={`Viagens (${vgs.length})`}>
          {vgs.length === 0 ? <Vazio /> : (
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Destino</TableHead><TableHead>Motorista</TableHead><TableHead>Distância</TableHead></TableRow></TableHeader>
              <TableBody>{vgs.map((x) => (<TableRow key={x.id}><TableCell>{formatarData(x.data)}</TableCell><TableCell>{x.destino}</TableCell><TableCell>{x.motorista}</TableCell><TableCell>{x.distanciaKm != null ? `${Number(x.distanciaKm).toLocaleString("pt-BR")} km` : "—"}</TableCell></TableRow>))}</TableBody></Table>
          )}
        </Secao>
        <Secao titulo="Histórico de correções de KM">
          {auditoria.filter((a) => a.veiculoId === id).length === 0 ? <Vazio /> : (
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Anterior</TableHead><TableHead>Novo</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
              <TableBody>{auditoria.filter((a) => a.veiculoId === id).map((a) => (<TableRow key={a.id}><TableCell>{new Date(a.createdAt).toLocaleString("pt-BR")}</TableCell><TableCell>{fmtKm(a.kmAnterior)}</TableCell><TableCell>{fmtKm(a.kmNovo)}</TableCell><TableCell>{a.motivo}</TableCell></TableRow>))}</TableBody></Table>
          )}
        </Secao>
      </main>

      <Dialog open={!!form} onOpenChange={(o) => !salvando && !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wrench className="h-4 w-4" />{editId ? "Editar manutenção" : "Nova manutenção"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1"><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
              <div className="grid gap-1"><Label>Controlar por</Label>
                <select className="h-9 rounded-md border px-2 text-sm" value={form.medida} onChange={(e) => setForm({ ...form, medida: e.target.value as "km" | "horas" })}>
                  <option value="km">KM</option><option value="horas">Horas (horímetro)</option>
                </select></div>
              {form.medida === "horas"
                ? <div className="grid gap-1"><Label>Horímetro (h)</Label><Input type="number" step="0.1" value={form.horimetro ?? ""} onChange={(e) => setForm({ ...form, horimetro: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                : <div className="grid gap-1"><Label>KM</Label><Input type="number" value={form.km ?? ""} onChange={(e) => setForm({ ...form, km: e.target.value === "" ? null : Number(e.target.value) })} /></div>}
              <div className="grid gap-1"><Label>Tipo</Label>
                <select className="h-9 rounded-md border px-2 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="">Selecione</option>{TIPOS_MANUTENCAO.map((t) => <option key={t}>{t}</option>)}
                </select></div>
              <div className="grid gap-1"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor || ""} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) || 0 })} /></div>
              <div className="grid gap-1 sm:col-span-2"><Label>Serviço / descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="grid gap-1 sm:col-span-2"><Label>Oficina / fornecedor</Label><Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></div>
              {form.medida === "horas"
                ? <div className="grid gap-1"><Label>Próxima por horas (h)</Label><Input type="number" step="0.1" value={form.proximaHoras ?? ""} onChange={(e) => setForm({ ...form, proximaHoras: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                : <div className="grid gap-1"><Label>Próxima por KM</Label><Input type="number" value={form.proximaKm ?? ""} onChange={(e) => setForm({ ...form, proximaKm: e.target.value === "" ? null : Number(e.target.value) })} /></div>}
              <div className="grid gap-1"><Label>Próxima por data</Label><Input type="date" value={form.proximaData ?? ""} onChange={(e) => setForm({ ...form, proximaData: e.target.value || null })} /></div>
              <div className="grid gap-1 sm:col-span-2"><Label>Observações</Label><Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button disabled={salvando} onClick={() => void salvar()}>{salvando ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!corr} onOpenChange={(o) => !salvando && !o && setCorr(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Corrigir KM (administrador)</DialogTitle></DialogHeader>
          {corr && (
            <div className="grid gap-3">
              <p className="text-sm text-muted-foreground">KM atual: {fmtKm(km)}. A correção fica registrada com motivo, usuário e data; o histórico não é apagado.</p>
              <div className="grid gap-1"><Label>Novo KM</Label><Input type="number" value={corr.km} onChange={(e) => setCorr({ ...corr, km: e.target.value })} /></div>
              <div className="grid gap-1"><Label>Motivo (obrigatório)</Label><Textarea value={corr.motivo} onChange={(e) => setCorr({ ...corr, motivo: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button disabled={salvando} onClick={() => void corrigir()}>Confirmar correção</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <section className="mb-6"><h2 className="mb-2 font-semibold">{titulo}</h2><div className="overflow-x-auto rounded-lg border bg-card">{children}</div></section>;
}
function Vazio() { return <p className="p-4 text-sm text-muted-foreground">Nenhum registro no período.</p>; }
