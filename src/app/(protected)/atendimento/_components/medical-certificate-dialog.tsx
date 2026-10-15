"use client";

import { useState } from "react";
import { Award, Printer } from "lucide-react";

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

interface MedicalCertificateDialogProps {
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
  defaultCid?: string | null;
}

export function MedicalCertificateDialog({
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
  defaultCid = "",
}: MedicalCertificateDialogProps) {
  const [days, setDays] = useState("1");
  const [reasonType, setReasonType] = useState<"repouso" | "comparecimento">("repouso");
  const [cid, setCid] = useState(defaultCid || "");
  const [includeCid, setIncludeCid] = useState(false);
  const [customText, setCustomText] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {!previewMode ? (
          <>
            <DialogHeader className="p-5 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <Award className="size-5 text-amber-500" />
                <DialogTitle className="text-lg font-bold text-foreground">
                  Emissão de Atestado Médico
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Paciente: <strong className="text-foreground">{patientName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Tipo de Atestado
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={reasonType === "repouso" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReasonType("repouso")}
                      className="flex-1 text-xs"
                    >
                      Repouso / Afastamento
                    </Button>
                    <Button
                      type="button"
                      variant={reasonType === "comparecimento" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReasonType("comparecimento")}
                      className="flex-1 text-xs"
                    >
                      Comparecimento
                    </Button>
                  </div>
                </div>

                {reasonType === "repouso" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Quantidade de Dias de Repouso
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="w-24 text-center font-bold"
                      />
                      <span className="text-xs text-muted-foreground">
                        dia(s) a partir desta data
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Opção de CID */}
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-cid"
                    checked={includeCid}
                    onCheckedChange={(checked: boolean) => setIncludeCid(checked)}
                  />
                  <Label
                    htmlFor="include-cid"
                    className="text-xs font-medium cursor-pointer text-foreground"
                  >
                    Incluir Código CID-10 (com consentimento expresso do paciente)
                  </Label>
                </div>

                {includeCid && (
                  <div className="space-y-1 pl-6">
                    <Label className="text-[11px] text-muted-foreground">
                      Código ou Diagnóstico CID-10
                    </Label>
                    <Input
                      placeholder="Ex: J06.9 - Infecção aguda das vias aéreas superiores"
                      value={cid}
                      onChange={(e) => setCid(e.target.value)}
                      className="h-8 text-xs max-w-md"
                    />
                  </div>
                )}
              </div>

              {/* Observações Opcionais */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">
                  Observações Adicionais (Opcional)
                </Label>
                <Textarea
                  placeholder="Ex: Paciente esteve sob meus cuidados profissionais no período das 14h às 15h..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="text-xs min-h-[70px] resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t bg-muted/20 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => setPreviewMode(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <Printer className="size-4" />
                <span>Gerar & Imprimir Atestado</span>
              </Button>
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
            documentTitle="ATESTADO MÉDICO"
            onClose={() => setPreviewMode(false)}
          >
            <div className="py-8 px-4 text-center sm:text-left space-y-6">
              <p className="text-base text-zinc-900 leading-loose">
                Atesto para os devidos fins que o(a) Sr.(a){" "}
                <strong className="text-zinc-950 font-bold">{patientName}</strong>
                {patientCpf ? `, inscrito(a) no CPF sob o nº ${patientCpf}, ` : " "}
                {reasonType === "repouso" ? (
                  <>
                    esteve sob atendimento médico nesta data e deverá permanecer em repouso e
                    afastamento de suas atividades laborais e escolares pelo período de{" "}
                    <strong className="font-bold underline text-zinc-950">
                      {days} ({days === "1" ? "um" : days}) dia(s)
                    </strong>
                    , a contar a partir de hoje.
                  </>
                ) : (
                  <>
                    compareceu a este estabelecimento de saúde para consulta médica nesta data,
                    no período matutino/vespertino.
                  </>
                )}
              </p>

              {includeCid && cid && (
                <p className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                  <strong>Diagnóstico / CID-10:</strong> {cid}
                </p>
              )}

              {customText && (
                <p className="text-sm text-zinc-700 italic border-l-2 border-zinc-300 pl-3">
                  {customText}
                </p>
              )}
            </div>
          </PrintableDocument>
        )}
      </DialogContent>
    </Dialog>
  );
}
