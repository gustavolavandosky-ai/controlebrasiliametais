import { createFileRoute, Link } from "@tanstack/react-router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Upload,
  Download,
} from "lucide-react";
import {
  CORES_EQUIPE,
  agruparDiarias,
  formatarData,
  formatarMoeda,
  useDiarias,
  type Diaria,
} from "@/lib/diarias-store";
import { DiariaSheet } from "@/components/DiariaSheet";
import { DiariasImportDialog } from "@/components/DiariasImportDialog";
import { useAccess } from "@/hooks/use-access";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/diarias/")({
  head: () => ({
    meta: [
      { title: "Controle de Diárias · ERP Brasilia Metais" },
      {
        name: "description",
        content:
          "Controle de diárias por colaborador e equipe: valores, destinos, situação de pagamento e troco.",
      },
      { property: "og:title", content: "Controle de Diárias · ERP Brasilia Metais" },
      {
        property: "og:description",
        content: "Diárias por colaborador e equipe, com totais e filtros por período.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiariasPage,
});

const TODOS = "__all";

function Cartao({ titulo, valor, sub }: { titulo: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{valor}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DiariasPage() {
  const { diarias, colaboradores, destinos, equipes, deleteDiarias, carregando } =
    useDiarias();
  const { somenteLeitura } = useAccess();

  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [fColab, setFColab] = useState(TODOS);
  const [fEquipe, setFEquipe] = useState(TODOS);
  const [fDestino, setFDestino] = useState(TODOS);
  const [fSituacao, setFSituacao] = useState(TODOS);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [alvo, setAlvo] = useState<Diaria[] | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return diarias.filter((d) => {
      if (de && d.data < de) return false;
      if (ate && d.data > ate) return false;
      if (fColab !== TODOS && d.colaborador !== fColab) return false;
      if (fEquipe !== TODOS && (d.equipe || "") !== (fEquipe === "__sem" ? "" : fEquipe))
        return false;
      if (fDestino !== TODOS && d.destino !== fDestino) return false;
      if (fSituacao !== TODOS && d.situacao !== fSituacao) return false;
      if (q) {
        const alvoTexto = [d.colaborador, d.equipe, d.tipo, d.destino, d.observacao]
          .join(" ")
          .toLowerCase();
        if (!alvoTexto.includes(q)) return false;
      }
      return true;
    });
  }, [diarias, busca, de, ate, fColab, fEquipe, fDestino, fSituacao]);

  const grupos = useMemo(() => agruparDiarias(lista), [lista]);

  const total = lista.reduce((s, d) => s + d.valor, 0);
  const pendente = lista
    .filter((d) => d.situacao === "pendente")
    .reduce((s, d) => s + d.valor, 0);
  const pago = total - pendente;

  const porColaborador = useMemo(() => {
    const m = new Map<string, { total: number; qtd: number }>();
    for (const d of lista) {
      const a = m.get(d.colaborador) ?? { total: 0, qtd: 0 };
      m.set(d.colaborador, { total: a.total + d.valor, qtd: a.qtd + 1 });
    }
    return Array.from(m.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [lista]);

  const porDestino = useMemo(() => {
    const m = new Map<string, { total: number; qtd: number }>();
    for (const d of lista) {
      const k = d.destino || "Sem destino";
      const a = m.get(k) ?? { total: 0, qtd: 0 };
      m.set(k, { total: a.total + d.valor, qtd: a.qtd + 1 });
    }
    return Array.from(m.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [lista]);

  const limpar = () => {
    setBusca("");
    setDe("");
    setAte("");
    setFColab(TODOS);
    setFEquipe(TODOS);
    setFDestino(TODOS);
    setFSituacao(TODOS);
  };

  const exportar = () => {
    if (lista.length === 0) {
      toast.error("Nada para exportar");
      return;
    }
    const rows = lista.map((d) => ({
      Data: formatarData(d.data),
      Colaborador: d.colaborador,
      Equipe: d.equipe,
      Tipo: d.tipo,
      Valor: d.valor,
      Destino: d.destino,
      Situação: d.situacao,
      Troco: d.troco ?? "",
      Observação: d.observacao,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Diárias");
    XLSX.writeFile(wb, `diarias-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Diárias exportadas");
  };

  const excluir = async (itens: Diaria[]) => {
    try {
      await deleteDiarias(itens.map((i) => i.id));
      toast.success("Lançamento excluído");
    } catch (err) {
      toast.error("Erro ao excluir: " + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Diárias" />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Cartao
            titulo="Total do período"
            valor={formatarMoeda(total)}
            sub={`${lista.length} diárias`}
          />
          <Cartao titulo="Pago" valor={formatarMoeda(pago)} />
          <Cartao titulo="Pendente" valor={formatarMoeda(pendente)} />
          <Cartao
            titulo="Colaboradores"
            valor={String(porColaborador.length)}
            sub="no filtro atual"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por colaborador, tipo, destino ou observação..."
              className="pl-9"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="diarias-de" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="diarias-de"
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="diarias-ate" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="diarias-ate"
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="w-40"
            />
          </div>

          <Select value={fColab} onValueChange={setFColab}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Colaborador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos colaboradores</SelectItem>
              {colaboradores.map((c) => (
                <SelectItem key={c.id} value={c.nome}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fEquipe} onValueChange={setFEquipe}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as equipes</SelectItem>
              {equipes.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
              <SelectItem value="__sem">Sem equipe</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fDestino} onValueChange={setFDestino}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os destinos</SelectItem>
              {destinos.map((d) => (
                <SelectItem key={d.id} value={d.nome}>
                  {d.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fSituacao} onValueChange={setFSituacao}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" onClick={limpar}>
            Limpar
          </Button>

          <Button variant="outline" onClick={exportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>

          {!somenteLeitura && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <Button asChild variant="outline">
                <Link to="/diarias/cadastros">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Cadastros
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setAlvo(null);
                  setSheetOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova diária
              </Button>
            </>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1"></TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Troco</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grupos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                    {carregando ? "Carregando..." : "Nenhuma diária encontrada."}
                  </TableCell>
                </TableRow>
              )}
              {grupos.map((g) => {
                const d = g.itens[0];
                if (!d) return null;
                const totalGrupo = g.itens.reduce((s, i) => s + i.valor, 0);
                const trocoGrupo = g.itens.reduce(
                  (s, i) => (i.troco === null ? s : s + i.troco),
                  0,
                );
                const temTroco = g.itens.some((i) => i.troco !== null);
                return (
                <TableRow
                  key={g.chave}
                  className={somenteLeitura ? "" : "cursor-pointer"}
                  onClick={() => {
                    if (somenteLeitura) return;
                    setAlvo(g.itens);
                    setSheetOpen(true);
                  }}
                >
                  <TableCell className="p-0">
                    <div
                      className="h-10 w-1.5 rounded-r"
                      style={{
                        backgroundColor: CORES_EQUIPE[d.equipe] ?? "transparent",
                      }}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatarData(d.data)}</TableCell>
                  <TableCell className="font-medium">
                    {g.itens.map((i) => (
                      <div key={i.id}>{i.colaborador}</div>
                    ))}
                    {g.itens.length > 1 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {g.itens.length} pessoas · {formatarMoeda(d.valor)} cada
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.equipe || "—"}</TableCell>
                  <TableCell>{d.tipo || "—"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatarMoeda(totalGrupo)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.destino || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={
                        d.situacao === "pago"
                          ? "rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                          : "rounded-full border border-destructive px-2 py-0.5 text-xs text-destructive"
                      }
                    >
                      {d.situacao === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {temTroco ? formatarMoeda(trocoGrupo) : "—"}
                  </TableCell>
                  <TableCell className="max-w-48 whitespace-pre-wrap text-muted-foreground">
                    {d.observacao || "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {!somenteLeitura && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label="Ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setAlvo(g.itens);
                              setSheetOpen(true);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void excluir(g.itens)}>
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

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card">
            <h2 className="border-b px-4 py-3 text-sm font-semibold">Total por colaborador</h2>
            <Table>
              <TableBody>
                {porColaborador.map(([nome, v]) => (
                  <TableRow key={nome}>
                    <TableCell className="font-medium">{nome}</TableCell>
                    <TableCell className="text-muted-foreground">{v.qtd} diárias</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarMoeda(v.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="rounded-lg border bg-card">
            <h2 className="border-b px-4 py-3 text-sm font-semibold">
              Total por destino / cliente
            </h2>
            <Table>
              <TableBody>
                {porDestino.map(([nome, v]) => (
                  <TableRow key={nome}>
                    <TableCell className="font-medium">{nome}</TableCell>
                    <TableCell className="text-muted-foreground">{v.qtd} diárias</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarMoeda(v.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <DiariaSheet grupo={alvo} open={sheetOpen} onOpenChange={setSheetOpen} />
      <DiariasImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}