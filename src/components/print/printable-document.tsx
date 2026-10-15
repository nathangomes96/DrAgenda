"use client";

import { ReactNode } from "react";
import { Building2, FileText, Printer, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PrintableDocumentProps {
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorCrm?: string | null;
  patientName: string;
  patientCpf?: string | null;
  patientAge?: number | null;
  documentTitle: string;
  documentDate?: Date;
  children: ReactNode;
  onClose?: () => void;
}

export function PrintableDocument({
  clinicName = "Clínica Médica Integrada",
  clinicAddress,
  clinicPhone,
  doctorName = "Médico Responsável",
  doctorSpecialty,
  doctorCrm,
  patientName,
  patientCpf,
  patientAge,
  documentTitle,
  documentDate = new Date(),
  children,
  onClose,
}: PrintableDocumentProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(documentDate);

  return (
    <div className="flex flex-col h-full">
      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/40 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            Visualização para Impressão
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
          >
            <Printer className="size-4" />
            <span>Imprimir Documento</span>
          </Button>
        </div>
      </div>

      {/* Folha de Impressão (A4) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-muted/10 print:bg-white print:p-0 print:overflow-visible">
        <div className="w-full max-w-[210mm] min-h-[280mm] bg-white text-zinc-900 border border-zinc-200 rounded-xl p-8 sm:p-12 shadow-md flex flex-col justify-between print:border-none print:shadow-none print:p-8 print:w-full print:max-w-none print:rounded-none">
          {/* Cabeçalho da Clínica */}
          <div>
            <div className="border-b-2 border-zinc-800 pb-5 mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 uppercase">
                  {clinicName}
                </h1>
                <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
                  {clinicAddress && <p>{clinicAddress}</p>}
                  {clinicPhone && <p>Contato: {clinicPhone}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-800">{doctorName}</p>
                {doctorSpecialty && (
                  <p className="text-xs text-zinc-600">{doctorSpecialty}</p>
                )}
                {doctorCrm && (
                  <p className="text-xs font-mono text-zinc-600">CRM / Reg.: {doctorCrm}</p>
                )}
              </div>
            </div>

            {/* Identificação do Paciente */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 mb-8 text-xs text-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-900">Paciente: </span>
                  <span className="font-bold text-sm text-zinc-900">{patientName}</span>
                </div>
                {patientAge !== null && patientAge !== undefined && (
                  <div>
                    <span className="font-semibold text-zinc-900">Idade: </span>
                    <span>{patientAge} anos</span>
                  </div>
                )}
              </div>
              {patientCpf && (
                <div className="mt-1">
                  <span className="font-semibold text-zinc-900">CPF: </span>
                  <span className="font-mono">{patientCpf}</span>
                </div>
              )}
            </div>

            {/* Título do Documento */}
            <div className="text-center my-6">
              <h2 className="text-base font-extrabold uppercase tracking-widest text-zinc-900 pb-1 inline-block border-b-2 border-zinc-900">
                {documentTitle}
              </h2>
            </div>

            {/* Conteúdo Dinâmico (Receita / Atestado / Pedido) */}
            <div className="min-h-[140mm] py-2 text-sm leading-relaxed text-zinc-800">
              {children}
            </div>
          </div>

          {/* Rodapé com Assinatura & Data */}
          <div className="pt-8 border-t border-zinc-200 mt-auto">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-64 border-b border-zinc-400 mb-2" />
              <p className="text-sm font-bold text-zinc-900">{doctorName}</p>
              {doctorSpecialty && (
                <p className="text-xs text-zinc-600">{doctorSpecialty}</p>
              )}
              {doctorCrm && (
                <p className="text-xs font-mono text-zinc-600">CRM / Reg.: {doctorCrm}</p>
              )}
              <p className="text-xs text-zinc-400 mt-4">
                Emitido em {formattedDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
