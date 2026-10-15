"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CheckCircle2, ChevronRight, Clock, HelpCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { confirmPatientPresence } from "@/actions/confirm-patient-presence";
import { Button } from "@/components/ui/button";

interface ConfirmActionsProps {
  appointmentId: string;
  initialStatus: "pending" | "confirmed" | "cancelled";
  initialPatientConfirmedAt?: Date | string | null;
  clinicIdentifier: string;
}

export function ConfirmActions({
  appointmentId,
  initialStatus,
  initialPatientConfirmedAt,
  clinicIdentifier,
}: ConfirmActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [patientConfirmedAt, setPatientConfirmedAt] = useState<Date | string | null>(
    initialPatientConfirmedAt || null,
  );

  const { execute, isExecuting } = useAction(confirmPatientPresence, {
    onSuccess: ({ data }) => {
      if (data?.status) {
        setCurrentStatus(data.status as any);
        if (data.status === "confirmed") {
          setPatientConfirmedAt(data.patientConfirmedAt || new Date());
          toast.success("Presença confirmada com sucesso! A clínica já foi informada.");
        } else {
          toast.info("Consulta desmarcada com sucesso.");
        }
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar confirmação.");
    },
  });

  const handleConfirm = () => {
    execute({ appointmentId, action: "confirm" });
  };

  const handleCancel = () => {
    if (confirm("Tem certeza que deseja cancelar seu horário nesta data?")) {
      execute({ appointmentId, action: "cancel_request" });
    }
  };

  // Se a consulta ainda estiver pendente de aprovação pela clínica
  if (currentStatus === "pending") {
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
            <Clock className="size-6 stroke-[2.5] animate-pulse" />
          </div>
          <h3 className="font-bold text-base text-amber-800 dark:text-amber-300">
            Aguardando Aprovação da Clínica
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Sua solicitação de agendamento está sendo avaliada pela equipe da clínica. Assim que a clínica aprovar a vaga, você receberá a notificação para confirmar seu comparecimento.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full text-xs gap-1.5">
          <Link href={`/agendar/${clinicIdentifier}/status/${appointmentId}`}>
            Acompanhar Status da Consulta <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  // Se já foi cancelado
  if (currentStatus === "cancelled") {
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-md">
            <XCircle className="size-6 stroke-[3]" />
          </div>
          <h3 className="font-bold text-base text-rose-800 dark:text-rose-300">
            Horário Cancelado
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Este horário foi cancelado. Caso queira escolher outra data ou horário, acesse a agenda online abaixo.
          </p>
        </div>

        <Button asChild className="w-full font-bold shadow-md">
          <Link href={`/agendar/${clinicIdentifier}`}>
            Agendar Novo Horário
          </Link>
        </Button>
      </div>
    );
  }

  // Se a clínica já aprovou E o paciente já confirmou presença
  if (currentStatus === "confirmed" && patientConfirmedAt) {
    const formattedConfirmDate = format(
      new Date(patientConfirmedAt),
      "dd/MM/yyyy 'às' HH:mm",
      { locale: ptBR },
    );

    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
            <Check className="size-6 stroke-[3]" />
          </div>
          <h3 className="font-bold text-base text-emerald-800 dark:text-emerald-300">
            Presença Confirmada!
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            Confirmado por você em {formattedConfirmDate}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Agradecemos a sua confirmação. A equipe médica já está com seu horário reservado. Compareça com 10 minutos de antecedência.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full text-xs gap-1.5">
          <Link href={`/agendar/${clinicIdentifier}/status/${appointmentId}`}>
            Ver Detalhes do Agendamento <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  // Se a clínica já aprovou, mas o paciente ainda não confirmou presença:
  return (
    <div className="space-y-3 pt-2">
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium">
        ✨ A clínica aprovou seu agendamento! Por favor confirme seu comparecimento abaixo:
      </div>

      <Button
        onClick={handleConfirm}
        disabled={isExecuting}
        className="w-full h-12 text-base font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all hover:scale-[1.01]"
      >
        {isExecuting ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Confirmando...
          </>
        ) : (
          <>
            <CheckCircle2 className="size-5" /> Sim, Eu Vou Comparecer!
          </>
        )}
      </Button>

      <Button
        onClick={handleCancel}
        disabled={isExecuting}
        variant="ghost"
        className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5"
      >
        Não poderei comparecer / Cancelar
      </Button>
    </div>
  );
}
