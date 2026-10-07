"use client";

import { useState } from "react";
import { Check, CheckCircle2, ChevronRight, Clock, HelpCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { confirmPatientPresence } from "@/actions/confirm-patient-presence";
import { Button } from "@/components/ui/button";

interface ConfirmActionsProps {
  appointmentId: string;
  initialStatus: "pending" | "confirmed" | "cancelled";
  clinicIdentifier: string;
}

export function ConfirmActions({
  appointmentId,
  initialStatus,
  clinicIdentifier,
}: ConfirmActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  const { execute, isExecuting } = useAction(confirmPatientPresence, {
    onSuccess: ({ data }) => {
      if (data?.status) {
        setCurrentStatus(data.status as any);
        if (data.status === "confirmed") {
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

  if (currentStatus === "confirmed") {
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
            <Check className="size-6 stroke-[3]" />
          </div>
          <h3 className="font-bold text-base text-emerald-800 dark:text-emerald-300">
            Presença Confirmada!
          </h3>
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
            Este horário foi desmarcado a seu pedido. Caso queira escolher outra data ou horário, acesse a agenda online abaixo.
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

  return (
    <div className="space-y-3 pt-2">
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
