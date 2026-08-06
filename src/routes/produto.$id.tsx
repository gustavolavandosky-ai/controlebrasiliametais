import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { ArrowLeft, MoreVertical, Pencil, Plus, Trash2, Calculator } from "lucide-react";
import {
  useInventory,
  calcularEstoque,
  calcularSaldoAteLancamento,
  type Lancamento,
} from "@/lib/inventory-store";
import { EntrySheet } from "@/components/EntrySheet";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({ meta: [{ title: "Produto · ERP" }] }),
  component: ProdutoDetalhe,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">
      Produto não encontrado.
    </div>
  ),
});

function ProdutoDetalhe() {
  const { id } = Route.useParams();
  const { produtos, lancamentos, deleteLancamento } = useInventory();
  const produto = produtos.find((p) => p.id === id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editL, setEditL] = useState<Lancamento | null>(null);
  const [confirm, setConfirm] = useState<Lancamento | null>(null);
  const [saldoLancamento, setSaldoLancamento] = useState<Lancamento | null>(null);

  const lista = useMemo(
    () =>
      lancamentos
        .filter((l) => l.produtoId === id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [lancamentos, id],
  );

  if (!produto) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Produto" />
        <main className="mx-auto max-w-7xl p-10 text-center text-muted-foreground">
          Produto não encontrado. <Link to="/" className="underline">Voltar</Link>
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
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Incluir lançamento
          </Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum lançamento ainda.
                  </TableCell>
                </TableRow>
              )}
              {lista.map((l) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => abrirEdit(l)}
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
                        <DropdownMenuItem onClick={() => abrirEdit(l)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSaldoLancamento(l)}>
                          <Calculator className="mr-2 h-4 w-4" />
                          Calcular saldo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setConfirm(l)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <EntrySheet
        produto={produto}
        lancamento={editL}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) {
                  deleteLancamento(confirm.id);
                  toast.success("Lançamento excluído");
                }
                setConfirm(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!saldoLancamento} onOpenChange={(v) => !v && setSaldoLancamento(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Saldo após lançamento</DialogTitle>
            <DialogDescription>
              {saldoLancamento && (
                <>
                  {formatarData(saldoLancamento.data)} às {saldoLancamento.hora}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {saldoLancamento && saldoCalculado && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Tipo</div>
                  <div className="text-sm font-medium">
                    <TipoBadge tipo={saldoLancamento.tipo} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Quantidade</div>
                  <div className="text-sm font-mono font-medium">
                    {saldoLancamento.quantidade} {saldoLancamento.unidade}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <div className="text-xs text-muted-foreground">Antes</div>
                  <div className="text-2xl font-semibold">
                    {saldoCalculado.antes}
                  </div>
                </div>
                <div className="rounded-lg border bg-primary/10 p-4 text-center">
                  <div className="text-xs text-muted-foreground">Depois</div>
                  <div className="text-2xl font-semibold text-primary">
                    {saldoCalculado.depois}
                  </div>
                </div>
              </div>
            </div>
          )}
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
