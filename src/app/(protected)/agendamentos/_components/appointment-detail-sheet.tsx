"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Stethoscope,
  User,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { updateAppointmentStatus } from "@/actions/update-appointment-status";
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

import { WhatsAppReminderDialog } from "../../appointments/_components/whatsapp-reminder-dialog";

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
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const updateStatusAction = useAction(updateAppointmentStatus, {
    onSuccess: ({ data }) => {
      if (data?.patientConfirmedAt) {
        toast.success("Presença do paciente confirmada manualmente!", {
          description: "Registrado com sucesso no sistema da clínica.",
        });
      } else if (data?.status === "confirmed") {
        toast.success("Agendamento aceito com sucesso!", {
          description: "A vaga foi reservada na agenda da clínica.",
          action: {
            label: "Notificar Paciente",
            onClick: () => setReminderDialogOpen(true),
          },
        });
      } else if (data?.status === "cancelled") {
        toast.info("Agendamento recusado/cancelado.");
      }
      onOpenChange(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar status do agendamento.");
    },
  });

  if (!appointment) return null;

  const appointmentDate = new Date(appointment.date);
  const formattedDate = format(appointmentDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(appointmentDate, "HH:mm");

  const isPending = appointment.status === "pending";
  const isConfirmed = appointment.status === "confirmed";
  const isCancelled = appointment.status === "cancelled";
  const isPatientConfirmed = isConfirmed && Boolean(appointment.patientConfirmedAt);

  // Badge visual inteligente
  const getStatusBadge = () => {
    if (isPending) {
      return {
        label: "Aguardando Aprovação da Clínica",
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        icon: Clock,
      };
    }
    if (isCancelled) {
      return {
        label: "Cancelada / Recusada",
        className: "bg-destructive/15 text-destructive border-destructive/30",
        icon: XCircle,
      };
    }
    if (isPatientConfirmed) {
      return {
        label: "Confirmado pelo Paciente",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        icon: CheckCircle2,
      };
    }
    return {
      label: "Pendente Paciente (Aguardando Confirmação)",
      className: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-500/30",
      icon: Clock,
    };
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((appointment.appointmentPriceInCents || 0) / 100);

  const handleAccept = () => {
    updateStatusAction.execute({ id: appointment.id, status: "confirmed" });
  };

  const handleReject = () => {
    if (confirm("Tem certeza que deseja recusar este agendamento? O horário será liberado na agenda.")) {
      updateStatusAction.execute({ id: appointment.id, status: "cancelled" });
    }
  };

  const handleConfirmPatientPresenceManually = () => {
    updateStatusAction.execute({
      id: appointment.id,
      patientConfirmed: true,
    });
  };

  const handleRevertPatientPresence = () => {
    if (confirm("Deseja desmarcar a confirmação de presença deste paciente?")) {
      updateStatusAction.execute({
        id: appointment.id,
        patientConfirmed: false,
      });
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <SheetHeader className="text-left border-b pb-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={`gap-1 font-semibold ${statusBadge.className}`}>
                  <StatusIcon className="size-3.5" />
                  {statusBadge.label}
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

            {/* Aviso de Confirmação pelo Paciente */}
            {isConfirmed && (
              isPatientConfirmed ? (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/40 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Presença Confirmada pelo Paciente</p>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                        Confirmado em{" "}
                        <strong>
                          {format(new Date(appointment.patientConfirmedAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                    onClick={handleRevertPatientPresence}
                    disabled={updateStatusAction.isExecuting}
                    title="Desmarcar confirmação do paciente"
                  >
                    Desfazer
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <Clock className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 animate-pulse" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Aguardando Confirmação do Paciente</p>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        A vaga foi aceita. O paciente ainda não clicou no link de confirmação do WhatsApp.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shadow-xs cursor-pointer mt-1"
                    onClick={handleConfirmPatientPresenceManually}
                    disabled={updateStatusAction.isExecuting}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Confirmar Presença pelo Paciente (Manual)
                  </Button>
                </div>
              )
            )}

            {/* Aviso de Solicitação Pendente de Aprovação da Clínica */}
            {isPending && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="size-4 text-amber-600" />
                  Solicitação de Agendamento Online
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  O paciente solicitou este horário online. Clique em <strong>&quot;Aceitar Agendamento&quot;</strong> para confirmar a vaga ou <strong>&quot;Recusar&quot;</strong> para liberar o horário na agenda.
                </p>
              </div>
            )}

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

          <SheetFooter className="border-t pt-4 flex flex-col gap-2.5 sm:flex-col mt-6">
            {/* Se estiver pendente, exibe botões de Aceitar e Recusar */}
            {isPending && (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer"
                  onClick={handleAccept}
                  disabled={updateStatusAction.isExecuting}
                >
                  {updateStatusAction.isExecuting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4 stroke-[3]" />
                  )}
                  Aceitar Agendamento
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  className="w-full gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900 cursor-pointer text-xs font-semibold"
                  onClick={handleReject}
                  disabled={updateStatusAction.isExecuting}
                >
                  <X className="size-3.5" />
                  Recusar Agendamento
                </Button>
              </div>
            )}

            {/* Se estiver confirmado, exibe Iniciar Atendimento e WhatsApp */}
            {isConfirmed && (
              <>
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
                  type="button"
                  variant="outline"
                  className="w-full gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950/40 text-xs font-semibold"
                  onClick={() => setReminderDialogOpen(true)}
                >
                  <MessageCircle className="size-3.5" />
                  Notificar / Enviar WhatsApp
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:text-rose-600"
                  onClick={handleReject}
                  disabled={updateStatusAction.isExecuting}
                >
                  Cancelar Consulta
                </Button>
              </>
            )}

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

      {/* Diálogo de WhatsApp integrado */}
      <WhatsAppReminderDialog
        isOpen={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        appointment={appointment}
      />
    </>
  );
}
