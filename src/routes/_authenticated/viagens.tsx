import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fuel, History, List, MapPin, Package, Search, Users } from "lucide-react";
import { formatarData, formatarMoeda, useDiarias, type Diaria } from "@/lib/diarias-store";
import { calcularCombustivel, distanciaTotalKm, fmtTempo, tempoEstimadoTotalMin, tempoRealTotalMin, useViagens } from "@/lib/viagens-store";
import { calcularMediaPorVeiculo, useAbastecimento } from "@/lib/abastecimento-store";
import { useBags } from "@/lib/bags-store";
import { bagsDaViagem, diariasDaViagem, normalizarCliente } from "@/lib/viagens-resumo";

export const Route = createFileRoute("/_authenticated/viagens")({
  head: () => ({
    meta: [
      { title: "Viagens · Brasília Metais" },
      { name: "description", content: "Viagens por cliente com endereço, caminhão, consumo, diárias e bags." },
      { property: "og:title", content: "Viagens · Brasília Metais" },
      { property: "og:description", content: "Consulte uma viagem ou todo o histórico do cliente com diárias, trajetos e bags." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ViagensClientesPage,
});

type Traj = ReturnType<typeof useViagens>["viagens"][number];
interface Grupo { chave: string; nome: string; diarias: Diaria[]; trajetos: Traj[]; ultima: string }

function ViagensClientesPage() {
  const { diarias, carregando } = useDiarias();
  const { viagens, clientes } = useViagens();
  const { veiculos, abastecimentos } = useAbastecimento();
  const { movimentos: bags } = useBags();
  const [modo, setModo] = useState<"viagens" | "clientes">("viagens");
  const [busca, setBusca] = useState("");
  const [viagemAberta, setViagemAberta] = useState<string | null>(null);
  const [clienteAberto, setClienteAberto] = useState<string | null>(null);
  const nomeVeic = useMemo(() => new Map(veiculos.map((v) => [v.id, `${v.placa} ${v.modelo}`.trim()])), [veiculos]);
  const nomeClientes = useMemo(() => new Map(clientes.map((c) => [c.id, c.nome])), [clientes]);
  const medias = useMemo(() => calcularMediaPorVeiculo(abastecimentos), [abastecimentos]);
  const nomeViagem = (t: Traj) => (t.clienteId ? nomeClientes.get(t.clienteId) : undefined) ?? "Cliente não identificado";

  const listaViagens = useMemo(() => {
    const b = normalizarCliente(busca);
    return viagens.filter((t) => !b || normalizarCliente(`${nomeViagem(t)} ${t.destino}`).includes(b));
  }, [viagens, clientes, busca]);

  const grupos = useMemo(() => {
    const m = new Map<string, Grupo>();
    const get = (nome: string) => {
      const k = normalizarCliente(nome);
      let g = m.get(k);
      if (!g) { g = { chave: k, nome: nome.trim(), diarias: [], trajetos: [], ultima: "" }; m.set(k, g); }
      return g;
    };
    for (const d of diarias) if (d.destino.trim()) {
      const g = get(d.destino); g.diarias.push(d); if (d.data > g.ultima) g.ultima = d.data;
    }
    for (const t of viagens) {
      if (!t.clienteId || !nomeClientes.has(t.clienteId)) continue;
      const g = get(nomeViagem(t)); g.trajetos.push(t); if (t.data > g.ultima) g.ultima = t.data;
    }
    const b = normalizarCliente(busca);
    return [...m.values()].filter((g) => !b || g.chave.includes(b)).sort((a, b2) => b2.ultima.localeCompare(a.ultima));
  }, [diarias, viagens, clientes, busca]);

  const t = viagens.find((x) => x.id === viagemAberta) ?? null;
  const g = grupos.find((x) => x.chave === clienteAberto) ?? null;
  const nomeT = t ? nomeViagem(t) : "";
  const diariasT = t ? diariasDaViagem(diarias, t.data, nomeT, t.veiculoId) : [];
  const bagsT = t ? bagsDaViagem(bags, t.data, nomeT) : { quantidade: 0, retornada: 0 };
  const datas = g ? [...new Set([...g.diarias.map((d) => d.data), ...g.trajetos.map((t2) => t2.data)])].sort().reverse() : [];

  return (
    <div className="min-h-screen">
      <AppHeader title="Viagens" />
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{modo === "viagens" ? "Últimas viagens" : "Clientes"}</h1>
            <p className="text-sm text-muted-foreground">{modo === "viagens" ? "Clique para ver somente a viagem escolhida." : "Clique no cliente para ver todo o histórico."}</p>
          </div>
          <Button variant="outline" onClick={() => { setModo(modo === "viagens" ? "clientes" : "viagens"); setBusca(""); }}>
            {modo === "viagens" ? <Users className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
            {modo === "viagens" ? "Listar por clientes" : "Listar por viagens"}
          </Button>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={modo === "viagens" ? "Buscar cliente ou endereço" : "Buscar cliente"} value={busca} onChange={(e) => setBusca(e.target.value)} /></div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>{modo === "viagens" ? "Endereço" : "Última viagem"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {modo === "viagens" && listaViagens.length === 0 && <TableRow><TableCell colSpan={2} className="py-10 text-center text-muted-foreground">{carregando ? "Carregando..." : "Nenhuma viagem encontrada."}</TableCell></TableRow>}
              {modo === "viagens" && listaViagens.map((x) => (
                <TableRow key={x.id} className="cursor-pointer" onClick={() => setViagemAberta(x.id)}>
                  <TableCell className="font-medium">{nomeViagem(x)}</TableCell>
                  <TableCell className="max-w-xl text-muted-foreground"><span className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{x.destino || "—"}</span></TableCell>
                </TableRow>
              ))}
              {modo === "clientes" && grupos.length === 0 && <TableRow><TableCell colSpan={2} className="py-10 text-center text-muted-foreground">{carregando ? "Carregando..." : "Nenhum cliente encontrado."}</TableCell></TableRow>}
              {modo === "clientes" && grupos.map((x) => (
                <TableRow key={x.chave} className="cursor-pointer" onClick={() => setClienteAberto(x.chave)}>
                  <TableCell className="font-medium">{x.nome}</TableCell>
                  <TableCell>{x.ultima ? formatarData(x.ultima) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={!!t} onOpenChange={(o) => !o && setViagemAberta(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{nomeT} · {t ? formatarData(t.data) : ""}</DialogTitle></DialogHeader>
          {t && <div className="space-y-4">
            <p className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{t.destino}</p>
            <TrajetoInfo t={t} nomeVeic={nomeVeic.get(t.veiculoId ?? "")} media={t.veiculoId ? medias.get(t.veiculoId) : undefined} />
            <BagsInfo quantidade={bagsT.quantidade} retornada={bagsT.retornada} />
            <DiariasBloco diarias={diariasT} nomeVeic={nomeVeic} />
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!g} onOpenChange={(o) => !o && setClienteAberto(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" />{g?.nome} · Histórico</DialogTitle></DialogHeader>
          {g && datas.map((dt) => {
            const ds = g.diarias.filter((d) => d.data === dt);
            const ts = g.trajetos.filter((t2) => t2.data === dt);
            const bs = bagsDaViagem(bags, dt, g.nome);
            return (
              <div key={dt} className="space-y-3 rounded-lg border p-4">
                <p className="font-semibold">{formatarData(dt)}</p>
                {ts.map((t2) => <TrajetoInfo key={t2.id} t={t2} nomeVeic={nomeVeic.get(t2.veiculoId ?? "")} media={t2.veiculoId ? medias.get(t2.veiculoId) : undefined} />)}
                <BagsInfo quantidade={bs.quantidade} retornada={bs.retornada} />
                <DiariasBloco diarias={ds} nomeVeic={nomeVeic} />
              </div>
            );
          })}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrajetoInfo({ t, nomeVeic, media }: { t: Traj; nomeVeic: string | undefined; media: number | undefined }) {
  const consumo = t.consumoKmLitro ?? media ?? null;
  const litros = t.combustivelEstimadoLitros ?? calcularCombustivel(t.distanciaKm, consumo, t.temVolta);
  return <div className="rounded-lg border p-4 text-sm">
    <p className="font-medium">{t.origem} → {t.destino}</p>
    <p className="mt-1 text-muted-foreground">{nomeVeic || "Sem caminhão"} · {t.motorista || "Sem motorista"}{t.temVolta ? " · Ida e volta" : " · Somente ida"}</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <p>Distância total: <b>{distanciaTotalKm(t) == null ? "—" : `${distanciaTotalKm(t)!.toLocaleString("pt-BR")} km`}</b></p>
      <p>Tempo real: <b>{fmtTempo(tempoRealTotalMin(t))}</b></p>
      <p>Tempo estimado: <b>{fmtTempo(tempoEstimadoTotalMin(t))}</b></p>
    </div>
    <p className="mt-3 flex items-center gap-2"><Fuel className="h-4 w-4" />{litros == null ? "Consumo não calculado: faltam abastecimentos válidos ou distância." : <span>Estimativa: <b>{litros.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} litros</b> · média de <b>{consumo!.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km/L</b></span>}</p>
  </div>;
}

function BagsInfo({ quantidade, retornada }: { quantidade: number; retornada: number }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4 text-sm">
    <Package className="h-5 w-5" /><span>Bags enviados: <b>{quantidade}</b></span><span className="text-muted-foreground">Retornados: <b>{retornada}</b></span>
  </div>;
}

function DiariasBloco({ diarias, nomeVeic }: { diarias: Diaria[]; nomeVeic: Map<string, string> }) {
  const [detalhar, setDetalhar] = useState(false);
  const resumo = useMemo(() => {
    const m = new Map<string, { d: Diaria; qtd: number }>();
    for (const d of diarias) {
      const k = `${d.colaborador}|${d.equipe}|${d.valor}|${d.veiculoId ?? ""}`;
      const a = m.get(k); if (a) a.qtd++; else m.set(k, { d, qtd: 1 });
    }
    return [...m.values()];
  }, [diarias]);
  const total = diarias.reduce((s, d) => s + d.valor, 0);
  return <div className="rounded-lg border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="flex items-center gap-2 font-medium"><Users className="h-4 w-4" />Diárias da viagem</p>
      {diarias.length > 0 && <Button type="button" size="sm" variant="outline" onClick={() => setDetalhar(!detalhar)}>{detalhar ? "Ocultar diárias" : "Ver diárias"}</Button>}
    </div>
    {diarias.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma diária ligada a esta viagem.</p> : <>
      <div className="mt-3 space-y-2 text-sm">
        {resumo.map(({ d, qtd }) => <div key={`${d.id}-${qtd}`} className="flex flex-wrap justify-between gap-2">
          <span>{d.colaborador}{d.equipe ? ` · ${d.equipe}` : ""}</span>
          <span>{qtd} × {formatarMoeda(d.valor)} = <b>{formatarMoeda(qtd * d.valor)}</b></span>
        </div>)}
      </div>
      <p className="mt-3 border-t pt-3 text-right text-sm">Total: <b>{formatarMoeda(total)}</b></p>
      {detalhar && <div className="mt-3 space-y-2 border-t pt-3">
        {diarias.map((d) => <div key={d.id} className="rounded-md bg-muted p-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2"><b>{d.colaborador} · {d.tipo || "Diária"}</b><b>{formatarMoeda(d.valor)}</b></div>
          <p className="mt-1 text-muted-foreground">{formatarData(d.data)} · {d.equipe || "Sem equipe"} · {d.situacao === "pago" ? "Pago" : "Pendente"}{d.veiculoId ? ` · ${nomeVeic.get(d.veiculoId) ?? "Caminhão"}` : ""}{d.troco != null ? ` · Troco ${formatarMoeda(d.troco)}` : ""}</p>
          {d.observacao && <p className="mt-1 text-muted-foreground">{d.observacao}</p>}
        </div>)}
      </div>}
    </>}
  </div>;
}
