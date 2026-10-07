"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  MoreVerticalIcon,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteAppointment } from "@/actions/delete-appointment";
import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appointmentsTable } from "@/db/schema";

import { WhatsAppReminderDialog } from "./whatsapp-reminder-dialog";

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    sex: "male" | "female";
  };
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
};

interface AppointmentsTableActionsProps {
  appointment: AppointmentWithRelations;
}

const AppointmentsTableActions = ({
  appointment,
}: AppointmentsTableActionsProps) => {
  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success("Agendamento deletado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao deletar agendamento.");
    },
  });

  // Função para gerar o link do WhatsApp com mensagem pronta
  const getWhatsAppUrl = () => {
    const cleanPhone = appointment.patient.phoneNumber.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const dateFormatted = format(
      new Date(appointment.date),
      "dd/MM/yyyy 'às' HH:mm",
      { locale: ptBR },
    );
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const statusUrl = `${origin}/agendar/${appointment.clinicId}/status/${appointment.id}`;
    const clinicName = appointment.clinic?.name || "nossa clínica";

    const message = `Olá, *${appointment.patient.name}*! 👋\n\nSua consulta na clínica *${clinicName}* com o(a) Dr(a). *${appointment.doctor.name}* (${appointment.doctor.specialty}) foi *CONFIRMADA*!\n\n📅 *Data e Horário:* ${dateFormatted}\n\nVocê pode acompanhar os detalhes e instruções no link abaixo:\n${statusUrl}\n\nEstamos te aguardando! 😊`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleOpenWhatsApp = () => {
    const url = getWhatsAppUrl();
    window.open(url, "_blank");
  };

  const updateStatusAction = useAction(updateAppointmentStatus, {
    onSuccess: ({ data }) => {
      if (data?.status === "confirmed") {
        toast.success(`Agendamento de ${appointment.patient.name} foi confirmado!`, {
          action: {
            label: "Notificar no WhatsApp",
            onClick: handleOpenWhatsApp,
          },
        });
      } else if (data?.status === "cancelled") {
        toast.info(`Agendamento de ${appointment.patient.name} foi recusado/cancelado.`);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar status do agendamento.");
    },
  });

  const handleDeleteAppointmentClick = () => {
    if (!appointment) return;
    deleteAppointmentAction.execute({ id: appointment.id });
  };

  const handleConfirm = () => {
    updateStatusAction.execute({ id: appointment.id, status: "confirmed" });
  };

  const handleCancel = () => {
    updateStatusAction.execute({ id: appointment.id, status: "cancelled" });
  };

  const isPending = appointment.status === "pending";
  const isConfirmed = appointment.status === "confirmed";

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {/* Botão de WhatsApp inteligente com templates e link de confirmação */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold px-2.5 shadow-2xs"
        onClick={() => setReminderDialogOpen(true)}
        title="Enviar lembrete ou notificação via WhatsApp"
      >
        <MessageCircle className="size-3.5 fill-emerald-600/20 text-emerald-600 dark:text-emerald-400" />
        WhatsApp
      </Button>

      {/* Botões rápidos quando o agendamento estiver pendente */}
      {isPending && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold px-2.5 shadow-2xs"
            onClick={handleConfirm}
            disabled={updateStatusAction.isExecuting}
            title="Aceitar agendamento"
          >
            <Check className="size-3.5" /> Aceitar
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold px-2.5 shadow-2xs"
            onClick={handleCancel}
            disabled={updateStatusAction.isExecuting}
            title="Recusar agendamento"
          >
            <X className="size-3.5" /> Recusar
          </Button>
        </>
      )}

      {/* Menu dropdown com opções completas */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{appointment.patient.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleOpenWhatsApp} className="text-emerald-600 focus:text-emerald-700 font-medium">
            <MessageCircle className="mr-2 h-4 w-4" /> Notificar via WhatsApp
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              window.open(
                `${origin}/agendar/${appointment.clinicId}/status/${appointment.id}`,
                "_blank",
              );
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Ver Página de Status
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {appointment.status !== "confirmed" && (
            <DropdownMenuItem
              onClick={handleConfirm}
              disabled={updateStatusAction.isExecuting}
              className="text-emerald-600 focus:text-emerald-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Consulta
            </DropdownMenuItem>
          )}

          {appointment.status !== "cancelled" && (
            <DropdownMenuItem
              onClick={handleCancel}
              disabled={updateStatusAction.isExecuting}
              className="text-amber-600 focus:text-amber-700"
            >
              <XCircle className="mr-2 h-4 w-4" /> Recusar / Cancelar
            </DropdownMenuItem>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir permanentemente
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Tem certeza que deseja deletar esse agendamento?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser revertida. Isso irá deletar o agendamento
                  permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAppointmentClick}>
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <WhatsAppReminderDialog
        isOpen={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        appointment={appointment}
      />
    </div>
  );
};

export default AppointmentsTableActions;
