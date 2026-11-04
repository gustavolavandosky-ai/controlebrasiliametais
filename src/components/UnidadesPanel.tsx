import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Lancamento, Produto } from "@/lib/inventory-store";
import {
  calcularFardos,
  controlePorLocal,
  NOME_UNIDADE,
  ultimoApontamento,
  useApontamentos,
} from "@/lib/unidades";

const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const hoje = () => new Date().toISOString().slice(0, 10);

interface Props {
  produto: Produto;
  lancamentos: Lancamento[];
  estoque: number;
  somenteLeitura: boolean;
}

export function UnidadesPanel({ produto, lancamentos, estoque, somenteLeitura }: Props) {
  const controle = controlePorLocal(produto.localizacao);
  const { apontamentos, add } = useApontamentos(produto.id);
  const [aberto, setAberto] = useState(false);
  const [qtd, setQtd] = useState("");
  const [peso, setPeso] = useState("");
  const [resp, setResp] = useState("");
  const [just, setJust] = useState("");
  const [data, setData] = useState(hoje());
  const [salvando, setSalvando] = useState(false);

  const meus = useMemo(
    () => lancamentos.filter((l) => l.produtoId === produto.id),
    [lancamentos, produto.id],
  );
  const fardos = useMemo(() => calcularFardos(meus, apontamentos), [meus, apontamentos]);

  if (!controle) return null;
  const tipoAp = controle === "fardo" ? "contagem_fardo" : controle;
  const atual = controle === "fardo" ? null : ultimoApontamento(apontamentos, controle);
  const historico = apontamentos.filter((a) => a.tipo === tipoAp).reverse();
  const excedePeso = atual?.pesoKg != null && atual.pesoKg > estoque;
  const unidadeNome = NOME_UNIDADE[controle];

  const abrir = () => {
    setQtd(""); setPeso(""); setResp(""); setJust(""); setData(hoje()); setAberto(true);
  };

  const salvar = async (): Promise<void> => {
    const q = Number(qtd);
    if (!Number.isInteger(q) || q < 0) { toast.error("Quantidade deve ser inteira e ≥ 0"); return; }
    let p: number | null = null;
    if (controle !== "fardo") {
      p = parseFloat(peso.replace(",", "."));
      if (!isFinite(p) || p < 0) { toast.error("Peso inválido"); return; }
    } else {
      if (!resp.trim()) { toast.error("Informe o responsável"); return; }
      if (q !== fardos.saldo && !just.trim()) { toast.error("Justificativa obrigatória quando há diferença"); return; }
    }
    setSalvando(true);
    try {
      await add({
        tipo: tipoAp,
        quantidade: q,
        pesoKg: p,
        saldoCalculado: controle === "fardo" ? fardos.saldo : null,
        responsavel: resp.trim(),
        justificativa: just.trim(),
        data,
      });
      toast.success("Registro salvo");
      setAberto(false);
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Controle de {unidadeNome.toLowerCase()}</h2>
        {!somenteLeitura && (
          <Button size="sm" onClick={abrir}>
            {controle === "fardo" ? "Informar contagem física" : `Informar ${unidadeNome}`}
          </Button>
        )}
      </div>

      {controle === "fardo" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Box label="Saldo de fardos (calculado)" value={`${fardos.saldo} fardos`} />
          <Box label="Peso em estoque" value={`${fmt(estoque)} ${produto.unidade}`} />
          <Box
            label="Última contagem física"
            value={fardos.contagem ? `${fardos.contagem.quantidade} em ${fardos.contagem.data.split("-").reverse().join("/")}` : "Nenhuma"}
          />
          {fardos.saldo < 0 && (
            <Alerta>Saldo de fardos negativo. Faça uma contagem física.</Alerta>
          )}
          {fardos.pendentes.length > 0 && (
            <Alerta>
              {fardos.pendentes.length} saída(s) registrada(s) só em peso, sem quantidade de fardos —
              conferência física pendente ({fardos.pendentes.map((l) => l.data.split("-").reverse().join("/")).slice(0, 5).join(", ")}
              {fardos.pendentes.length > 5 ? "…" : ""}).
            </Alerta>
          )}
          {!fardos.contagem && (
            <p className="text-xs text-muted-foreground sm:col-span-3">
              Lançamentos antigos não têm fardos informados e não são contados. Registre uma contagem física para definir o saldo inicial.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Box label={`${unidadeNome} prontos (último registro)`} value={atual ? String(atual.quantidade) : "Não informado"} />
          <Box label="Peso informado" value={atual?.pesoKg != null ? `${fmt(atual.pesoKg)} kg` : "—"} />
          <Box label="Estoque disponível" value={`${fmt(estoque)} ${produto.unidade}`} />
          {excedePeso && (
            <Alerta>
              Peso informado ({fmt(atual!.pesoKg!)} kg) é maior que o estoque atual ({fmt(estoque)} {produto.unidade}). Confira.
            </Alerta>
          )}
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Apontamento informativo: não movimenta nem reserva estoque.
          </p>
        </div>
      )}

      {historico.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">Histórico ({historico.length})</summary>
          <ul className="mt-2 space-y-1">
            {historico.map((a, i) => (
              <li key={a.id} className={i === 0 ? "font-medium" : "text-muted-foreground"}>
                {a.data.split("-").reverse().join("/")} — {a.quantidade} {unidadeNome.toLowerCase()}
                {a.pesoKg != null && ` / ${fmt(a.pesoKg)} kg`}
                {a.saldoCalculado != null && ` (calculado: ${a.saldoCalculado}, ajuste ${a.quantidade - a.saldoCalculado >= 0 ? "+" : ""}${a.quantidade - a.saldoCalculado})`}
                {a.responsavel && ` · ${a.responsavel}`}
                {a.justificativa && ` · ${a.justificativa}`}
                {i === 0 && " · atual"}
              </li>
            ))}
          </ul>
        </details>
      )}

      <Dialog open={aberto} onOpenChange={(v) => !salvando && setAberto(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {controle === "fardo" ? "Contagem física de fardos" : `Informar ${unidadeNome}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {controle === "fardo" && (
              <p className="text-sm text-muted-foreground">Saldo calculado atual: {fardos.saldo} fardos. A diferença gera ajuste auditável; lançamentos originais não são alterados.</p>
            )}
            <div className="grid gap-2">
              <Label>Quantidade de {unidadeNome.toLowerCase()}</Label>
              <Input inputMode="numeric" value={qtd} onChange={(e) => setQtd(e.target.value)} autoFocus />
            </div>
            {controle !== "fardo" && (
              <div className="grid gap-2">
                <Label>Peso total (kg)</Label>
                <Input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Responsável{controle === "fardo" ? " *" : ""}</Label>
              <Input value={resp} onChange={(e) => setResp(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{controle === "fardo" ? "Justificativa (obrigatória se houver diferença)" : "Observação"}</Label>
              <Input value={just} onChange={(e) => setJust(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void salvar()} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-lg">{value}</div>
    </div>
  );
}

function Alerta({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive sm:col-span-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
