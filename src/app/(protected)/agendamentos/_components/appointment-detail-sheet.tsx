"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  Play,
  Stethoscope,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AppointmentDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any | null;
}

export function AppointmentDetailSheet({
  isOpen,
  onOpenChange,
  appointment,
}: AppointmentDetailSheetProps) {
  if (!appointment) return null;

  const appointmentDate = new Date(appointment.date);
  const formattedDate = format(appointmentDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(appointmentDate, "HH:mm");

  const statusConfig = {
    pending: {
      label: "Aguardando Confirmação",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
    confirmed: {
      label: "Consulta Confirmada",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    },
  }[appointment.status as "pending" | "confirmed" | "cancelled"] || {
    label: appointment.status,
    className: "bg-muted text-muted-foreground",
  };

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((appointment.appointmentPriceInCents || 0) / 100);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col justify-between">
        <div className="space-y-6">
          <SheetHeader className="text-left border-b pb-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                #{appointment.code || appointment.id.slice(0, 8)}
              </span>
            </div>
            <SheetTitle className="text-xl pt-2">
              Detalhes da Consulta
            </SheetTitle>
            <SheetDescription className="capitalize">
              {formattedDate} às {formattedTime}h
            </SheetDescription>
          </SheetHeader>

          {/* Dados do Paciente */}
          <div className="bg-muted/40 p-3.5 rounded-xl border space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {appointment.patient?.name?.slice(0, 2).toUpperCase() || "PA"}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-sm truncate">
                  {appointment.patient?.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {appointment.patient?.sex === "male" ? "Masculino" : "Feminino"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1 text-xs text-muted-foreground">
              {appointment.patient?.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-primary shrink-0" />
                  <span>{appointment.patient.phoneNumber}</span>
                </div>
              )}
              {appointment.patient?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{appointment.patient.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Médico e Procedimento */}
          <div className="bg-muted/40 p-3.5 rounded-xl border space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Stethoscope className="size-3.5 text-primary" /> Profissional:
              </span>
              <span className="font-semibold text-foreground">
                Dr(a). {appointment.doctor?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Especialidade:</span>
              <span className="font-medium text-foreground">
                {appointment.doctor?.specialty || "Clínica Geral"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Valor da Consulta:</span>
              <span className="font-bold text-sm text-foreground">
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t pt-4 flex flex-col gap-2 sm:flex-col">
          {/* Botão de Destaque: Iniciar Atendimento */}
          <Button
            asChild
            size="lg"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md"
          >
            <Link href={`/atendimento/${appointment.id}`}>
              <Play className="size-4 fill-current" />
              Iniciar Atendimento Clínico
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
