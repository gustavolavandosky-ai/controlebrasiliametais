import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  formatarMoeda,
  useDiarias,
  type Diaria,
  type Situacao,
} from "@/lib/diarias-store";
import { toast } from "sonner";

interface Props {
  grupo: Diaria[] | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SEM_EQUIPE = "__sem";

export function DiariaSheet({ grupo, open, onOpenChange }: Props) {
  const { colaboradores, tipos, destinos, equipes, salvarGrupo } = useDiarias();
  const base = grupo?.[0] ?? null;

  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [equipe, setEquipe] = useState(SEM_EQUIPE);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [destino, setDestino] = useState("");
  const [situacao, setSituacao] = useState<Situacao>("pago");
  const [troco, setTroco] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!open) return;
    if (base && grupo) {
      setData(base.data);
      setSelecionados(grupo.map((g) => g.colaborador));
      setEquipe(base.equipe || SEM_EQUIPE);
      setTipo(base.tipo);
      setValor(String(base.valor));
      setDestino(base.destino);
      setSituacao(base.situacao);
      setTroco(base.troco === null ? "" : String(base.troco));
      setObservacao(base.observacao);
    } else {
      setData(new Date().toISOString().slice(0, 10));
      setSelecionados([]);
      setEquipe(SEM_EQUIPE);
      setTipo("");
      setValor("");
      setDestino("");
      setSituacao("pago");
      setTroco("");
      setObservacao("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, grupo]);

  const alternarColaborador = (nome: string) => {
    setSelecionados((atual) => {
      if (atual.includes(nome)) return atual.filter((n) => n !== nome);
      const c = colaboradores.find((x) => x.nome === nome);
      if (c?.equipe && atual.length === 0) setEquipe(c.equipe);
      return [...atual, nome];
    });
  };

  const escolherTipo = (nome: string) => {
    setTipo(nome);
    const t = tipos.find((x) => x.nome === nome);
    if (t && !valor) setValor(String(t.valorPadrao));
  };

  const valorNumero = parseFloat(valor.replace(",", ".")) || 0;
  const totalGrupo = valorNumero * selecionados.length;

  const salvar = async () => {
    if (selecionados.length === 0) {
      toast.error("Escolha ao menos um colaborador");
      return;
    }
    const v = parseFloat(valor.replace(",", "."));
    if (!isFinite(v) || v < 0) {
      toast.error("Valor inválido");
      return;
    }
    const t = troco.trim() === "" ? null : parseFloat(troco.replace(",", "."));
    const linhas = selecionados.map((nome) => ({
      data,
      colaborador: nome,
      equipe: equipe === SEM_EQUIPE ? "" : equipe,
      tipo,
      valor: v,
      destino,
      situacao,
      troco: t !== null && isFinite(t) ? t : null,
      observacao,
    }));
    try {
      await salvarGrupo(linhas, grupo ? grupo.map((g) => g.id) : []);
      toast.success(grupo ? "Lançamento atualizado" : "Lançamento registrado");
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao salvar: " + (err as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{grupo ? "Editar lançamento" : "Novo lançamento"}</SheetTitle>
          <SheetDescription>
            Lance a equipe inteira de uma vez: cada colaborador recebe o mesmo valor.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-4 px-4 pb-8">
          <div className="grid gap-2">
            <Label htmlFor="diaria-data">Data</Label>
            <Input
              id="diaria-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Colaboradores da equipe ({selecionados.length})</Label>
            <div className="max-h-56 overflow-y-auto rounded-md border p-2">
              {colaboradores.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={selecionados.includes(c.nome)}
                    onCheckedChange={() => alternarColaborador(c.nome)}
                  />
                  <span className="flex-1">{c.nome}</span>
                  {c.equipe && (
                    <span className="text-xs text-muted-foreground">{c.equipe}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="diaria-equipe">Equipe</Label>
            <Select value={equipe} onValueChange={setEquipe}>
              <SelectTrigger id="diaria-equipe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_EQUIPE}>Sem equipe</SelectItem>
                {EQUIPES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="diaria-tipo">Tipo de diária</Label>
            <Select value={tipo} onValueChange={escolherTipo}>
              <SelectTrigger id="diaria-tipo">
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.nome}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="diaria-valor">Valor (R$)</Label>
              <Input
                id="diaria-valor"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="diaria-troco">Troco (R$)</Label>
              <Input
                id="diaria-troco"
                inputMode="decimal"
                value={troco}
                onChange={(e) => setTroco(e.target.value)}
                placeholder="opcional"
              />
            </div>
          </div>

          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            Total do lançamento:{" "}
            <span className="font-semibold">{formatarMoeda(totalGrupo)}</span>{" "}
            <span className="text-muted-foreground">
              ({selecionados.length} × {formatarMoeda(valorNumero)})
            </span>
          </p>

          <div className="grid gap-2">
            <Label htmlFor="diaria-destino">Destino / cliente</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger id="diaria-destino">
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {destinos.map((d) => (
                  <SelectItem key={d.id} value={d.nome}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="diaria-situacao">Situação</Label>
            <Select value={situacao} onValueChange={(v) => setSituacao(v as Situacao)}>
              <SelectTrigger id="diaria-situacao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="diaria-observacao">Observação</Label>
            <Textarea
              id="diaria-observacao"
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: adiantamento, motivo, responsável..."
            />
          </div>

          <Button className="mt-2 w-full" onClick={() => void salvar()}>
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}