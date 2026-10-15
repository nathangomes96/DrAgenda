"use client";

import { useState } from "react";
import { FileSpreadsheet, Plus, Printer, Trash2 } from "lucide-react";

import { PrintableDocument } from "@/components/print/printable-document";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const COMMON_EXAMS = [
  "Hemograma Completo",
  "Glicemia de Jejum & Hemoglobina Glicada",
  "Perfil Lipídico Completo (Colesterol Total, HDL, LDL, Triglicerídeos)",
  "Função Renal (Ureia e Creatinina)",
  "Função Hepática (TGO, TGP, Gama-GT)",
  "Urina Tipo I (EAS) e Urocultura",
  "TSH e T4 Livre",
  "Eletrocardiograma de Repouso (ECG)",
  "Radiografia de Tórax (PA e Perfil)",
  "Ultrassonografia de Abdome Total",
];

interface ExamRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientCpf?: string | null;
  patientAge?: number | null;
  doctorName?: string;
  doctorCrm?: string | null;
  doctorSpecialty?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

export function ExamRequestDialog({
  open,
  onOpenChange,
  patientName,
  patientCpf,
  patientAge,
  doctorName,
  doctorCrm,
  doctorSpecialty,
  clinicName,
  clinicAddress,
  clinicPhone,
}: ExamRequestDialogProps) {
  const [selectedExams, setSelectedExams] = useState<string[]>([
    "Hemograma Completo",
    "Glicemia de Jejum & Hemoglobina Glicada",
    "Perfil Lipídico Completo (Colesterol Total, HDL, LDL, Triglicerídeos)",
  ]);
  const [customExams, setCustomExams] = useState<string[]>([]);
  const [newExamInput, setNewExamInput] = useState("");
  const [indication, setIndication] = useState("Avaliação clínica e check-up preventivo de rotina.");
  const [previewMode, setPreviewMode] = useState(false);

  const toggleCommonExam = (exam: string) => {
    setSelectedExams((prev) =>
      prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
    );
  };

  const addCustomExam = () => {
    if (!newExamInput.trim()) return;
    setCustomExams((prev) => [...prev, newExamInput.trim()]);
    setNewExamInput("");
  };

  const removeCustomExam = (index: number) => {
    setCustomExams((prev) => prev.filter((_, i) => i !== index));
  };

  const allExams = [...selectedExams, ...customExams];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {!previewMode ? (
          <>
            <DialogHeader className="p-5 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-sky-600" />
                <DialogTitle className="text-lg font-bold text-foreground">
                  Solicitação de Exames Complementares
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Paciente: <strong className="text-foreground">{patientName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Exames Frequentes / Checkbox */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Exames Laboratoriais e Imagem Frequentes
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COMMON_EXAMS.map((exam) => {
                    const isChecked = selectedExams.includes(exam);
                    return (
                      <div
                        key={exam}
                        onClick={() => toggleCommonExam(exam)}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-primary/5 border-primary/40 font-medium text-foreground"
                            : "bg-card border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => {}} />
                        <span className="flex-1 select-none">{exam}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exames Adicionais */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Outros Exames Específicos
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Ecocardiograma Transtorácico, Ressonância de Joelho..."
                    value={newExamInput}
                    onChange={(e) => setNewExamInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomExam();
                      }
                    }}
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomExam}
                    className="h-9 text-xs gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>Adicionar</span>
                  </Button>
                </div>

                {customExams.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {customExams.map((exam, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs"
                      >
                        <span>{exam}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomExam(idx)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Indicação Clínica */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Indicação Clínica / Justificativa
                </Label>
                <Textarea
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  placeholder="Ex: Investigação diagnóstica de dor precordial atípica..."
                  className="text-xs min-h-[60px] resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Total de exames selecionados: <strong>{allExams.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={allExams.length === 0}
                  onClick={() => setPreviewMode(true)}
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
            patientAge={patientAge}
            doctorName={doctorName}
            doctorCrm={doctorCrm}
            doctorSpecialty={doctorSpecialty}
            clinicName={clinicName}
            clinicAddress={clinicAddress}
            clinicPhone={clinicPhone}
            documentTitle="SOLICITAÇÃO DE EXAMES COMPLEMENTARES"
            onClose={() => setPreviewMode(false)}
          >
            <div className="py-4 space-y-6">
              {indication && (
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-xs text-zinc-700">
                  <strong>Indicação Clínica:</strong> {indication}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Exames Solicitados ({allExams.length}):
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-800 font-medium pl-2">
                  {allExams.map((exam, idx) => (
                    <li key={idx} className="pb-1 border-b border-zinc-100 last:border-none">
                      {exam}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </PrintableDocument>
        )}
      </DialogContent>
    </Dialog>
  );
}
