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
import { Plus, Search, Settings2 } from "lucide-react";
import { useEpi, calcularEstoqueEpi, type Equipamento } from "@/lib/epi-store";
import { EpiEntrySheet } from "@/components/EpiEntrySheet";
import { useAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/_authenticated/epi/")({
  head: () => ({
    meta: [
      { title: "Controle de EPI · ERP Brasília Metais" },
      {
        name: "description",
        content: "Controle de equipamentos de proteção individual: estoque físico, entradas e retiradas.",
      },
      { property: "og:title", content: "Controle de EPI · ERP Brasília Metais" },
      {
        property: "og:description",
        content: "Controle de equipamentos de proteção individual: estoque físico, entradas e retiradas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EpiIndex,
});

function EpiIndex() {
  const navigate = useNavigate();
  const { equipamentos, lancamentos } = useEpi();
  const { somenteLeitura } = useAccess();
  const [busca, setBusca] = useState("");
  const [filtroLoc, setFiltroLoc] = useState("__all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alvo, setAlvo] = useState<Equipamento | null>(null);

  const localizacoes = useMemo(
    () => Array.from(new Set(equipamentos.map((e) => e.localizacao).filter(Boolean))).sort(),
    [equipamentos],
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return equipamentos
      .filter((e) => (filtroLoc === "__all" ? true : e.localizacao === filtroLoc))
      .filter((e) =>
        q
          ? e.nome.toLowerCase().includes(q) || e.localizacao.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [equipamentos, busca, filtroLoc]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Controle de EPI" />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar equipamento ou local..."
              className="pl-9"
            />
          </div>

          <Select value={filtroLoc} onValueChange={setFiltroLoc}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por local" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os locais</SelectItem>
              {localizacoes.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!somenteLeitura && (
            <Button onClick={() => navigate({ to: "/epi/equipamentos" })}>
              <Settings2 className="mr-2 h-4 w-4" />
              Gerenciar equipamentos
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24"></TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Onde está</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque físico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum equipamento cadastrado. Clique em "Gerenciar equipamentos".
                  </TableCell>
                </TableRow>
              )}
              {lista.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {!somenteLeitura && (
                      <Button
                        size="sm"
                        variant="secondary"
                        title="Incluir lançamento"
                        onClick={() => {
                          setAlvo(e);
                          setSheetOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/epi/item/$id"
                      params={{ id: e.id }}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {e.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.localizacao || "—"}
                  </TableCell>
                  <TableCell>{e.unidade}</TableCell>
                  <TableCell className="text-right font-mono">
                    {calcularEstoqueEpi(e, lancamentos)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <EpiEntrySheet equipamento={alvo} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
