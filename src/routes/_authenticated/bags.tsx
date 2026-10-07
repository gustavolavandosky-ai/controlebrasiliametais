import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Scale,
  Search,
  ShoppingBag,
  Trash2,
  Undo2,
  AlertTriangle,
} from "lucide-react";
import { useAccess } from "@/hooks/use-access";
import {
  calcularSaldosBags,
  compararBag,
  useBags,
  type BagMov,
  type BagMovInput,
  type TipoBag,
} from "@/lib/bags-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bags")({
  head: () => ({
    meta: [
      { title: "Controle de Bags · Brasília Metais" },
      { name: "description", content: "Estoque de bags com entradas, saídas, retornos e balanços." },
      { property: "og:title", content: "Controle de Bags · Brasília Metais" },
      { property: "og:description", content: "Quantas bags você tem, quem levou e quantas voltaram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BagsPage,
});

const POR_PAGINA = 50;
const CORES: Record<TipoBag, string> = {
  entrada: "var(--bag-entrada)",
  saida: "var(--bag-saida)",
  balanco: "var(--bag-balanco)",
};
const NOMES: Record<TipoBag, string> = { entrada: "Entrada", saida: "Saída", balanco: "Balanço" };
function situacaoSaida(m: { tipo: TipoBag; quantidade: number; quantidadeRetornada: number }) {
  if (m.tipo !== "saida") return null;
  if (m.quantidadeRetornada > m.quantidade) return { cor: "var(--negativo)", texto: "Voltou mais do que saiu" };
  if (m.quantidadeRetornada < m.quantidade) return { cor: "var(--bag-pendente)", texto: "Voltou menos do que saiu" };
  return null;
}
const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmtData = (d: string) => d.split("-").reverse().join("/");
const hoje = () => new Date().toLocaleDateString("en-CA");
const vazio = (tipo: TipoBag): BagMovInput => ({
  tipo, data: hoje(), quantidade: 0, quantidadeRetornada: 0, fornecedor: "", cliente: "", observacao: "",
});

function Cartao({ titulo, valor, cor, icone }: { titulo: string; valor: string; cor: string; icone: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4" style={{ borderTop: `4px solid ${cor}` }}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        {titulo}
        <span style={{ color: cor }}>{icone}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold" style={{ color: cor }}>{valor}</p>
    </div>
  );
}

function Selo({ tipo }: { tipo: TipoBag }) {
  const cor = CORES[tipo];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: cor, backgroundColor: `color-mix(in oklab, ${cor} 15%, transparent)` }}
    >
      {NOMES[tipo]}
    </span>
  );
}

function BagsPage() {
  const { movimentos, carregando, add, update, remove } = useBags();
  const { somenteLeitura } = useAccess();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<TipoBag | "todos">("todos");
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState<BagMovInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const travado = useRef(false);

  const { estoque, saldos } = useMemo(() => calcularSaldosBags(movimentos), [movimentos]);
  const totais = useMemo(() => {
    let ent = 0, sai = 0, ret = 0;
    for (const m of movimentos) {
      if (m.tipo === "entrada") ent += m.quantidade;
      if (m.tipo === "saida") { sai += m.quantidade; ret += m.quantidadeRetornada; }
    }
    return { ent, sai, ret, fora: sai - ret };
  }, [movimentos]);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return [...movimentos]
      .sort((a, b) => compararBag(b, a))
      .filter((m) => filtro === "todos" || m.tipo === filtro)
      .filter((m) => !t || `${m.fornecedor} ${m.cliente} ${m.observacao}`.toLowerCase().includes(t));
  }, [movimentos, busca, filtro]);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas);
  const visiveis = lista.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  const abrir = (tipo: TipoBag) => { setEditId(null); setForm(vazio(tipo)); };
  const editar = (m: BagMov) => {
    if (somenteLeitura) return;
    setEditId(m.id);
    const { id: _i, createdAt: _c, ...rest } = m;
    setForm(rest);
  };

  const salvar = async () => {
    if (!form || travado.current) return;
    if (form.quantidade <= 0 && form.tipo !== "balanco") { toast.error("Informe a quantidade."); return; }
    if (form.tipo === "saida" && !form.cliente.trim()) { toast.error("Informe o cliente."); return; }
    travado.current = true; setSalvando(true);
    try {
      if (editId) await update(editId, form); else await add(form);
      toast.success("Movimentação salva");
      setForm(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      travado.current = false; setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!editId || travado.current || !confirm("Excluir esta movimentação?")) return;
    travado.current = true; setSalvando(true);
    try { await remove(editId); toast.success("Movimentação excluída"); setForm(null); }
    catch (e) { toast.error((e as Error).message); }
    finally { travado.current = false; setSalvando(false); }
  };

  const set = <K extends keyof BagMovInput>(k: K, v: BagMovInput[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Controle de Bags" />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6"
          style={{ background: "color-mix(in oklab, var(--bag-entrada) 10%, var(--card))" }}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: "color-mix(in oklab, var(--bag-entrada) 20%, transparent)", color: "var(--bag-entrada)" }}>
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bags em estoque agora</p>
              <p className="text-4xl font-bold tracking-tight" style={{ color: estoque < 0 ? "var(--negativo)" : "var(--foreground)" }}>
                {carregando ? "…" : fmt(estoque)}
              </p>
            </div>
          </div>
          {!somenteLeitura && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => abrir("entrada")} style={{ backgroundColor: "var(--bag-entrada)" }}>
                <ArrowDownToLine className="mr-2 h-4 w-4" /> Entrada
              </Button>
              <Button onClick={() => abrir("saida")} style={{ backgroundColor: "var(--bag-saida)" }}>
                <ArrowUpFromLine className="mr-2 h-4 w-4" /> Saída
              </Button>
              <Button onClick={() => abrir("balanco")} style={{ backgroundColor: "var(--bag-balanco)" }}>
                <Scale className="mr-2 h-4 w-4" /> Balanço
              </Button>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Cartao titulo="Total comprado" valor={fmt(totais.ent)} cor="var(--bag-entrada)" icone={<ArrowDownToLine className="h-4 w-4" />} />
          <Cartao titulo="Total que saiu" valor={fmt(totais.sai)} cor="var(--bag-saida)" icone={<ArrowUpFromLine className="h-4 w-4" />} />
          <Cartao titulo="Total que voltou" valor={fmt(totais.ret)} cor="var(--bag-retorno)" icone={<Undo2 className="h-4 w-4" />} />
          <Cartao titulo="Ainda com clientes" valor={fmt(totais.fora)} cor="var(--negativo)" icone={<ShoppingBag className="h-4 w-4" />} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar fornecedor, cliente ou observação" value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }} />
          </div>
          {(["todos", "entrada", "saida", "balanco"] as const).map((t) => (
            <Button key={t} size="sm" variant={filtro === t ? "default" : "outline"}
              onClick={() => { setFiltro(t); setPagina(1); }}>
              {t === "todos" ? "Todos" : NOMES[t]}
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fornecedor / Cliente</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Voltou</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {carregando ? "Carregando…" : "Nenhuma movimentação ainda."}
                </TableCell></TableRow>
              )}
              {visiveis.map((m) => {
                const s = saldos.get(m.id);
                const sit = situacaoSaida(m);
                return (
                  <TableRow key={m.id} onClick={() => editar(m)} className={somenteLeitura ? "" : "cursor-pointer"}
                    title={sit?.texto}
                    style={{
                      boxShadow: `inset 4px 0 0 ${sit?.cor ?? CORES[m.tipo]}`,
                      backgroundColor: sit ? `color-mix(in oklab, ${sit.cor} 14%, transparent)` : undefined,
                    }}>
                    <TableCell className="whitespace-nowrap">{fmtData(m.data)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Selo tipo={m.tipo} />
                        {sit && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: sit.cor }}>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {sit.texto === "Voltou mais do que saiu" ? "Alerta" : "Faltou voltar"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{m.tipo === "entrada" ? m.fornecedor : m.tipo === "saida" ? m.cliente : "—"}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: CORES[m.tipo] }}>
                      {m.tipo === "entrada" ? "+" : m.tipo === "saida" ? "−" : "="}{fmt(m.quantidade)}
                    </TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: "var(--bag-retorno)" }}>
                      {m.tipo === "saida" && m.quantidadeRetornada > 0 ? `+${fmt(m.quantidadeRetornada)}` : ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm">
                      <span className="text-muted-foreground">{fmt(s?.antes ?? 0)} → </span>
                      <span className="font-semibold">{fmt(s?.depois ?? 0)}</span>
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-sm text-muted-foreground">{m.observacao}</TableCell>
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
              <DialogHeader>
                <DialogTitle style={{ color: CORES[form.tipo] }}>
                  {editId ? "Editar" : "Nova"} {NOMES[form.tipo].toLowerCase()} de bags
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>{form.tipo === "entrada" ? "Data da compra" : "Data"}</Label>
                    <Input type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{form.tipo === "saida" ? "Quantas saíram" : form.tipo === "balanco" ? "Quantidade contada" : "Quantidade"}</Label>
                    <Input type="number" min={0} value={form.quantidade || ""} onChange={(e) => set("quantidade", Number(e.target.value))} />
                  </div>
                </div>
                {form.tipo === "entrada" && (
                  <div className="grid gap-1.5">
                    <Label>Fornecedor</Label>
                    <Input value={form.fornecedor} maxLength={150} onChange={(e) => set("fornecedor", e.target.value)} />
                  </div>
                )}
                {form.tipo === "saida" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Cliente</Label>
                      <Input value={form.cliente} maxLength={150} onChange={(e) => set("cliente", e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label style={{ color: "var(--bag-retorno)" }}>Quantas voltaram</Label>
                      <Input type="number" min={0} value={form.quantidadeRetornada || ""}
                        onChange={(e) => set("quantidadeRetornada", Number(e.target.value))} />
                    </div>
                  </div>
                )}
                {form.tipo === "saida" && (form.quantidadeRetornada > form.quantidade ? (
                  <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--negativo)" }}>
                    <AlertTriangle className="h-4 w-4" />
                    Alerta: voltaram {fmt(form.quantidadeRetornada - form.quantidade)} a mais do que saíram
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ficaram com o cliente:{" "}
                    <strong style={{ color: form.quantidadeRetornada < form.quantidade ? "var(--bag-pendente)" : "var(--bag-saida)" }}>
                      {fmt(form.quantidade - form.quantidadeRetornada)}
                    </strong>
                  </p>
                ))}
                <div className="grid gap-1.5">
                  <Label>Observações</Label>
                  <Textarea value={form.observacao} maxLength={1000} onChange={(e) => set("observacao", e.target.value)} />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                {editId ? (
                  <Button variant="ghost" className="text-destructive" disabled={salvando} onClick={() => void excluir()}>
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                ) : <span />}
                <Button disabled={salvando} onClick={() => void salvar()} style={{ backgroundColor: CORES[form.tipo] }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
