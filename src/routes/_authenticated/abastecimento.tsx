import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fuel, Plus, Search, Trash2, Truck, Pencil, Gauge, Droplets, Wallet } from "lucide-react";
import { useAccess } from "@/hooks/use-access";
import {
  COMBUSTIVEIS, calcularMedias, compararAbast, useAbastecimento,
  type AbastecimentoInput, type Veiculo, type VeiculoInput,
} from "@/lib/abastecimento-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/abastecimento")({
  head: () => ({
    meta: [
      { title: "Controle de Abastecimento · Brasília Metais" },
      { name: "description", content: "Abastecimentos da frota com KM rodados, litros, gastos e média KM/L." },
      { property: "og:title", content: "Controle de Abastecimento · Brasília Metais" },
      { property: "og:description", content: "Gastos e consumo de combustível por veículo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AbastecimentoPage,
});

const POR_PAGINA = 50;
const COR: Record<string, string> = {
  DIESEL: "var(--bag-saida)", GASOLINA: "var(--bag-entrada)", ETANOL: "var(--bag-retorno)", GNV: "var(--bag-balanco)",
};
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n: number, d = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtData = (d: string) => d.split("-").reverse().join("/");
const hoje = () => new Date().toISOString().slice(0, 10);

function AbastecimentoPage() {
  const { somenteLeitura } = useAccess();
  const { veiculos, abastecimentos, carregando, salvarVeiculo, excluirVeiculo, salvar, excluir } = useAbastecimento();
  const [sel, setSel] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [comb, setComb] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState<AbastecimentoInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [vForm, setVForm] = useState<VeiculoInput | null>(null);
  const [vEditId, setVEditId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const trava = useRef(false);

  const nomeV = useMemo(() => new Map(veiculos.map((v) => [v.id, v])), [veiculos]);
  const medias = useMemo(() => calcularMedias(abastecimentos), [abastecimentos]);
  const doSel = useMemo(
    () => abastecimentos.filter((a) => sel === "todos" || a.veiculoId === sel),
    [abastecimentos, sel],
  );
  const totais = useMemo(() => {
    let valor = 0, litros = 0, km = 0, litrosKm = 0;
    const porComb: Record<string, { valor: number; litros: number }> = {};
    for (const a of doSel) {
      valor += a.valor; litros += a.litros;
      const m = medias.get(a.id);
      if (m?.kmRodados != null) { km += m.kmRodados; litrosKm += a.litros; }
      const c = (porComb[a.combustivel] ??= { valor: 0, litros: 0 });
      c.valor += a.valor; c.litros += a.litros;
    }
    return { valor, litros, km, media: litrosKm > 0 ? km / litrosKm : null, porComb };
  }, [doSel, medias]);

  const motoristas = useMemo(
    () => [...new Set(abastecimentos.map((a) => a.motorista).filter(Boolean))].sort(),
    [abastecimentos],
  );

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return [...doSel].sort((a, b) => compararAbast(b, a))
      .filter((a) => comb === "todos" || a.combustivel === comb)
      .filter((a) => !t || `${a.motorista} ${a.observacao} ${nomeV.get(a.veiculoId)?.placa ?? ""} ${nomeV.get(a.veiculoId)?.modelo ?? ""}`.toLowerCase().includes(t));
  }, [doSel, busca, comb, nomeV]);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas);
  const visiveis = lista.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  const novo = () => {
    if (veiculos.length === 0) { toast.error("Cadastre um veículo primeiro."); return; }
    setEditId(null);
    setForm({ veiculoId: sel !== "todos" ? sel : (veiculos[0]?.id ?? ""), data: hoje(), combustivel: "DIESEL", valor: 0, litros: 0, kmAtual: null, motorista: "", observacao: "" });
  };
  const run = async (fn: () => Promise<void>, ok: string, fechar: () => void) => {
    if (trava.current) return;
    trava.current = true; setSalvando(true);
    try { await fn(); toast.success(ok); fechar(); }
    catch (e) { toast.error((e as Error).message); }
    finally { trava.current = false; setSalvando(false); }
  };
  const set = <K extends keyof AbastecimentoInput>(k: K, v: AbastecimentoInput[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const veicSel = sel !== "todos" ? nomeV.get(sel) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Controle de Abastecimento" />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6"
          style={{ background: "color-mix(in oklab, var(--bag-saida) 10%, var(--card))" }}>
          <div className="flex items-center gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: "color-mix(in oklab, var(--bag-saida) 20%, transparent)", color: "var(--bag-saida)" }}>
              <Fuel className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {veicSel ? `${veicSel.modelo || veicSel.placa} · ${veicSel.placa}${veicSel.ano ? ` · ${veicSel.ano}` : ""}` : "Frota inteira"}
              </p>
              <p className="text-4xl font-bold tracking-tight">{carregando ? "…" : brl(totais.valor)}</p>
              <p className="text-xs text-muted-foreground">total gasto em combustível</p>
            </div>
          </div>
          {!somenteLeitura && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setVEditId(null); setVForm({ placa: "", modelo: "", ano: "", observacoes: "" }); }}>
                <Truck className="mr-2 h-4 w-4" /> Novo veículo
              </Button>
              <Button onClick={novo} style={{ backgroundColor: "var(--bag-saida)" }}>
                <Plus className="mr-2 h-4 w-4" /> Novo abastecimento
              </Button>
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={sel === "todos" ? "default" : "outline"} onClick={() => { setSel("todos"); setPagina(1); }}>
            Todos os veículos
          </Button>
          {veiculos.map((v) => (
            <div key={v.id} className="flex">
              <Button size="sm" variant={sel === v.id ? "default" : "outline"} className={!somenteLeitura ? "rounded-r-none" : ""}
                onClick={() => { setSel(v.id); setPagina(1); }}>
                {v.placa}{v.modelo && v.modelo !== v.placa ? ` · ${v.modelo}` : ""}
              </Button>
              {!somenteLeitura && (
                <Button size="sm" variant="outline" className="rounded-l-none border-l-0 px-2" aria-label={`Editar ${v.placa}`}
                  onClick={() => { setVEditId(v.id); const { id: _i, ...r } = v; setVForm(r); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Cartao titulo="Total gasto" valor={brl(totais.valor)} cor="var(--negativo)" icone={<Wallet className="h-4 w-4" />} />
          <Cartao titulo="Total de litros" valor={`${num(totais.litros)} L`} cor="var(--bag-retorno)" icone={<Droplets className="h-4 w-4" />} />
          <Cartao titulo="KM rodados" valor={num(totais.km, 0)} cor="var(--bag-balanco)" icone={<Truck className="h-4 w-4" />} />
          <Cartao titulo="Média KM/L" valor={totais.media != null ? num(totais.media) : "—"} cor="var(--bag-entrada)" icone={<Gauge className="h-4 w-4" />} />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {COMBUSTIVEIS.map((c) => (
            <div key={c} className="rounded-xl border bg-card p-3" style={{ boxShadow: `inset 0 3px 0 ${COR[c]}` }}>
              <p className="text-xs font-semibold" style={{ color: COR[c] }}>{c}</p>
              <p className="text-sm">{brl(totais.porComb[c]?.valor ?? 0)} · {num(totais.porComb[c]?.litros ?? 0)} L</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar motorista, veículo ou observação" value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }} />
          </div>
          {(["todos", ...COMBUSTIVEIS] as const).map((c) => (
            <Button key={c} size="sm" variant={comb === c ? "default" : "outline"} onClick={() => { setComb(c); setPagina(1); }}>
              {c === "todos" ? "Todos" : c}
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Combustível</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Litros</TableHead>
                <TableHead className="text-right">R$/L</TableHead>
                <TableHead className="text-right">KM atual</TableHead>
                <TableHead className="text-right">KM rodados</TableHead>
                <TableHead className="text-right">Média KM/L</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.length === 0 && (
                <TableRow><TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                  {carregando ? "Carregando…" : "Nenhum abastecimento ainda."}
                </TableCell></TableRow>
              )}
              {visiveis.map((a) => {
                const m = medias.get(a.id);
                const v = nomeV.get(a.veiculoId);
                return (
                  <TableRow key={a.id} className={somenteLeitura ? "" : "cursor-pointer"}
                    style={{ boxShadow: `inset 4px 0 0 ${COR[a.combustivel] ?? "var(--border)"}` }}
                    onClick={() => { if (somenteLeitura) return; setEditId(a.id); const { id: _i, createdAt: _c, ...r } = a; setForm(r); }}>
                    <TableCell className="whitespace-nowrap">{fmtData(a.data)}</TableCell>
                    <TableCell className="whitespace-nowrap">{v ? v.placa : "—"}</TableCell>
                    <TableCell>
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ color: COR[a.combustivel], backgroundColor: `color-mix(in oklab, ${COR[a.combustivel] ?? "var(--muted)"} 15%, transparent)` }}>
                        {a.combustivel}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{brl(a.valor)}</TableCell>
                    <TableCell className="text-right">{num(a.litros)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{a.litros > 0 ? num(a.valor / a.litros) : "—"}</TableCell>
                    <TableCell className="text-right">{a.kmAtual != null ? num(a.kmAtual, 0) : "—"}</TableCell>
                    <TableCell className="text-right">{m?.kmRodados != null ? num(m.kmRodados, 0) : "—"}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: "var(--bag-entrada)" }}>
                      {m?.media != null ? num(m.media) : "—"}
                    </TableCell>
                    <TableCell>{a.motorista}</TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{a.observacao}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {paginas > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Mostrando {(pag - 1) * POR_PAGINA + 1}–{Math.min(pag * POR_PAGINA, lista.length)} de {lista.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={pag === 1} onClick={() => setPagina(pag - 1)}>Anterior</Button>
              <Button size="sm" variant="outline" disabled={pag === paginas} onClick={() => setPagina(pag + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!form} onOpenChange={(o) => { if (!o && !salvando) setForm(null); }}>
        <DialogContent>
          {form && (
            <>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} abastecimento</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Veículo</Label>
                    <select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.veiculoId}
                      onChange={(e) => set("veiculoId", e.target.value)}>
                      {veiculos.map((v: Veiculo) => <option key={v.id} value={v.id}>{v.placa}{v.modelo ? ` · ${v.modelo}` : ""}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Combustível</Label>
                    <select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.combustivel}
                      onChange={(e) => set("combustivel", e.target.value)}>
                      {COMBUSTIVEIS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Valor abastecido (R$)</Label>
                    <Input type="number" step="0.01" min={0} value={form.valor || ""} onChange={(e) => set("valor", Number(e.target.value))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Litros</Label>
                    <Input type="number" step="0.01" min={0} value={form.litros || ""} onChange={(e) => set("litros", Number(e.target.value))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>KM atual</Label>
                    <Input type="number" min={0} value={form.kmAtual ?? ""}
                      onChange={(e) => set("kmAtual", e.target.value === "" ? null : Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Motorista</Label>
                  <Input list="motoristas" value={form.motorista} maxLength={100} onChange={(e) => set("motorista", e.target.value.toUpperCase())} />
                  <datalist id="motoristas">{motoristas.map((m) => <option key={m} value={m} />)}</datalist>
                </div>
                <div className="grid gap-1.5">
                  <Label>Observações</Label>
                  <Textarea value={form.observacao} maxLength={1000} onChange={(e) => set("observacao", e.target.value)} />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                {editId ? (
                  <Button variant="ghost" className="text-destructive" disabled={salvando}
                    onClick={() => { if (confirm("Excluir este abastecimento?")) void run(() => excluir(editId), "Abastecimento excluído", () => setForm(null)); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                ) : <span />}
                <Button disabled={salvando} style={{ backgroundColor: "var(--bag-saida)" }}
                  onClick={() => {
                    if (form.valor <= 0 || form.litros <= 0) { toast.error("Informe valor e litros."); return; }
                    void run(() => salvar(form, editId ?? undefined), "Abastecimento salvo", () => setForm(null));
                  }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!vForm} onOpenChange={(o) => { if (!o && !salvando) setVForm(null); }}>
        <DialogContent>
          {vForm && (
            <>
              <DialogHeader><DialogTitle>{vEditId ? "Editar" : "Novo"} veículo</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Placa / identificação</Label>
                  <Input value={vForm.placa} maxLength={30} onChange={(e) => setVForm({ ...vForm, placa: e.target.value.toUpperCase() })} /></div>
                <div className="grid gap-1.5"><Label>Modelo</Label>
                  <Input value={vForm.modelo} maxLength={60} onChange={(e) => setVForm({ ...vForm, modelo: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Ano</Label>
                  <Input value={vForm.ano} maxLength={10} onChange={(e) => setVForm({ ...vForm, ano: e.target.value })} /></div>
                <div className="col-span-2 grid gap-1.5"><Label>Observações</Label>
                  <Textarea value={vForm.observacoes} maxLength={500} onChange={(e) => setVForm({ ...vForm, observacoes: e.target.value })} /></div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                {vEditId ? (
                  <Button variant="ghost" className="text-destructive" disabled={salvando}
                    onClick={() => {
                      if (confirm("Excluir este veículo e todos os abastecimentos dele?"))
                        void run(() => excluirVeiculo(vEditId), "Veículo excluído", () => { setVForm(null); setSel("todos"); });
                    }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                ) : <span />}
                <Button disabled={salvando} onClick={() => {
                  if (!vForm.placa.trim()) { toast.error("Informe a placa."); return; }
                  void run(() => salvarVeiculo(vForm, vEditId ?? undefined), "Veículo salvo", () => setVForm(null));
                }}>{salvando ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Cartao({ titulo, valor, cor, icone }: { titulo: string; valor: string; cor: string; icone: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4" style={{ boxShadow: `inset 0 4px 0 ${cor}` }}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        {titulo}<span style={{ color: cor }}>{icone}</span>
      </div>
      <p className="mt-2 text-2xl font-bold" style={{ color: cor }}>{valor}</p>
    </div>
  );
}
