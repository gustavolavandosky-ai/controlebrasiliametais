import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIDADES, type Unidade } from "@/lib/inventory-store";
import {
  useEpi,
  type Equipamento,
  type EpiLancamento,
  type TipoEpiLancamento,
} from "@/lib/epi-store";
import { toast } from "sonner";

interface Props {
  equipamento: Equipamento | null;
  lancamento?: EpiLancamento | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function EpiEntrySheet({ equipamento, lancamento, open, onOpenChange }: Props) {
  const { addLancamento, updateLancamento } = useEpi();
  const [tipo, setTipo] = useState<TipoEpiLancamento>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<Unidade>("un");
  const [data, setData] = useState(nowDate());
  const [hora, setHora] = useState(nowTime());
  const [retiradoPor, setRetiradoPor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (lancamento) {
      setTipo(lancamento.tipo);
      setQuantidade(String(lancamento.quantidade));
      setUnidade(lancamento.unidade);
      setData(lancamento.data);
      setHora(lancamento.hora);
      setRetiradoPor(lancamento.retiradoPor ?? "");
      setMotivo(lancamento.motivo ?? "");
      setObservacao(lancamento.observacao ?? "");
    } else if (equipamento) {
      setTipo("entrada");
      setQuantidade("");
      setUnidade(equipamento.unidade);
      setData(nowDate());
      setHora(nowTime());
      setRetiradoPor("");
      setMotivo("");
      setObservacao("");
    }
    salvandoRef.current = false;
    setSalvando(false);
  }, [open, equipamento, lancamento]);

  if (!equipamento) return null;

  const saida = tipo === "saida";

  const salvar = async () => {
    if (salvandoRef.current) return;
    const q = parseFloat(quantidade.replace(",", "."));
    if (!isFinite(q) || q < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    if (saida && !retiradoPor.trim()) {
      toast.error("Informe quem retirou o equipamento");
      return;
    }
    if (saida && !motivo.trim()) {
      toast.error("Informe o motivo da retirada");
      return;
    }
    const payload = {
      tipo,
      quantidade: q,
      unidade,
      data,
      hora,
      retiradoPor: saida ? retiradoPor.trim() : "",
      motivo: saida ? motivo.trim() : "",
      observacao,
    };
    salvandoRef.current = true;
    setSalvando(true);
    try {
      if (lancamento) {
        await updateLancamento(lancamento.id, payload);
        toast.success("Lançamento atualizado");
      } else {
        await addLancamento({ equipamentoId: equipamento.id, ...payload });
        toast.success("Lançamento salvo");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao salvar: " + (err as Error).message);
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!salvandoRef.current) onOpenChange(v);
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {lancamento ? "Editar lançamento" : "Incluir lançamento"}
          </SheetTitle>
          <SheetDescription>{equipamento.nome}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-4 px-4 pb-8">
          <div className="grid gap-2">
            <Label htmlFor="epi-lanc-tipo">Tipo de lançamento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEpiLancamento)}>
              <SelectTrigger id="epi-lanc-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída (retirada)</SelectItem>
                <SelectItem value="balanco">Balanço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="epi-lanc-qtd">Quantidade</Label>
              <Input
                id="epi-lanc-qtd"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="epi-lanc-un">Unidade</Label>
              <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                <SelectTrigger id="epi-lanc-un">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="epi-lanc-data">Data</Label>
              <Input
                id="epi-lanc-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="epi-lanc-hora">Horário</Label>
              <Input
                id="epi-lanc-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          {saida && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="epi-lanc-quem">Quem retirou</Label>
                <Input
                  id="epi-lanc-quem"
                  value={retiradoPor}
                  onChange={(e) => setRetiradoPor(e.target.value)}
                  placeholder="Nome do colaborador"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="epi-lanc-motivo">Motivo da retirada</Label>
                <Input
                  id="epi-lanc-motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex.: troca por desgaste, novo colaborador..."
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="epi-lanc-obs">Observação</Label>
            <Textarea
              id="epi-lanc-obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: nota fiscal, fornecedor, lote..."
              rows={3}
            />
          </div>

          <Button onClick={() => void salvar()} disabled={salvando} className="mt-2 w-full">
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
