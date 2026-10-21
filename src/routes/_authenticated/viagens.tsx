import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Clock, MapPin, Plus, Route as RouteIcon, Search, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAccess } from "@/hooks/use-access";
import { useAbastecimento } from "@/lib/abastecimento-store";
import { fmtTempo, useViagens, type ViagemInput } from "@/lib/viagens-store";
import { estimarRota } from "@/lib/rotas.functions";

export const Route = createFileRoute("/_authenticated/viagens")({
  head: () => ({
    meta: [
      { title: "Viagens · Brasília Metais" },
      { name: "description", content: "Viagens dos caminhões com estimativa de tempo e pedágios e o tempo real." },
      { property: "og:title", content: "Viagens · Brasília Metais" },
      { property: "og:description", content: "Estimativa de rota, pedágios e tempo real das viagens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ViagensPage,
});

const POR_PAGINA = 50;
const brl = (v: number | null) => (v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const fmtData = (d: string) => d.split("-").reverse().join("/");
const hoje = () => new Date().toISOString().slice(0, 10);
const vazio = (): ViagemInput => ({
  data: hoje(), origem: "", destino: "", veiculoId: null, motorista: "", distanciaKm: null,
  tempoEstimadoMin: null, pedagioEstimado: null, tempoRealMin: null, pedagioReal: null, observacao: "",
});
const numOuNull = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

function ViagensPage() {
  const { somenteLeitura } = useAccess();
  const { viagens, carregando, salvar, excluir } = useViagens();
  const { veiculos } = useAbastecimento();
  const calcular = useServerFn(estimarRota);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState<ViagemInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hReal, setHReal] = useState(""); const [mReal, setMReal] = useState("");
  const [calculando, setCalculando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const trava = useRef(false);
  const nomeV = useMemo(() => new Map(veiculos.map((v) => [v.id, `${v.modelo} ${v.placa}`.trim()])), [veiculos]);

  const filtradas = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return viagens.filter((v) => !b || [v.origem, v.destino, v.motorista, nomeV.get(v.veiculoId ?? "") ?? ""]
      .some((t) => t.toLowerCase().includes(b)));
  }, [viagens, busca, nomeV]);
  const totPag = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pag = Math.min(pagina, totPag);
  const visiveis = filtradas.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  const resumo = useMemo(() => {
    let km = 0, ped = 0, est = 0, real = 0, comReal = 0;
    for (const v of viagens) {
      km += v.distanciaKm ?? 0; ped += v.pedagioReal ?? v.pedagioEstimado ?? 0;
      if (v.tempoRealMin != null && v.tempoEstimadoMin != null) { est += v.tempoEstimadoMin; real += v.tempoRealMin; comReal++; }
    }
    return { km, ped, dif: comReal ? (real - est) / comReal : null };
  }, [viagens]);

  function abrir(v?: (typeof viagens)[number]) {
    if (v) {
      const { id, createdAt, ...rest } = v; setForm(rest); setEditId(id);
      setHReal(v.tempoRealMin != null ? String(Math.floor(v.tempoRealMin / 60)) : "");
      setMReal(v.tempoRealMin != null ? String(Math.round(v.tempoRealMin % 60)) : "");
    } else { setForm(vazio()); setEditId(null); setHReal(""); setMReal(""); }
  }

  async function onCalcular() {
    if (!form?.origem.trim() || !form.destino.trim()) { toast.error("Preencha origem e destino."); return; }
    setCalculando(true);
    try {
      const r = await calcular({ data: { origem: form.origem, destino: form.destino } });
      setForm({ ...form, distanciaKm: Math.round(r.distanciaKm * 10) / 10, tempoEstimadoMin: r.tempoMin, pedagioEstimado: r.pedagio });
      toast.success("Estimativa calculada");
    } catch (e: any) { toast.error(e?.message ?? "Erro ao calcular rota"); }
    finally { setCalculando(false); }
  }

  async function onSalvar() {
    if (!form || trava.current) return;
    if (!form.origem.trim() || !form.destino.trim()) { toast.error("Preencha origem e destino."); return; }
    const tempoReal = hReal.trim() === "" && mReal.trim() === "" ? null : (Number(hReal || 0) * 60 + Number(mReal || 0));
    trava.current = true; setSalvando(true);
    try {
      await salvar({ ...form, tempoRealMin: tempoReal }, editId);
      toast.success("Viagem salva"); setForm(null);
    } catch (e: any) { toast.error(e?.message ?? "Erro ao salvar"); }
    finally { trava.current = false; setSalvando(false); }
  }

  async function onExcluir() {
    if (!editId || !confirm("Excluir esta viagem?")) return;
    try { await excluir(editId); toast.success("Viagem excluída"); setForm(null); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao excluir"); }
  }

  const diff = (v: (typeof viagens)[number]) => {
    if (v.tempoRealMin == null || v.tempoEstimadoMin == null) return null;
    return v.tempoRealMin - v.tempoEstimadoMin;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Viagens" />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card icon={<RouteIcon className="h-5 w-5" />} label="Viagens" value={String(viagens.length)} cor="var(--bag-retorno)" />
          <Card icon={<MapPin className="h-5 w-5" />} label="KM estimados" value={`${resumo.km.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} km`} cor="var(--bag-entrada)" />
          <Card icon={<Wallet className="h-5 w-5" />} label="Pedágios" value={brl(resumo.ped)} cor="var(--bag-saida)" />
          <Card icon={<Clock className="h-5 w-5" />} label="Real x estimado (média)"
            value={resumo.dif == null ? "—" : `${resumo.dif > 0 ? "+" : resumo.dif < 0 ? "-" : ""}${fmtTempo(Math.abs(resumo.dif))}`}
            cor="var(--bag-balanco)" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar origem, destino, motorista, caminhão…" value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }} />
          </div>
          {!somenteLeitura && <Button onClick={() => abrir()}><Plus className="mr-1 h-4 w-4" />Nova viagem</Button>}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Saída → Destino</TableHead><TableHead>Caminhão</TableHead>
                <TableHead>Motorista</TableHead><TableHead className="text-right">Distância</TableHead>
                <TableHead className="text-right">Estimado</TableHead><TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Pedágio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!carregando && visiveis.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Nenhuma viagem.</TableCell></TableRow>}
              {visiveis.map((v) => {
                const d = diff(v);
                return (
                  <TableRow key={v.id} className={somenteLeitura ? "" : "cursor-pointer"} onClick={() => !somenteLeitura && abrir(v)}>
                    <TableCell>{fmtData(v.data)}</TableCell>
                    <TableCell className="max-w-80"><div className="truncate">{v.origem}</div><div className="truncate text-muted-foreground">→ {v.destino}</div></TableCell>
                    <TableCell>{nomeV.get(v.veiculoId ?? "") ?? "—"}</TableCell>
                    <TableCell>{v.motorista || "—"}</TableCell>
                    <TableCell className="text-right">{v.distanciaKm == null ? "—" : `${v.distanciaKm.toLocaleString("pt-BR")} km`}</TableCell>
                    <TableCell className="text-right">{fmtTempo(v.tempoEstimadoMin)}</TableCell>
                    <TableCell className="text-right">
                      {fmtTempo(v.tempoRealMin)}
                      {d != null && d !== 0 && (
                        <div className="text-xs font-medium" style={{ color: d > 0 ? "var(--negativo)" : "var(--positivo)" }}>
                          {d > 0 ? "+" : "-"}{fmtTempo(Math.abs(d))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{brl(v.pedagioReal ?? v.pedagioEstimado)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totPag > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button variant="outline" size="sm" disabled={pag <= 1} onClick={() => setPagina(pag - 1)}>Anterior</Button>
            <span>Página {pag} de {totPag}</span>
            <Button variant="outline" size="sm" disabled={pag >= totPag} onClick={() => setPagina(pag + 1)}>Próxima</Button>
          </div>
        )}
      </main>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editId ? "Editar viagem" : "Nova viagem"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                <div><Label>Motorista</Label><Input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} /></div>
              </div>
              <div><Label>Caminhão</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.veiculoId ?? ""}
                  onChange={(e) => setForm({ ...form, veiculoId: e.target.value || null })}>
                  <option value="">— Selecione —</option>
                  {veiculos.map((v) => <option key={v.id} value={v.id}>{`${v.modelo} ${v.placa}`.trim()}</option>)}
                </select>
              </div>
              <div><Label>Endereço de saída</Label><Input placeholder="Ex.: Rua X, 100, Brasília - DF" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} /></div>
              <div><Label>Endereço de destino</Label><Input placeholder="Ex.: Goiânia - GO" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} /></div>
              <Button type="button" variant="secondary" onClick={onCalcular} disabled={calculando}>
                <Calculator className="mr-1 h-4 w-4" />{calculando ? "Calculando…" : "Calcular estimativa"}
              </Button>

              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-semibold">Estimativa</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Distância (km)</Label><Input value={form.distanciaKm ?? ""} onChange={(e) => setForm({ ...form, distanciaKm: numOuNull(e.target.value) })} /></div>
                  <div><Label>Tempo (min)</Label><Input value={form.tempoEstimadoMin ?? ""} onChange={(e) => setForm({ ...form, tempoEstimadoMin: numOuNull(e.target.value) })} />
                    <p className="mt-1 text-xs text-muted-foreground">{fmtTempo(form.tempoEstimadoMin)}</p></div>
                  <div><Label>Pedágio (R$)</Label><Input value={form.pedagioEstimado ?? ""} onChange={(e) => setForm({ ...form, pedagioEstimado: numOuNull(e.target.value) })} /></div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Pedágio calculado para carro; caminhões pagam por eixo, então confira o valor real.</p>
              </div>

              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-semibold">Realizado</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Horas</Label><Input inputMode="numeric" value={hReal} onChange={(e) => setHReal(e.target.value.replace(/\D/g, ""))} /></div>
                  <div><Label>Minutos</Label><Input inputMode="numeric" value={mReal} onChange={(e) => setMReal(e.target.value.replace(/\D/g, ""))} /></div>
                  <div><Label>Pedágio real (R$)</Label><Input value={form.pedagioReal ?? ""} onChange={(e) => setForm({ ...form, pedagioReal: numOuNull(e.target.value) })} /></div>
                </div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {editId && <Button variant="outline" className="text-destructive" onClick={onExcluir}><Trash2 className="mr-1 h-4 w-4" />Excluir</Button>}
            <Button onClick={onSalvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({ icon, label, value, cor }: { icon: React.ReactNode; label: string; value: string; cor: string }) {
  return (
    <div className="rounded-lg border bg-card p-4" style={{ borderLeft: `4px solid ${cor}` }}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><span style={{ color: cor }}>{icon}</span>{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
