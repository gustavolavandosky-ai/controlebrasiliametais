import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIDADES, type Unidade } from "@/lib/inventory-store";
import { useEpi, type Equipamento } from "@/lib/epi-store";
import { toast } from "sonner";

interface Props {
  equipamento?: Equipamento | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function EpiDialog({ equipamento, open, onOpenChange }: Props) {
  const { addEquipamento, updateEquipamento } = useEpi();
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState<Unidade>("un");
  const [estoqueInicial, setEstoqueInicial] = useState("0");
  const [localizacao, setLocalizacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (equipamento) {
      setNome(equipamento.nome);
      setUnidade(equipamento.unidade);
      setEstoqueInicial(String(equipamento.estoqueInicial));
      setLocalizacao(equipamento.localizacao);
      setObservacoes(equipamento.observacoes);
    } else {
      setNome("");
      setUnidade("un");
      setEstoqueInicial("0");
      setLocalizacao("");
      setObservacoes("");
    }
    salvandoRef.current = false;
    setSalvando(false);
  }, [open, equipamento]);

  const salvar = async () => {
    if (salvandoRef.current) return;
    if (!nome.trim()) {
      toast.error("Informe o nome do equipamento");
      return;
    }
    const payload = {
      nome: nome.trim(),
      unidade,
      estoqueInicial: parseFloat(estoqueInicial.replace(",", ".")) || 0,
      localizacao: localizacao.trim(),
      observacoes: observacoes.trim(),
    };
    salvandoRef.current = true;
    setSalvando(true);
    try {
      if (equipamento) {
        await updateEquipamento(equipamento.id, payload);
        toast.success("Equipamento atualizado");
      } else {
        await addEquipamento(payload);
        toast.success("Equipamento cadastrado");
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!salvandoRef.current) onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {equipamento ? "Editar equipamento" : "Cadastrar equipamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="epi-nome">Nome do equipamento</Label>
            <Input
              id="epi-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Capacete de segurança"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="epi-unidade">Unidade</Label>
              <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                <SelectTrigger id="epi-unidade">
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
            <div className="grid gap-2">
              <Label htmlFor="epi-estoque">Estoque inicial</Label>
              <Input
                id="epi-estoque"
                inputMode="decimal"
                value={estoqueInicial}
                onChange={(e) => setEstoqueInicial(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="epi-localizacao">Onde está guardado</Label>
            <Input
              id="epi-localizacao"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex.: Almoxarifado - Armário 2"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="epi-observacoes">Observações</Label>
            <Textarea
              id="epi-observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={() => void salvar()} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
