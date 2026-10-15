"use client";

import { useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";

import { PrintableDocument } from "@/components/print/printable-document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  instructions: string;
  quantity?: string;
}

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientCpf?: string | null;
  doctorName?: string;
  doctorCrm?: string | null;
  doctorSpecialty?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  initialItems?: PrescriptionItem[];
  onApplyToRecord?: (prescriptionText: string) => void;
}

export function PrescriptionDialog({
  open,
  onOpenChange,
  patientName,
  patientCpf,
  doctorName,
  doctorCrm,
  doctorSpecialty,
  clinicName,
  clinicAddress,
  clinicPhone,
  initialItems = [],
  onApplyToRecord,
}: PrescriptionDialogProps) {
  const [items, setItems] = useState<PrescriptionItem[]>(
    initialItems.length > 0
      ? initialItems
      : [
          {
            id: "1",
            medication: "Dipirona Monoidratada 500mg",
            dosage: "1 comprimido",
            instructions: "Tomar 1 comprimido por via oral de 6 em 6 horas se dor ou febre.",
            quantity: "1 cx",
          },
        ]
  );

  const [previewMode, setPreviewMode] = useState(false);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        medication: "",
        dosage: "",
        instructions: "",
        quantity: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PrescriptionItem, val: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleApply = () => {
    const textFormatted = items
      .filter((i) => i.medication.trim())
      .map((item, idx) => {
        let line = `${idx + 1}. ${item.medication} ${item.dosage ? `(${item.dosage})` : ""}`;
        if (item.quantity) line += ` - Qtd: ${item.quantity}`;
        if (item.instructions) line += `\n   Uso: ${item.instructions}`;
        return line;
      })
      .join("\n\n");

    if (onApplyToRecord) {
      onApplyToRecord(textFormatted);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {!previewMode ? (
          <>
            <DialogHeader className="p-5 border-b bg-muted/20">
              <DialogTitle className="text-lg font-bold text-foreground">
                Prescrição de Medicamentos & Receituário
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Paciente: <strong className="text-foreground">{patientName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Itens Prescritos ({items.length})
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="size-3.5 text-primary" />
                  <span>Adicionar Medicamento</span>
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Nome do Medicamento e Concentração
                        </Label>
                        <Input
                          placeholder="Ex: Amoxicilina 500mg"
                          value={item.medication}
                          onChange={(e) =>
                            updateItem(item.id, "medication", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Quantidade / Embalagens
                        </Label>
                        <Input
                          placeholder="Ex: 1 caixa, 30 comp."
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Posologia e Instruções de Uso
                      </Label>
                      <Textarea
                        placeholder="Ex: Tomar 1 comprimido por via oral de 8 em 8 horas por 7 dias."
                        value={item.instructions}
                        onChange={(e) =>
                          updateItem(item.id, "instructions", e.target.value)
                        }
                        className="text-xs min-h-[50px] resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleApply();
                  onOpenChange(false);
                }}
              >
                Salvar na Consulta
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    handleApply();
                    setPreviewMode(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                >
                  <Printer className="size-4" />
                  <span>Visualizar para Impressão</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <PrintableDocument
            patientName={patientName}
            patientCpf={patientCpf}
            doctorName={doctorName}
            doctorCrm={doctorCrm}
            doctorSpecialty={doctorSpecialty}
            clinicName={clinicName}
            clinicAddress={clinicAddress}
            clinicPhone={clinicPhone}
            documentTitle="RECEITUÁRIO MÉDICO"
            onClose={() => setPreviewMode(false)}
          >
            <div className="space-y-6 pt-2">
              <p className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-2">
                Uso Oral / Terapêutico:
              </p>
              {items
                .filter((item) => item.medication.trim())
                .map((item, idx) => (
                  <div key={item.id} className="pb-4 border-b border-zinc-100 last:border-none">
                    <div className="flex items-baseline justify-between font-semibold text-zinc-900 text-sm">
                      <span>
                        {idx + 1}. {item.medication}
                      </span>
                      {item.quantity && (
                        <span className="font-normal text-xs text-zinc-500">
                          Qtd: {item.quantity}
                        </span>
                      )}
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-zinc-700 mt-1 pl-4 leading-relaxed">
                        {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </PrintableDocument>
        )}
      </DialogContent>
    </Dialog>
  );
}
