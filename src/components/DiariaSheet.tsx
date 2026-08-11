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
import {
  EQUIPES,
  useDiarias,
  type Diaria,
  type Situacao,
} from "@/lib/diarias-store";
import { toast } from "sonner";

interface Props {
  diaria: Diaria | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SEM_EQUIPE = "__sem";

export function DiariaSheet({ diaria, open, onOpenChange }: Props) {
  const { colaboradores, tipos, destinos, addDiaria, updateDiaria } = useDiarias();

  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [colaborador, setColaborador] = useState("");
  const [equipe, setEquipe] = useState(SEM_EQUIPE);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [destino, setDestino] = useState("");
  const [situacao, setSituacao] = useState<Situacao>("pago");
  const [troco, setTroco] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!open) return;
    if (diaria) {
      setData(diaria.data);
      setColaborador(diaria.colaborador);
      setEquipe(diaria.equipe || SEM_EQUIPE);
      setTipo(diaria.tipo);
      setValor(String(diaria.valor));
      setDestino(diaria.destino);
      setSituacao(diaria.situacao);
      setTroco(diaria.troco === null ? "" : String(diaria.troco));
      setObservacao(diaria.observacao);
    } else {
      setData(new Date().toISOString().slice(0, 10));
      setColaborador("");
      setEquipe(SEM_EQUIPE);
      setTipo("");
      setValor("");
      setDestino("");
      setSituacao("pago");
      setTroco("");
      setObservacao("");
    }
  }, [open, diaria]);

  const escolherColaborador = (nome: string) => {
    setColaborador(nome);
    const c = colaboradores.find((x) => x.nome === nome);
    if (c?.equipe) setEquipe(c.equipe);
  };

  const escolherTipo = (nome: string) => {
    setTipo(nome);
    const t = tipos.find((x) => x.nome === nome);
    if (t && !valor) setValor(String(t.valorPadrao));
  };

  const salvar = async () => {
    if (!colaborador) {
      toast.error("Escolha o colaborador");
      return;
    }
    const v = parseFloat(valor.replace(",", "."));
    if (!isFinite(v) || v < 0) {
      toast.error("Valor inválido");
      return;
    }
    const t = troco.trim() === "" ? null : parseFloat(troco.replace(",", "."));
    const payload = {
      data,
      colaborador,
      equipe: equipe === SEM_EQUIPE ? "" : equipe,
      tipo,
      valor: v,
      destino,
      situacao,
      troco: t !== null && isFinite(t) ? t : null,
      observacao,
    };
    try {
      if (diaria) {
        await updateDiaria(diaria.id, payload);
        toast.success("Diária atualizada");
      } else {
        await addDiaria(payload);
        toast.success("Diária lançada");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao salvar: " + (err as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{diaria ? "Editar diária" : "Nova diária"}</SheetTitle>
          <SheetDescription>Controle de diárias por colaborador</SheetDescription>
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
            <Label htmlFor="diaria-colaborador">Colaborador</Label>
            <Select value={colaborador} onValueChange={escolherColaborador}>
              <SelectTrigger id="diaria-colaborador">
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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