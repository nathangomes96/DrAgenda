"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Award,
  Calendar,
  Clock,
  FileSpreadsheet,
  FileText,
  Heart,
  MessageCircle,
  Phone,
  Pill,
  ShieldAlert,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

interface PatientSidebarCardProps {
  patient: typeof patientsTable.$inferSelect;
  appointment?: (typeof appointmentsTable.$inferSelect & {
    doctor?: typeof doctorsTable.$inferSelect | null;
  }) | null;
  onOpenHistory: () => void;
  onOpenPrescription: () => void;
  onOpenCertificate: () => void;
  onOpenExamRequest: () => void;
}

export function PatientSidebarCard({
  patient,
  appointment,
  onOpenHistory,
  onOpenPrescription,
  onOpenCertificate,
  onOpenExamRequest,
}: PatientSidebarCardProps) {
  // Cálculo de idade a partir de birthDate
  const age = useMemo(() => {
    if (!patient.birthDate) return null;
    let birth: Date;
    if (patient.birthDate.includes("-")) {
      const parts = patient.birthDate.split("-");
      birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else if (patient.birthDate.includes("/")) {
      const parts = patient.birthDate.split("/");
      birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      birth = new Date(patient.birthDate);
    }

    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      years--;
    }
    return years >= 0 ? years : null;
  }, [patient.birthDate]);

  const initials = useMemo(() => {
    return patient.name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [patient.name]);

  const cleanPhone = patient.phoneNumber?.replace(/\D/g, "") || "";
  const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  return (
    <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden flex flex-col">
      {/* Header com Avatar e Identificação */}
      <CardHeader className="p-4 pb-3 bg-muted/20 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="size-13 border-2 border-primary/20 shadow-xs">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground truncate" title={patient.name}>
              {patient.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span>{patient.sex === "male" ? "Masc." : "Fem."}</span>
              {age !== null && (
                <>
                  <span>•</span>
                  <span>{age} anos</span>
                </>
              )}
              {patient.bloodType && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/30">
                    {patient.bloodType}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Informações de Contato / CPF */}
        <div className="mt-3 space-y-1.5 text-xs">
          {patient.cpf && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>CPF:</span>
              <span className="font-mono text-foreground font-medium">{patient.cpf}</span>
            </div>
          )}
          {patient.phoneNumber && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Telefone:</span>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <span>{patient.phoneNumber}</span>
                {whatsappUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Abrir WhatsApp</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
          {patient.healthInsurance && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Convênio:</span>
              <span className="font-medium text-foreground">{patient.healthInsurance}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
        {/* Bloco de Alertas Médicos Clínicos */}
        <div className="space-y-2.5">
          {/* Alergias */}
          <div
            className={cn(
              "rounded-xl p-2.5 border text-xs transition-colors",
              patient.allergies
                ? "bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200"
                : "bg-muted/30 border-muted text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              {patient.allergies ? (
                <ShieldAlert className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span>Alergias</span>
            </div>
            <p className="text-[11px] leading-relaxed line-clamp-3">
              {patient.allergies || "Nenhuma alergia cadastrada."}
            </p>
          </div>

          {/* Medicamentos em Uso */}
          <div
            className={cn(
              "rounded-xl p-2.5 border text-xs transition-colors",
              patient.currentMedications
                ? "bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200"
                : "bg-muted/30 border-muted text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              <Pill className={cn("size-3.5 shrink-0", patient.currentMedications ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
              <span>Medicamentos em Uso</span>
            </div>
            <p className="text-[11px] leading-relaxed line-clamp-3">
              {patient.currentMedications || "Nenhum medicamento de uso contínuo informado."}
            </p>
          </div>

          {/* Histórico Médico Prévio */}
          {patient.medicalHistory && (
            <div className="rounded-xl p-2.5 border border-muted bg-muted/20 text-xs">
              <div className="flex items-center gap-1.5 font-semibold mb-1 text-muted-foreground">
                <Heart className="size-3.5 text-primary shrink-0" />
                <span>Antecedentes</span>
              </div>
              <p className="text-[11px] leading-relaxed text-foreground line-clamp-3">
                {patient.medicalHistory}
              </p>
            </div>
          )}
        </div>

        {/* Botões de Ação Rápida */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHistory}
            className="w-full justify-start text-xs font-medium rounded-xl h-9 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
          >
            <Clock className="size-3.5 mr-2 text-primary" />
            Ver Prontuário Completo
          </Button>

          <div className="grid grid-cols-3 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPrescription}
              className="px-2 text-[11px] h-8 rounded-lg flex flex-col items-center justify-center gap-0.5"
              title="Receituário Médico"
            >
              <Pill className="size-3 text-emerald-600" />
              <span>Receita</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCertificate}
              className="px-2 text-[11px] h-8 rounded-lg flex flex-col items-center justify-center gap-0.5"
              title="Atestado Médico"
            >
              <Award className="size-3 text-amber-600" />
              <span>Atestado</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenExamRequest}
              className="px-2 text-[11px] h-8 rounded-lg flex flex-col items-center justify-center gap-0.5"
              title="Pedido de Exames"
            >
              <FileSpreadsheet className="size-3 text-sky-600" />
              <span>Exames</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
