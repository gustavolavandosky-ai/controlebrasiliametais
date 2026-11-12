import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { formatarData, formatarMoeda, useDiarias, type Diaria } from "@/lib/diarias-store";
import { fmtTempo, useViagens } from "@/lib/viagens-store";
import { useAbastecimento } from "@/lib/abastecimento-store";

export const Route = createFileRoute("/_authenticated/viagens")({
  head: () => ({
    meta: [
      { title: "Viagens por Cliente · Brasília Metais" },
      { name: "description", content: "Diárias e trajetos sincronizados por cliente: quem viajou, quando e por onde." },
      { property: "og:title", content: "Viagens por Cliente · Brasília Metais" },
      { property: "og:description", content: "Resumo de viagens por cliente com diárias e trajetos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ViagensClientesPage,
});

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/\s+/g, " ");
type Traj = ReturnType<typeof useViagens>["viagens"][number];
interface Grupo { chave: string; nome: string; diarias: Diaria[]; trajetos: Traj[]; ultima: string }

function ViagensClientesPage() {
  const { diarias, carregando } = useDiarias();
  const { viagens, clientes } = useViagens();
  const { veiculos } = useAbastecimento();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const nomeVeic = useMemo(() => new Map(veiculos.map((v) => [v.id, `${v.placa} ${v.modelo}`.trim()])), [veiculos]);

  const grupos = useMemo(() => {
    const m = new Map<string, Grupo>();
    const get = (nome: string) => {
      const k = norm(nome);
      let g = m.get(k);
      if (!g) { g = { chave: k, nome: nome.trim(), diarias: [], trajetos: [], ultima: "" }; m.set(k, g); }
      return g;
    };
    for (const d of diarias) if (d.destino.trim()) { const g = get(d.destino); g.diarias.push(d); if (d.data > g.ultima) g.ultima = d.data; }
    const nomeCli = new Map(clientes.map((c) => [c.id, c.nome]));
    for (const t of viagens) {
      const nome = t.clienteId ? nomeCli.get(t.clienteId) : undefined;
      if (!nome) continue;
      const g = get(nome); g.trajetos.push(t); if (t.data > g.ultima) g.ultima = t.data;
    }
    const b = norm(busca);
    return [...m.values()].filter((g) => !b || g.chave.includes(b)).sort((a, b2) => b2.ultima.localeCompare(a.ultima));
  }, [diarias, viagens, clientes, busca]);

  const g = grupos.find((x) => x.chave === aberto) ?? null;
  const datas = g ? [...new Set([...g.diarias.map((d) => d.data), ...g.trajetos.map((t) => t.data)])].sort().reverse() : [];

  return (
    <div className="min-h-screen">
      <AppHeader title="Viagens" />
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">Junta automaticamente as diárias (pelo destino/cliente) e os trajetos (pelo cliente selecionado). Clique no cliente para ver os detalhes.</p>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar cliente" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Cliente</TableHead><TableHead>Última viagem</TableHead><TableHead className="text-right">Diárias</TableHead>
              <TableHead className="text-right">Valor diárias</TableHead><TableHead className="text-right">Trajetos</TableHead><TableHead>Quem viajou</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {grupos.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{carregando ? "Carregando..." : "Nenhuma viagem encontrada."}</TableCell></TableRow>}
              {grupos.map((x) => (
                <TableRow key={x.chave} className="cursor-pointer" onClick={() => setAberto(x.chave)}>
                  <TableCell className="font-medium">{x.nome}</TableCell>
                  <TableCell>{x.ultima ? formatarData(x.ultima) : "—"}</TableCell>
                  <TableCell className="text-right">{x.diarias.length}</TableCell>
                  <TableCell className="text-right font-mono">{formatarMoeda(x.diarias.reduce((s, d) => s + d.valor, 0))}</TableCell>
                  <TableCell className="text-right">{x.trajetos.length}</TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">{[...new Set(x.diarias.map((d) => d.colaborador))].join(", ") || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={!!g} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{g?.nome}</DialogTitle></DialogHeader>
          {g && <p className="text-sm text-muted-foreground">{g.diarias.length} diárias · {formatarMoeda(g.diarias.reduce((s, d) => s + d.valor, 0))} · {g.trajetos.length} trajetos</p>}
          {g && datas.map((dt) => {
            const ds = g.diarias.filter((d) => d.data === dt);
            const ts = g.trajetos.filter((t) => t.data === dt);
            return (
              <div key={dt} className="rounded-lg border p-3">
                <p className="font-semibold">{formatarData(dt)}</p>
                {ds.length > 0 && <div className="mt-2 text-sm"><p className="text-xs uppercase text-muted-foreground">Quem viajou ({ds.length} diária{ds.length > 1 ? "s" : ""})</p>
                  {ds.map((d) => <div key={d.id} className="flex justify-between"><span>{d.colaborador}{d.equipe ? ` · ${d.equipe}` : ""}{d.tipo ? ` · ${d.tipo}` : ""}</span><span className="font-mono">{formatarMoeda(d.valor)}</span></div>)}</div>}
                {ts.length > 0 && <div className="mt-2 text-sm"><p className="text-xs uppercase text-muted-foreground">Trajeto</p>
                  {ts.map((t) => <div key={t.id}><p>{t.origem} → {t.destino}</p><p className="text-muted-foreground">{nomeVeic.get(t.veiculoId ?? "") || "Sem caminhão"} · {t.motorista || "Sem motorista"}{t.distanciaKm != null ? ` · ${t.distanciaKm} km` : ""}{t.tempoRealMin != null ? ` · real ${fmtTempo(t.tempoRealMin)}` : t.tempoEstimadoMin != null ? ` · est. ${fmtTempo(t.tempoEstimadoMin)}` : ""}</p></div>)}</div>}
              </div>
            );
          })}
        </DialogContent>
      </Dialog>
    </div>
  );
}
