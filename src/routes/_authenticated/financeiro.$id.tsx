import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAccess } from "@/hooks/use-access";
import {
  FORMAS_PAGAMENTO,
  formatarData,
  formatarMoeda,
  useFinanceiro,
  type Gasto,
  type GastoInput,
} from "@/lib/financeiro-store";

export const Route = createFileRoute("/_authenticated/financeiro/$id")({
  head: () => ({
    meta: [
      { title: "Gastos do centro de custo · ERP Brasilia Metais" },
      { name: "description", content: "Lançamentos de gastos de um centro de custo." },
      { property: "og:title", content: "Gastos do centro de custo · ERP Brasilia Metais" },
      { property: "og:description", content: "Histórico e lançamento de gastos por centro de custo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CentroPage,
});

const POR_PAGINA = 50;
const hoje = () => new Date().toISOString().slice(0, 10);

function vazio(centroId: string): GastoInput {
  return { centroId, data: hoje(), descricao: "", categoria: "", fornecedor: "", formaPagamento: "PIX", notaFiscal: "", valor: 0, observacao: "" };
}

function CentroPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { centros, gastos, carregando, salvarGasto, excluirGasto, excluirCentro } = useFinanceiro();
  const { somenteLeitura } = useAccess();
  const centro = centros.find((c) => c.id === id);

  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState<GastoInput | null>(null);
  const [editId, setEditId] = useState<string | undefined>();
  const [salvando, setSalvando] = useState(false);

  const doCentro = useMemo(() => gastos.filter((g) => g.centroId === id), [gastos, id]);
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return doCentro.filter((g) => {
      if (de && g.data < de) return false;
      if (ate && g.data > ate) return false;
      if (q && ![g.descricao, g.categoria, g.fornecedor, g.notaFiscal, g.observacao].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [doCentro, busca, de, ate]);

  const total = lista.reduce((s, g) => s + g.valor, 0);
  const mesAtual = new Date().toISOString().slice(0, 7);
  const totalMes = doCentro.filter((g) => g.data.startsWith(mesAtual)).reduce((s, g) => s + g.valor, 0);
  const categorias = useMemo(() => [...new Set(gastos.map((g) => g.categoria).filter(Boolean))].sort(), [gastos]);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pg = Math.min(pagina, totalPaginas);
  const visiveis = lista.slice((pg - 1) * POR_PAGINA, pg * POR_PAGINA);

  const abrir = (g?: Gasto) => {
    if (somenteLeitura) return;
    setEditId(g?.id);
    setForm(g ? { ...g } : vazio(id));
  };

  const salvar = async () => {
    if (!form || salvando) return;
    if (!form.descricao.trim()) return toast.error("Informe a descrição.");
    if (!(form.valor > 0)) return toast.error("Informe um valor maior que zero.");
    setSalvando(true);
    try {
      await salvarGasto(form, editId);
      toast.success("Gasto salvo");
      setForm(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!editId || salvando || !confirm("Excluir este gasto?")) return;
    setSalvando(true);
    try {
      await excluirGasto(editId);
      toast.success("Gasto excluído");
      setForm(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir.");
    } finally {
      setSalvando(false);
    }
  };

  const apagarCentro = async () => {
    if (!confirm(`Excluir o centro "${centro?.nome}" e todos os ${doCentro.length} gastos dele?`)) return;
    try {
      await excluirCentro(id);
      toast.success("Centro de custo excluído");
      navigate({ to: "/financeiro" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  };

  const set = <K extends keyof GastoInput>(k: K, v: GastoInput[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Financeiro" />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Link to="/financeiro" className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar aos centros de custo
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{centro?.nome ?? (carregando ? "Carregando..." : "Centro não encontrado")}</h1>
            {centro?.descricao && <p className="text-sm text-muted-foreground">{centro.descricao}</p>}
          </div>
          {!somenteLeitura && centro && (
            <div className="flex gap-2">
              <Button variant="ghost" className="text-destructive" onClick={() => void apagarCentro()}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir centro
              </Button>
              <Button onClick={() => abrir()}>
                <Plus className="mr-2 h-4 w-4" /> Novo gasto
              </Button>
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total (filtro)</p>
            <p className="mt-1 text-2xl font-semibold">{formatarMoeda(total)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Este mês</p>
            <p className="mt-1 text-2xl font-semibold">{formatarMoeda(totalMes)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lançamentos</p>
            <p className="mt-1 text-2xl font-semibold">{lista.length}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="grid min-w-[220px] flex-1 gap-1">
            <Label htmlFor="g-busca">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="g-busca" className="pl-8" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Descrição, categoria, fornecedor, nota" />
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="g-de">De</Label>
            <Input id="g-de" type="date" value={de} onChange={(e) => { setDe(e.target.value); setPagina(1); }} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="g-ate">Até</Label>
            <Input id="g-ate" type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1); }} />
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {carregando ? "Carregando..." : "Nenhum gasto lançado."}
                  </TableCell>
                </TableRow>
              )}
              {visiveis.map((g) => (
                <TableRow key={g.id} className={somenteLeitura ? undefined : "cursor-pointer"} onClick={() => abrir(g)}>
                  <TableCell>{formatarData(g.data)}</TableCell>
                  <TableCell className="font-medium">
                    {g.descricao}
                    {g.observacao && <p className="max-w-[260px] truncate text-xs font-normal text-muted-foreground">{g.observacao}</p>}
                  </TableCell>
                  <TableCell>{g.categoria}</TableCell>
                  <TableCell>{g.fornecedor}</TableCell>
                  <TableCell>{g.formaPagamento}</TableCell>
                  <TableCell>{g.notaFiscal}</TableCell>
                  <TableCell className="text-right font-semibold">{formatarMoeda(g.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {lista.length > POR_PAGINA && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Página {pg} de {totalPaginas}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pg <= 1} onClick={() => setPagina(pg - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={pg >= totalPaginas} onClick={() => setPagina(pg + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </main>

      <Dialog open={form !== null} onOpenChange={(v) => !v && !salvando && setForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar gasto" : "Novo gasto"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="f-data">Data</Label>
                <Input id="f-data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="f-valor">Valor (R$)</Label>
                <Input id="f-valor" type="number" step="0.01" min="0" value={form.valor || ""} onChange={(e) => set("valor", Number(e.target.value))} />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <Label htmlFor="f-desc">Descrição</Label>
                <Input id="f-desc" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Conta de luz, peça do caminhão" />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="f-cat">Categoria</Label>
                <Input id="f-cat" list="categorias-gasto" value={form.categoria} onChange={(e) => set("categoria", e.target.value)} placeholder="Ex.: Energia, Manutenção" />
                <datalist id="categorias-gasto">
                  {categorias.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="f-forn">Fornecedor</Label>
                <Input id="f-forn" value={form.fornecedor} onChange={(e) => set("fornecedor", e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="f-pag">Forma de pagamento</Label>
                <select id="f-pag" className="h-9 rounded-md border bg-background px-3 text-sm" value={form.formaPagamento} onChange={(e) => set("formaPagamento", e.target.value)}>
                  {FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="f-nf">Nota fiscal / recibo</Label>
                <Input id="f-nf" value={form.notaFiscal} onChange={(e) => set("notaFiscal", e.target.value)} />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <Label htmlFor="f-obs">Observações</Label>
                <Textarea id="f-obs" value={form.observacao} onChange={(e) => set("observacao", e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {editId && (
              <Button variant="ghost" className="text-destructive" disabled={salvando} onClick={() => void excluir()}>
                Excluir
              </Button>
            )}
            <Button disabled={salvando} onClick={() => void salvar()}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
