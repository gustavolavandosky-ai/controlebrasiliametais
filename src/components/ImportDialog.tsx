import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useInventory, UNIDADES, type Unidade } from "@/lib/inventory-store";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface RowPreview {
  nome: string;
  unidade: string;
  estoqueInicial: number;
  localizacao: string;
  observacoes: string;
  valido: boolean;
  erro: string;
}

function normalizarUnidade(val: string | undefined): Unidade | "" {
  if (!val) return "";
  const u = String(val).trim().toLowerCase();
  const found = UNIDADES.find((x) => x.toLowerCase() === u);
  return found || "";
}

export function ImportDialog({ open, onOpenChange }: Props) {
  const { importarProdutos } = useInventory();
  const [preview, setPreview] = useState<RowPreview[]>([]);
  const [fileName, setFileName] = useState("");
  const [importarInicial, setImportarInicial] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      try {
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          toast.error("Planilha sem abas");
          setPreview([]);
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        if (!sheet) {
          toast.error("Erro ao ler aba da planilha");
          setPreview([]);
          return;
        }
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

        if (json.length < 2) {
          toast.error("Planilha vazia ou sem cabeçalho");
          setPreview([]);
          return;
        }

        const firstRow = json[0];
        if (!Array.isArray(firstRow)) {
          toast.error("Cabeçalho inválido");
          setPreview([]);
          return;
        }
        const header = firstRow.map((h) => String(h).trim().toLowerCase());
        const colProduto = header.findIndex((h) => h.includes("produto"));
        const colUnidade = header.findIndex((h) => h.includes("unidade"));
        const colEstoque = header.findIndex(
          (h) => h.includes("estoque") && (h.includes("inicial") || h.includes("físico") || h.includes("fisico")),
        );
        const colLocal = header.findIndex((h) => h.includes("localiza"));
        const colObs = header.findIndex((h) => h.includes("observa") || h.includes("nota") || h.includes("descri"));

        if (colProduto === -1 || colUnidade === -1 || colEstoque === -1) {
          toast.error("Cabeçalho inválido. A planilha precisa das colunas: Produto, Unidade, Estoque Inicial");
          setPreview([]);
          return;
        }

        const rows: RowPreview[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!Array.isArray(row)) continue;

          const nome = String(row[colProduto] ?? "").trim();
          const unidadeRaw = String(row[colUnidade] ?? "").trim();
          const estoqueRaw = row[colEstoque];
          const localizacao = colLocal >= 0 ? String(row[colLocal] ?? "").trim() : "";
          const observacoes = colObs >= 0 ? String(row[colObs] ?? "").trim() : "";

          if (!nome) continue;

          const unidade = normalizarUnidade(unidadeRaw);
          const estoque = parseFloat(String(estoqueRaw).replace(",", ".")) || 0;
          const valido = !!unidade;

          rows.push({
            nome,
            unidade: unidade || unidadeRaw,
            estoqueInicial: estoque,
            localizacao,
            observacoes,
            valido,
            erro: valido ? "" : "Unidade não reconhecida",
          });
        }

        setPreview(rows);
      } catch (err) {
        toast.error("Erro ao ler planilha");
        setPreview([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmar = async () => {
    const validos = preview.filter((r) => r.valido);
    if (validos.length === 0) {
      toast.error("Nenhuma linha válida para importar");
      return;
    }

    let criados = 0;
    try {
      criados = await importarProdutos(
        validos.map((row) => ({
          nome: row.nome,
          unidade: ((row.unidade as Unidade) || "un") as Unidade,
          estoqueInicial: 0,
          localizacao: row.localizacao,
          observacoes: row.observacoes,
          saldoInicial: row.estoqueInicial,
        })),
        importarInicial,
      );
    } catch (err) {
      toast.error("Erro ao importar: " + (err as Error).message);
      return;
    }

    toast.success(`${criados} produto(s) importado(s)`);
    setPreview([]);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
    onOpenChange(false);
  };

  const cancelar = () => {
    setPreview([]);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={cancelar}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar inventário</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Arquivo Excel (.xlsx)</Label>
            <Input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
            />
            <p className="text-xs text-muted-foreground">
              Colunas obrigatórias: Produto, Unidade, Estoque Inicial.
              Colunas opcionais: Localização, Observações.
            </p>
          </div>

          {preview.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="importar-inicial"
                  checked={importarInicial}
                  onCheckedChange={(v) => setImportarInicial(v === true)}
                />
                <Label htmlFor="importar-inicial" className="cursor-pointer text-sm">
                  Registrar o estoque inicial como lançamento de balanço
                </Label>
              </div>

              <div className="max-h-80 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Estoque inicial</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, idx) => (
                      <TableRow key={idx} className={row.valido ? "" : "bg-destructive/10"}>
                        <TableCell>{row.nome}</TableCell>
                        <TableCell>{row.unidade}</TableCell>
                        <TableCell className="text-right font-mono">{row.estoqueInicial}</TableCell>
                        <TableCell>{row.localizacao || "—"}</TableCell>
                        <TableCell>{row.observacoes || "—"}</TableCell>
                        <TableCell className="text-center text-xs">
                          {row.valido ? "Válido" : row.erro}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cancelar}>
            Cancelar
          </Button>
          <Button onClick={() => void confirmar()} disabled={preview.filter((r) => r.valido).length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar {preview.filter((r) => r.valido).length > 0 ? `(${preview.filter((r) => r.valido).length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
