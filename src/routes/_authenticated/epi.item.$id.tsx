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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useEpi,
  calcularEstoqueEpi,
  calcularSaldoAteLancamentoEpi,
  compararCronologicoEpi,
  type EpiLancamento,
} from "@/lib/epi-store";
import { EpiEntrySheet } from "@/components/EpiEntrySheet";
import { useAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/_authenticated/epi/item/$id")({
  head: () => ({
    meta: [
      { title: "Histórico do EPI · ERP Brasília Metais" },
      { name: "description", content: "Histórico de entradas, saídas e balanços do equipamento." },
      { property: "og:title", content: "Histórico do EPI · ERP Brasília Metais" },
      { property: "og:description", content: "Histórico de entradas, saídas e balanços do equipamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EpiItem,
});

const POR_PAGINA = 50;
const TIPO_LABEL = { entrada: "Entrada", saida: "Saída", balanco: "Balanço" } as const;

function fmtData(d: string) {
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

function EpiItem() {
  const { id } = Route.useParams();
  const { equipamentos, lancamentos, carregando, deleteLancamento } = useEpi();
  const { somenteLeitura } = useAccess();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editando, setEditando] = useState<EpiLancamento | null>(null);
  const [excluir, setExcluir] = useState<EpiLancamento | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [pagina, setPagina] = useState(1);

  const eq = equipamentos.find((e) => e.id === id) ?? null;
  const lista = useMemo(
    () =>
      lancamentos
        .filter((l) => l.equipamentoId === id)
        .sort((a, b) => compararCronologicoEpi(b, a)),
    [lancamentos, id],
  );
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pag = Math.min(pagina, totalPaginas);
  const visiveis = lista.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  if (!eq) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Controle de EPI" />
        <main className="mx-auto max-w-7xl px-6 py-10 text-muted-foreground">
          {carregando ? "Carregando..." : "Equipamento não encontrado."}{" "}
          <Link to="/epi" className="underline">Voltar</Link>
        </main>
      </div>
    );
  }

  const confirmarExcluir = async () => {
    if (!excluir || excluindo) return;
    setExcluindo(true);
    try {
      await deleteLancamento(excluir.id);
      toast.success("Lançamento excluído");
      setExcluir(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Controle de EPI" />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/epi" className="mb-1 inline-flex items-center text-sm text-muted-foreground hover:underline">
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Link>
            <h1 className="text-2xl font-semibold">{eq.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Onde está: {eq.localizacao || "—"} · Estoque inicial: {eq.estoqueInicial} {eq.unidade}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg border bg-card px-4 py-2 text-right">
              <div className="text-xs text-muted-foreground">Estoque físico</div>
              <div className="font-mono text-2xl font-semibold">
                {calcularEstoqueEpi(eq, lancamentos)} {eq.unidade}
              </div>
            </div>
            {!somenteLeitura && (
              <Button onClick={() => { setEditando(null); setSheetOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo lançamento
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Quem retirou</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhum lançamento ainda.
                  </TableCell>
                </TableRow>
              )}
              {visiveis.map((l) => {
                const s = calcularSaldoAteLancamentoEpi(eq, lancamentos, l.id);
                return (
                  <TableRow
                    key={l.id}
                    className={somenteLeitura ? "" : "cursor-pointer"}
                    onClick={() => {
                      if (somenteLeitura) return;
                      setEditando(l);
                      setSheetOpen(true);
                    }}
                  >
                    <TableCell>{fmtData(l.data)} {l.hora}</TableCell>
                    <TableCell>{TIPO_LABEL[l.tipo]}</TableCell>
                    <TableCell className="text-right font-mono">
                      {l.tipo === "saida" ? "-" : l.tipo === "entrada" ? "+" : ""}
                      {l.quantidade} {l.unidade}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {s.antes} → {s.depois}
                    </TableCell>
                    <TableCell>{l.retiradoPor || "—"}</TableCell>
                    <TableCell>{l.motivo || "—"}</TableCell>
                    <TableCell className="max-w-48 truncate">{l.observacao || "—"}</TableCell>
                    <TableCell>
                      {!somenteLeitura && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          onClick={(e) => { e.stopPropagation(); setExcluir(l); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {totalPaginas > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {(pag - 1) * POR_PAGINA + 1}–{Math.min(pag * POR_PAGINA, lista.length)} de {lista.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pag <= 1} onClick={() => setPagina(pag - 1)}>Anterior</Button>
              <span className="px-2 py-1">{pag} / {totalPaginas}</span>
              <Button variant="outline" size="sm" disabled={pag >= totalPaginas} onClick={() => setPagina(pag + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </main>

      <EpiEntrySheet equipamento={eq} lancamento={editando} open={sheetOpen} onOpenChange={setSheetOpen} />

      <AlertDialog open={!!excluir} onOpenChange={(v) => !v && !excluindo && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindo}
              onClick={(e) => { e.preventDefault(); void confirmarExcluir(); }}
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
