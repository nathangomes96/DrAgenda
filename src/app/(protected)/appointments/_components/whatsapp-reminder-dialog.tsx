"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { sendEvolutionMessage } from "@/actions/whatsapp";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  build24hReminderMessage,
  buildApprovedAppointmentMessage,
  buildTodayReminderMessage,
  formatWhatsAppPhone,
  getQuickConfirmUrl,
} from "@/lib/whatsapp-templates";

interface WhatsAppReminderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    date: Date | string;
    clinicId: string;
    patient: {
      name: string;
      phoneNumber: string;
    };
    doctor: {
      name: string;
      specialty: string;
    };
    clinic?: {
      name: string;
      slug?: string | null;
    };
  };
}

export function WhatsAppReminderDialog({
  isOpen,
  onOpenChange,
  appointment,
}: WhatsAppReminderDialogProps) {
  const [templateType, setTemplateType] = useState<
    "reminder_24h" | "reminder_today" | "approved"
  >("reminder_24h");
  const [copied, setCopied] = useState(false);

  const notificationData = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return {
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.phoneNumber,
      doctorName: appointment.doctor.name,
      doctorSpecialty: appointment.doctor.specialty,
      clinicName: appointment.clinic?.name || "Clínica",
      clinicId: appointment.clinicId,
      clinicSlug: appointment.clinic?.slug,
      appointmentId: appointment.id,
      date: appointment.date,
      baseUrl: origin,
    };
  }, [appointment]);

  const messageText = useMemo(() => {
    switch (templateType) {
      case "reminder_24h":
        return build24hReminderMessage(notificationData);
      case "reminder_today":
        return buildTodayReminderMessage(notificationData);
      case "approved":
        return buildApprovedAppointmentMessage(notificationData);
      default:
        return build24hReminderMessage(notificationData);
    }
  }, [templateType, notificationData]);

  const quickConfirmUrl = useMemo(
    () => getQuickConfirmUrl(notificationData),
    [notificationData],
  );

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    toast.success("Mensagem do WhatsApp copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(quickConfirmUrl);
    toast.success("Link de confirmação rápida copiado!");
  };

  const handleSendWhatsApp = () => {
    const phone = formatWhatsAppPhone(appointment.patient.phoneNumber);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");
  };

  const sendEvolutionAction = useAction(sendEvolutionMessage, {
    onSuccess: () => {
      toast.success("Mensagem disparada automaticamente via Evolution API!");
      onOpenChange(false);
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError ||
          "Falha ao enviar via Evolution API. Você pode utilizar o botão 'Abrir no WhatsApp' como alternativa.",
      );
    },
  });

  const handleSendViaEvolution = () => {
    sendEvolutionAction.execute({
      appointmentId: appointment.id,
      templateType,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <MessageCircle className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Lembretes Anti No-Show via WhatsApp
            </span>
          </div>
          <DialogTitle className="text-lg">
            Enviar Notificação para {appointment.patient.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Envie mensagens automáticas com link de 1 clique para reduzir faltas (no-show) em até 80%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seletor de Modelo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Modelo de Mensagem</Label>
            <Select
              value={templateType}
              onValueChange={(val: any) => setTemplateType(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reminder_24h">
                  🔔 Lembrete 24h com Confirmação (Anti No-Show)
                </SelectItem>
                <SelectItem value="reminder_today">
                  ⚡ Lembrete do Dia (Hoje) com orientações
                </SelectItem>
                <SelectItem value="approved">
                  🎉 Notificação de Consulta Aprovada
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prévia da Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground">
                Prévia da Mensagem Formatada
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Para: {appointment.patient.phoneNumber}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/40 p-3">
              <Textarea
                readOnly
                value={messageText}
                rows={7}
                className="bg-transparent border-none p-0 text-xs font-sans resize-none focus-visible:ring-0 leading-relaxed shadow-none"
              />
            </div>
          </div>

          {/* Dica de boas práticas */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-600" />
              O link gerado permite confirmação instantânea pelo celular do paciente.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-emerald-700 hover:text-emerald-800"
              onClick={handleCopyLinkOnly}
            >
              Copiar só o link
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={handleCopyMessage}
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" /> Copiado
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copiar Texto
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleSendWhatsApp}
            title="Abrir WhatsApp Web manualmente"
          >
            <Send className="size-3.5" /> Abrir no Web
          </Button>

          <Button
            type="button"
            size="sm"
            className="text-xs gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md sm:ml-auto"
            onClick={handleSendViaEvolution}
            disabled={sendEvolutionAction.isExecuting}
          >
            {sendEvolutionAction.isExecuting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Disparando...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" /> Enviar via Evolution API
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
