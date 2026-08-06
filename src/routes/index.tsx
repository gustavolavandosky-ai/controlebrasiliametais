import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Settings2, Search, Upload } from "lucide-react";
import {
  useInventory,
  calcularEstoque,
  type Produto,
} from "@/lib/inventory-store";
import { EntrySheet } from "@/components/EntrySheet";
import { ImportDialog } from "@/components/ImportDialog";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERP Brasilia Metais" },
      { name: "description", content: "Sistema ERP de controle de estoque." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { produtos, lancamentos } = useInventory();
  const [busca, setBusca] = useState("");
  const [filtroLoc, setFiltroLoc] = useState<string>("__all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alvo, setAlvo] = useState<Produto | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const localizacoes = useMemo(() => {
    const s = new Set(produtos.map((p) => p.localizacao).filter(Boolean));
    return Array.from(s).sort();
  }, [produtos]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos
      .filter((p) => (filtroLoc === "__all" ? true : p.localizacao === filtroLoc))
      .filter((p) =>
        q
          ? p.nome.toLowerCase().includes(q) ||
            p.localizacao.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, busca, filtroLoc]);

  const abrirLancamento = (p: Produto) => {
    setAlvo(p);
    setSheetOpen(true);
  };

  const exportar = () => {
    if (produtos.length === 0) {
      toast.error("Nenhum produto para exportar");
      return;
    }
    const rows = produtos.map((p) => ({
      Produto: p.nome,
      Localização: p.localizacao,
      Unidade: p.unidade,
      "Estoque Físico": calcularEstoque(p, lancamentos),
      "Estoque Inicial": p.estoqueInicial,
      Observações: p.observacoes,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventário");
    XLSX.writeFile(wb, `inventario-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Inventário exportado");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Estoque" />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar produto ou localização..."
              className="pl-9"
            />
          </div>

          <Select value={filtroLoc} onValueChange={setFiltroLoc}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por localização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as localizações</SelectItem>
              {localizacoes.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>

          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>

          <Button onClick={() => navigate({ to: "/produtos" })}>
            <Settings2 className="mr-2 h-4 w-4" />
            Gerenciar produtos
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24"></TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque físico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum produto. Clique em "Gerenciar produtos" para cadastrar.
                  </TableCell>
                </TableRow>
              )}
              {lista.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => abrirLancamento(p)}
                      title="Incluir lançamento"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/produto/$id"
                      params={{ id: p.id }}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {p.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.localizacao || "—"}
                  </TableCell>
                  <TableCell>{p.unidade}</TableCell>
                  <TableCell className="text-right font-mono">
                    {calcularEstoque(p, lancamentos)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <EntrySheet produto={alvo} open={sheetOpen} onOpenChange={setSheetOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
