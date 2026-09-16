import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreVertical, Pencil, Plus, Trash2, Calculator, Search, X } from "lucide-react";
import {
  useInventory,
  calcularEstoque,
  calcularSaldoAteLancamento,
  compararCronologico,
  type Lancamento,
} from "@/lib/inventory-store";
import { EntrySheet } from "@/components/EntrySheet";
import { useAccess } from "@/hooks/use-access";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/produto/$id")({
  head: () => ({ meta: [{ title: "Produto · ERP Estoque" }, { name: "description", content: "Histórico de entradas, saídas e balanços do produto." }, { property: "og:title", content: "Produto · ERP Estoque" }, { property: "og:description", content: "Histórico de entradas, saídas e balanços do produto." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProdutoDetalhe,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">
      Produto não encontrado.
    </div>
  ),
});

const POR_PAGINA = 50;

function ProdutoDetalhe() {
  const { id } = Route.useParams();
  const { produtos, lancamentos, deleteLancamento } = useInventory();
  const { somenteLeitura } = useAccess();
  const produto = produtos.find((p) => p.id === id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editL, setEditL] = useState<Lancamento | null>(null);
  const [confirm, setConfirm] = useState<Lancamento | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [saldoLancamento, setSaldoLancamento] = useState<Lancamento | null>(null);
  const [busca, setBusca] = useState("");
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");
  const [pagina, setPagina] = useState(1);

  const todos = useMemo(
    () =>
      lancamentos
        .filter((l) => l.produtoId === id)
        .sort((a, b) => compararCronologico(b, a)),
    [lancamentos, id],
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todos.filter((l) => {
      if (termo && !(l.observacao || "").toLowerCase().includes(termo)) return false;
      if (dataDe && l.data < dataDe) return false;
      if (dataAte && l.data > dataAte) return false;
      return true;
    });
  }, [todos, busca, dataDe, dataAte]);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));

  useEffect(() => {
    setPagina(1);
  }, [busca, dataDe, dataAte, id]);

  useEffect(() => {
    setPagina((p) => Math.min(p, totalPaginas));
  }, [totalPaginas]);

  const inicio = (Math.min(pagina, totalPaginas) - 1) * POR_PAGINA;
  const paginada = useMemo(
    () => lista.slice(inicio, inicio + POR_PAGINA),
    [lista, inicio],
  );

  const paginasVisiveis = useMemo(() => {
    const out: number[] = [];
    const atual = Math.min(pagina, totalPaginas);
    let ini = Math.max(1, atual - 2);
    const fim = Math.min(totalPaginas, ini + 4);
    ini = Math.max(1, fim - 4);
    for (let i = ini; i <= fim; i++) out.push(i);
    return out;
  }, [pagina, totalPaginas]);

  const temFiltro = !!(busca.trim() || dataDe || dataAte);
  const limparFiltros = () => {
    setBusca("");
    setDataDe("");
    setDataAte("");
  };


  if (!produto) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Produto" />
        <main className="mx-auto max-w-7xl p-10 text-center text-muted-foreground">
          Produto não encontrado. <Link to="/estoque" className="underline">Voltar</Link>
        </main>
      </div>
    );
  }

  const abrirNovo = () => {
    setEditL(null);
    setSheetOpen(true);
  };
  const abrirEdit = (l: Lancamento) => {
    setEditL(l);
    setSheetOpen(true);
  };

  const saldoCalculado = saldoLancamento
    ? calcularSaldoAteLancamento(produto, lancamentos, saldoLancamento.id)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={produto.nome} />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link to="/estoque">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          {!somenteLeitura && (
            <Button onClick={abrirNovo}>
              <Plus className="mr-2 h-4 w-4" />
              Incluir lançamento
            </Button>
          )}
        </div>

        <div className="mb-6 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4">
          <Info label="Localização" value={produto.localizacao || "—"} />
          <Info label="Unidade" value={produto.unidade} />
          <Info label="Estoque inicial" value={String(produto.estoqueInicial)} />
          <Info
            label="Estoque físico"
            value={String(calcularEstoque(produto, lancamentos))}
          />
          {produto.observacoes && (
            <div className="sm:col-span-4">
              <div className="text-xs text-muted-foreground">Observações</div>
              <div className="text-sm">{produto.observacoes}</div>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-end gap-3 border-b p-4">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="busca-obs" className="text-xs text-muted-foreground">
                Buscar na observação
              </Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="busca-obs"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Ex.: nota fiscal, cliente..."
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="data-de" className="text-xs text-muted-foreground">
                De
              </Label>
              <Input
                id="data-de"
                type="date"
                value={dataDe}
                onChange={(e) => setDataDe(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="data-ate" className="text-xs text-muted-foreground">
                Até
              </Label>
              <Input
                id="data-ate"
                type="date"
                value={dataAte}
                onChange={(e) => setDataAte(e.target.value)}
                className="mt-1"
              />
            </div>
            {temFiltro && (
              <Button variant="ghost" onClick={limparFiltros}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
            <div className="ml-auto text-sm text-muted-foreground">
              {lista.length} de {todos.length} lançamentos
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {temFiltro
                      ? "Nenhum lançamento encontrado com esses filtros."
                      : "Nenhum lançamento ainda."}
                  </TableCell>
                </TableRow>
              )}
              {paginada.map((l) => (
                <TableRow
                  key={l.id}
                  className={somenteLeitura ? "" : "cursor-pointer hover:bg-muted/50"}
                  onClick={() => {
                    if (!somenteLeitura) abrirEdit(l);
                  }}
                >
                  <TableCell>{formatarData(l.data)}</TableCell>
                  <TableCell>{l.hora}</TableCell>
                  <TableCell>
                    <TipoBadge tipo={l.tipo} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {l.quantidade}
                  </TableCell>
                  <TableCell>{l.unidade}</TableCell>
                  <TableCell className="max-w-xs whitespace-pre-wrap text-muted-foreground">
                    {l.observacao || "—"}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Ações do lançamento"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!somenteLeitura && (
                          <DropdownMenuItem onClick={() => abrirEdit(l)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setSaldoLancamento(l)}>
                          <Calculator className="mr-2 h-4 w-4" />
                          Calcular saldo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRelatorio(l)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Gerar relatório
                        </DropdownMenuItem>
                        {!somenteLeitura && (
                          <DropdownMenuItem
                            onClick={() => setConfirm(l)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {lista.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {inicio + 1}–{inicio + paginada.length} de {lista.length}
              </div>
              {totalPaginas > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagina <= 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  {paginasVisiveis.map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === Math.min(pagina, totalPaginas) ? "default" : "ghost"}
                      onClick={() => setPagina(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagina >= totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <EntrySheet
        produto={produto}
        lancamento={editL}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && !excluindo && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindo}
              onClick={async (event) => {
                event.preventDefault();
                if (!confirm || excluindo) return;
                setExcluindo(true);
                try {
                  await deleteLancamento(confirm.id);
                  toast.success("Lançamento excluído");
                  setConfirm(null);
                } catch (err) {
                  toast.error("Erro ao excluir: " + (err as Error).message);
                } finally {
                  setExcluindo(false);
                }
              }}
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!saldoLancamento} onOpenChange={(v) => !v && setSaldoLancamento(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes do lançamento</DialogTitle>
            <DialogDescription className="sr-only">
              Saldo anterior e saldo final do lançamento selecionado
            </DialogDescription>
          </DialogHeader>
          {saldoLancamento && saldoCalculado && (
            <div className="overflow-x-auto py-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Saldo anterior</TableHead>
                    <TableHead className="text-right">
                      {saldoLancamento.tipo === "entrada"
                        ? "Entrada"
                        : saldoLancamento.tipo === "saida"
                          ? "Saída"
                          : "Balanço"}
                    </TableHead>
                    <TableHead className="text-right">Saldo final</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="whitespace-nowrap">
                      {formatarData(saldoLancamento.data)} {saldoLancamento.hora}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarNumero(saldoCalculado.antes)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarNumero(saldoLancamento.quantidade)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatarNumero(saldoCalculado.depois)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Lançamento manual
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
          <div className="pt-2">
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => setSaldoLancamento(null)}
            >
              fechar <span className="ml-2 text-xs text-muted-foreground">ESC</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: Lancamento["tipo"] }) {
  const map = {
    entrada: { label: "Entrada", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
    saida: { label: "Saída", cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
    balanco: { label: "Balanço", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  }[tipo];
  return <Badge variant="secondary" className={map.cls}>{map.label}</Badge>;
}

function formatarData(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatarNumero(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
