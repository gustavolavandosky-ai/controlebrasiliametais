import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Calculator, Clock, MapPin, PauseCircle, Plus, Route as RouteIcon, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAccess } from "@/hooks/use-access";
import { useAbastecimento } from "@/lib/abastecimento-store";
import { diferencaMin, duracaoMin, fmtTempo, useViagens, type ViagemInput } from "@/lib/viagens-store";
import { estimarRota } from "@/lib/rotas.functions";

export const Route = createFileRoute("/_authenticated/trajetos")({
  head: () => ({
    meta: [
      { title: "Trajetos · Brasília Metais" },
      { name: "description", content: "Trajetos dos caminhões com estimativa de tempo, paradas e tempo real." },
      { property: "og:title", content: "Trajetos · Brasília Metais" },
      { property: "og:description", content: "Estimativa de rota, paradas e tempo real das viagens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ViagensPage,
});

const POR_PAGINA = 50;
const fmtData = (d: string) => d.split("-").reverse().join("/");
const hoje = () => new Date().toISOString().slice(0, 10);
const vazio = (): ViagemInput => ({
  data: hoje(), origem: "", destino: "", veiculoId: null, motorista: "", distanciaKm: null,
  tempoEstimadoMin: null, tempoRealMin: null, observacao: "", clienteId: null, saiuEmpresa: false,
  saidaEm: null, chegadaEm: null, houveParada: false, paradasQtd: 0, paradasMin: 0, paradasJustificativa: "",
});
const numOuNull = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
/** ISO -> valor de input datetime-local (hora local) */
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso); const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (s: string) => (s ? new Date(s).toISOString() : null);
const fmtHora = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

function ViagensPage() {
  const { somenteLeitura } = useAccess();
  const { viagens, carregando, salvar, excluir, clientes, salvarCliente, enderecoEmpresa, salvarEnderecoEmpresa } = useViagens();
  const { veiculos } = useAbastecimento();
  const calcular = useServerFn(estimarRota);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState<ViagemInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [novoCli, setNovoCli] = useState(false);
  const [cliNome, setCliNome] = useState(""); const [cliObs, setCliObs] = useState("");
  const [empOpen, setEmpOpen] = useState(false); const [empEnd, setEmpEnd] = useState("");
  const [calculando, setCalculando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const trava = useRef(false);
  const nomeV = useMemo(() => new Map(veiculos.map((v) => [v.id, `${v.modelo} ${v.placa}`.trim()])), [veiculos]);
  const nomeC = useMemo(() => new Map(clientes.map((c) => [c.id, c.nome])), [clientes]);

  const filtradas = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return viagens.filter((v) => !b || [v.origem, v.destino, v.motorista, nomeV.get(v.veiculoId ?? "") ?? "", nomeC.get(v.clienteId ?? "") ?? ""]
      .some((t) => t.toLowerCase().includes(b)));
  }, [viagens, busca, nomeV, nomeC]);
  const totPag = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pag = Math.min(pagina, totPag);
  const visiveis = filtradas.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  const resumo = useMemo(() => {
    let km = 0, parado = 0, soma = 0, qtd = 0;
    for (const v of viagens) {
      km += v.distanciaKm ?? 0; if (v.houveParada) parado += v.paradasMin;
      const d = diferencaMin(v); if (d != null) { soma += d; qtd++; }
    }
    return { km, parado, dif: qtd ? soma / qtd : null };
  }, [viagens]);

  function abrir(v?: (typeof viagens)[number]) {
    setNovoCli(false); setCliNome(""); setCliObs("");
    if (v) { const { id, createdAt, ...rest } = v; setForm(rest); setEditId(id); }
    else { setForm(vazio()); setEditId(null); }
  }

  const realMin = form ? duracaoMin(form.saidaEm, form.chegadaEm) : null;
  const destinoManual = !!form && !form.clienteId && form.destino.trim() !== "";

  async function onCalcular() {
    if (!form?.origem.trim() || !form.destino.trim()) { toast.error("Preencha origem e destino."); return; }
    setCalculando(true);
    try {
      const r = await calcular({ data: { origem: form.origem, destino: form.destino } });
      setForm({ ...form, distanciaKm: Math.round(r.distanciaKm * 10) / 10, tempoEstimadoMin: r.tempoMin });
      toast.success("Estimativa calculada");
    } catch (e: any) { toast.error(e?.message ?? "Erro ao calcular rota"); }
    finally { setCalculando(false); }
  }

  async function onSalvar() {
    if (!form || trava.current) return;
    if (!form.origem.trim() || !form.destino.trim()) { toast.error("Preencha origem e destino."); return; }
    if (form.saidaEm && form.chegadaEm && realMin == null) { toast.error("A chegada precisa ser depois da saída."); return; }
    if (novoCli && destinoManual && !cliNome.trim()) { toast.error("Informe o nome do cliente."); return; }
    trava.current = true; setSalvando(true);
    try {
      let clienteId = form.clienteId;
      if (novoCli && destinoManual) {
        clienteId = await salvarCliente({ nome: cliNome.trim(), endereco: form.destino.trim(), observacao: cliObs.trim() });
      }
      await salvar({ ...form, clienteId, tempoRealMin: realMin }, editId);
      toast.success("Viagem salva"); setForm(null);
    } catch (e: any) { toast.error(e?.message ?? "Erro ao salvar"); }
    finally { trava.current = false; setSalvando(false); }
  }

  async function onExcluir() {
    if (!editId || !confirm("Excluir esta viagem?")) return;
    try { await excluir(editId); toast.success("Viagem excluída"); setForm(null); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao excluir"); }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Trajetos" />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card icon={<RouteIcon className="h-5 w-5" />} label="Viagens" value={String(viagens.length)} cor="var(--bag-retorno)" />
          <Card icon={<MapPin className="h-5 w-5" />} label="KM estimados" value={`${resumo.km.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} km`} cor="var(--bag-entrada)" />
          <Card icon={<PauseCircle className="h-5 w-5" />} label="Tempo total parado" value={fmtTempo(resumo.parado)} cor="var(--bag-saida)" />
          <Card icon={<Clock className="h-5 w-5" />} label="Rodando x estimado (média)"
            value={resumo.dif == null ? "—" : `${resumo.dif > 0 ? "+" : resumo.dif < 0 ? "-" : ""}${fmtTempo(Math.abs(resumo.dif))}`}
            cor="var(--bag-balanco)" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar origem, destino, cliente, motorista, caminhão…" value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }} />
          </div>
          {!somenteLeitura && <Button variant="outline" onClick={() => { setEmpEnd(enderecoEmpresa); setEmpOpen(true); }}><Building2 className="mr-1 h-4 w-4" />Endereço da empresa</Button>}
          {!somenteLeitura && <Button onClick={() => abrir()}><Plus className="mr-1 h-4 w-4" />Nova viagem</Button>}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Saída → Destino</TableHead><TableHead>Caminhão</TableHead>
                <TableHead>Motorista</TableHead><TableHead className="text-right">Distância</TableHead>
                <TableHead className="text-right">Estimado</TableHead><TableHead className="text-right">Real</TableHead>
                <TableHead>Paradas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!carregando && visiveis.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Nenhuma viagem.</TableCell></TableRow>}
              {visiveis.map((v) => {
                const d = diferencaMin(v);
                const cli = nomeC.get(v.clienteId ?? "");
                return (
                  <TableRow key={v.id} className={somenteLeitura ? "" : "cursor-pointer"} onClick={() => !somenteLeitura && abrir(v)}>
                    <TableCell>{fmtData(v.data)}</TableCell>
                    <TableCell className="max-w-80">
                      <div className="truncate">{v.saiuEmpresa ? "Empresa" : v.origem}</div>
                      <div className="truncate text-muted-foreground">→ {cli ? `${cli} · ` : ""}{v.destino}</div>
                    </TableCell>
                    <TableCell>{nomeV.get(v.veiculoId ?? "") ?? "—"}</TableCell>
                    <TableCell>{v.motorista || "—"}</TableCell>
                    <TableCell className="text-right">{v.distanciaKm == null ? "—" : `${v.distanciaKm.toLocaleString("pt-BR")} km`}</TableCell>
                    <TableCell className="text-right">{fmtTempo(v.tempoEstimadoMin)}</TableCell>
                    <TableCell className="text-right">
                      {fmtTempo(v.tempoRealMin)}
                      {v.saidaEm && v.chegadaEm && <div className="text-xs text-muted-foreground">{fmtHora(v.saidaEm)} → {fmtHora(v.chegadaEm)}</div>}
                      {d != null && d !== 0 && (
                        <div className="text-xs font-medium" style={{ color: d > 0 ? "var(--negativo)" : "var(--positivo)" }}>
                          {d > 0 ? "+" : "-"}{fmtTempo(Math.abs(d))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-56">
                      {v.houveParada ? (<><div>{v.paradasQtd}× · {fmtTempo(v.paradasMin)}</div>
                        <div className="truncate text-xs text-muted-foreground">{v.paradasJustificativa}</div></>) : "—"}
                    </TableCell>
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

      <Dialog open={empOpen} onOpenChange={setEmpOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Endereço da empresa</DialogTitle></DialogHeader>
          <Input placeholder="Ex.: Rua X, 100, Brasília - DF" value={empEnd} onChange={(e) => setEmpEnd(e.target.value)} />
          <DialogFooter><Button onClick={async () => {
            try { await salvarEnderecoEmpresa(empEnd.trim()); toast.success("Endereço salvo"); setEmpOpen(false); }
            catch (e: any) { toast.error(e?.message ?? "Erro ao salvar"); }
          }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

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

              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.saiuEmpresa} onCheckedChange={(c) => {
                  const on = c === true;
                  if (on && !enderecoEmpresa) toast.info("Cadastre o endereço da empresa no botão \"Endereço da empresa\".");
                  setForm({ ...form, saiuEmpresa: on, origem: on ? enderecoEmpresa : "" });
                }} />
                Saiu da empresa
              </label>
              <div><Label>Endereço de saída</Label><Input disabled={form.saiuEmpresa} placeholder="Ex.: Rua X, 100, Brasília - DF" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} /></div>

              <div><Label>Cliente</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.clienteId ?? ""}
                  onChange={(e) => {
                    const c = clientes.find((x) => x.id === e.target.value);
                    setForm({ ...form, clienteId: c?.id ?? null, destino: c ? c.endereco : "" });
                    setNovoCli(false);
                  }}>
                  <option value="">— Preencher manualmente —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div><Label>Endereço de destino</Label><Input placeholder="Ex.: Goiânia - GO" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} /></div>
              {destinoManual && (
                <div className="rounded-md border border-dashed p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={novoCli} onCheckedChange={(c) => setNovoCli(c === true)} />Salvar cliente
                  </label>
                  {novoCli && (
                    <div className="mt-3 grid gap-2">
                      <div><Label>Nome do cliente</Label><Input value={cliNome} onChange={(e) => setCliNome(e.target.value)} /></div>
                      <div><Label>Observação</Label><Input value={cliObs} onChange={(e) => setCliObs(e.target.value)} /></div>
                    </div>
                  )}
                </div>
              )}

              <Button type="button" variant="secondary" onClick={onCalcular} disabled={calculando}>
                <Calculator className="mr-1 h-4 w-4" />{calculando ? "Calculando…" : "Calcular estimativa"}
              </Button>
              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-semibold">Estimativa</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Distância (km)</Label><Input value={form.distanciaKm ?? ""} onChange={(e) => setForm({ ...form, distanciaKm: numOuNull(e.target.value) })} /></div>
                  <div><Label>Tempo (min)</Label><Input value={form.tempoEstimadoMin ?? ""} onChange={(e) => setForm({ ...form, tempoEstimadoMin: numOuNull(e.target.value) })} />
                    <p className="mt-1 text-xs text-muted-foreground">{fmtTempo(form.tempoEstimadoMin)}</p></div>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-semibold">Realizado</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Saída</Label><Input type="datetime-local" value={toLocal(form.saidaEm)} onChange={(e) => setForm({ ...form, saidaEm: fromLocal(e.target.value) })} /></div>
                  <div><Label>Chegada no destino</Label><Input type="datetime-local" value={toLocal(form.chegadaEm)} onChange={(e) => setForm({ ...form, chegadaEm: fromLocal(e.target.value) })} /></div>
                </div>
                <p className="mt-2 text-sm">Duração: <b>{fmtTempo(realMin)}</b></p>

                <label className="mt-3 flex items-center gap-2 text-sm">
                  <Checkbox checked={form.houveParada} onCheckedChange={(c) => setForm({ ...form, houveParada: c === true })} />Houve parada?
                </label>
                {form.houveParada && (
                  <div className="mt-3 grid gap-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Quantidade de paradas</Label><Input inputMode="numeric" value={form.paradasQtd || ""} onChange={(e) => setForm({ ...form, paradasQtd: Number(e.target.value.replace(/\D/g, "") || 0) })} /></div>
                      <div><Label>Tempo parado total (min)</Label><Input inputMode="numeric" value={form.paradasMin || ""} onChange={(e) => setForm({ ...form, paradasMin: Number(e.target.value.replace(/\D/g, "") || 0) })} />
                        <p className="mt-1 text-xs text-muted-foreground">{fmtTempo(form.paradasMin)}</p></div>
                    </div>
                    <div><Label>Justificativas</Label><Textarea placeholder="Ex.: almoço, abastecimento, fila de carga" value={form.paradasJustificativa} onChange={(e) => setForm({ ...form, paradasJustificativa: e.target.value })} /></div>
                  </div>
                )}
                {realMin != null && form.tempoEstimadoMin != null && (() => {
                  const d = diferencaMin({ ...form, tempoRealMin: realMin });
                  return d == null ? null : (
                    <p className="mt-2 text-sm">Rodando: <b>{fmtTempo(realMin - (form.houveParada ? form.paradasMin : 0))}</b> · Diferença:{" "}
                      <b style={{ color: d > 0 ? "var(--negativo)" : "var(--positivo)" }}>{d > 0 ? "+" : d < 0 ? "-" : ""}{fmtTempo(Math.abs(d))}</b></p>
                  );
                })()}
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
