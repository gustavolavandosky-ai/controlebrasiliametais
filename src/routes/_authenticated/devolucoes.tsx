import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { DevolucaoSheet } from "@/components/DevolucaoSheet";
import { useAccess } from "@/hooks/use-access";
import {
  calcularDiferenca,
  formatarData,
  formatarNumero,
  percentualDiferenca,
  useDevolucoes,
  type Devolucao,
} from "@/lib/devolucoes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/devolucoes")({
  head: () => ({
    meta: [
      { title: "Devoluções de Material · ERP Brasilia Metais" },
      {
        name: "description",
        content:
          "Registro de devoluções: material enviado à empresa, quantidade retornada e diferença calculada automaticamente.",
      },
      { property: "og:title", content: "Devoluções de Material · ERP Brasilia Metais" },
      {
        property: "og:description",
        content:
          "Controle do material enviado e retornado por empresa, com diferença e percentual de perda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevolucoesPage,
});

const POR_PAGINA = 50;

function Cartao({ titulo, valor, cor }: { titulo: string; valor: string; cor?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  );
}

function corDiferenca(v: number) {
  if (v === 0) return "var(--muted-foreground)";
  return v > 0 ? "var(--positivo)" : "var(--negativo)";
}

function DevolucoesPage() {
  const { devolucoes, deleteDevolucao, carregando } = useDevolucoes();
  const { somenteLeitura } = useAccess();

  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [pagina, setPagina] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [alvo, setAlvo] = useState<Devolucao | null>(null);
  const [excluir, setExcluir] = useState<Devolucao | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return devolucoes.filter((d) => {
      if (de && d.data < de) return false;
      if (ate && d.data > ate) return false;
      if (q) {
        const texto = [d.empresa, d.material, d.observacao].join(" ").toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [devolucoes, busca, de, ate]);

  const totalEnviado = lista.reduce((s, d) => s + d.enviada, 0);
  const totalRetornado = lista.reduce((s, d) => s + d.retornada, 0);
  const totalDiferenca = totalRetornado - totalEnviado;

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = lista.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const confirmarExclusao = async () => {
    if (!excluir) return;
    setExcluindo(true);
    try {
      await deleteDevolucao(excluir.id);
      toast.success("Devolução excluída");
      setExcluir(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Devoluções" />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Devoluções</h1>
            <p className="text-sm text-muted-foreground">
              Material enviado às empresas e o quanto retornou.
            </p>
          </div>
          {!somenteLeitura && (
            <Button
              onClick={() => {
                setAlvo(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova devolução
            </Button>
          )}
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Cartao titulo="Total enviado" valor={formatarNumero(totalEnviado)} />
          <Cartao titulo="Total retornado" valor={formatarNumero(totalRetornado)} />
          <Cartao
            titulo="Diferença"
            valor={`${totalDiferenca > 0 ? "+" : ""}${formatarNumero(totalDiferenca)}`}
            cor={corDiferenca(totalDiferenca)}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="grid min-w-[220px] flex-1 gap-1">
            <Label htmlFor="dev-busca">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="dev-busca"
                className="pl-8"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                placeholder="Empresa, material ou observação"
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="dev-de">De</Label>
            <Input
              id="dev-de"
              type="date"
              value={de}
              onChange={(e) => {
                setDe(e.target.value);
                setPagina(1);
              }}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="dev-ate">Até</Label>
            <Input
              id="dev-ate"
              type="date"
              value={ate}
              onChange={(e) => {
                setAte(e.target.value);
                setPagina(1);
              }}
            />
          </div>
          {(busca || de || ate) && (
            <Button
              variant="ghost"
              onClick={() => {
                setBusca("");
                setDe("");
                setAte("");
                setPagina(1);
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Enviado</TableHead>
                <TableHead className="text-right">Retornado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!carregando && visiveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhuma devolução registrada.
                  </TableCell>
                </TableRow>
              )}
              {visiveis.map((d) => {
                const dif = calcularDiferenca(d);
                const pct = percentualDiferenca(d);
                return (
                  <TableRow
                    key={d.id}
                    className={somenteLeitura ? undefined : "cursor-pointer"}
                    onClick={() => {
                      if (somenteLeitura) return;
                      setAlvo(d);
                      setSheetOpen(true);
                    }}
                  >
                    <TableCell>{formatarData(d.data)}</TableCell>
                    <TableCell className="font-medium">{d.empresa}</TableCell>
                    <TableCell>{d.material}</TableCell>
                    <TableCell className="text-right">
                      {formatarNumero(d.enviada)} {d.unidade}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatarNumero(d.retornada)} {d.unidade}
                    </TableCell>
                    <TableCell
                      className="text-right font-semibold"
                      style={{ color: corDiferenca(dif) }}
                    >
                      {dif > 0 ? "+" : ""}
                      {formatarNumero(dif)} {d.unidade}
                      <span className="ml-1 text-xs font-normal">
                        ({pct > 0 ? "+" : ""}
                        {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {d.observacao}
                    </TableCell>
                    <TableCell>
                      {!somenteLeitura && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setAlvo(d);
                                setSheetOpen(true);
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExcluir(d);
                              }}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {lista.length > POR_PAGINA && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {paginaAtual} de {totalPaginas} · {lista.length} registros
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={paginaAtual <= 1}
                onClick={() => setPagina(paginaAtual - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => setPagina(paginaAtual + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </main>

      <DevolucaoSheet devolucao={alvo} open={sheetOpen} onOpenChange={setSheetOpen} />

      <AlertDialog
        open={excluir !== null}
        onOpenChange={(v) => {
          if (excluindo) return;
          if (!v) setExcluir(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir devolução?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindo}
              onClick={(e) => {
                e.preventDefault();
                void confirmarExclusao();
              }}
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
