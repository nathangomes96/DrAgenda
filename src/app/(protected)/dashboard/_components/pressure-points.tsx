"use client";

import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  FileText,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PressurePointsProps {
  pressurePoints: {
    pendingAppointmentsCount: number;
    pendingAppointmentsToday: number;
    whatsappStatus: string;
    whatsappPhone: string | null;
  };
}

export function PressurePoints({ pressurePoints }: PressurePointsProps) {
  const isWhatsAppConnected = pressurePoints.whatsappStatus === "connected";
  const totalAlerts =
    (pressurePoints.pendingAppointmentsCount > 0 ? 1 : 0) +
    (!isWhatsAppConnected ? 1 : 0) +
    1; // prontuários

  return (
    <Card className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">
            Pontos de pressão
          </CardTitle>
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs"
          >
            {totalAlerts} {totalAlerts === 1 ? "item ativo" : "itens ativos"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          itens que requerem atenção da equipe ou afetam a receita
        </p>
      </div>

      {/* Lista de Alertas / Ações */}
      <div className="space-y-3.5">
        {/* Item 1: Agendamentos Pendentes de Confirmação */}
        <Link
          href="/appointments"
          className="group block rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:border-teal-500/40 hover:shadow-xs"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <CalendarClock className="size-5" />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Agendamentos a confirmar
                </span>
                <span className="flex size-5 items-center justify-center rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-300 font-bold text-[11px]">
                  {pressurePoints.pendingAppointmentsCount}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {pressurePoints.pendingAppointmentsToday > 0
                  ? `${pressurePoints.pendingAppointmentsToday} agendamento(s) para hoje aguardando aprovação da recepção.`
                  : "Pacientes que agendaram pelo link online aguardando confirmação."}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 pt-0.5">
                Ver agendamentos <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Item 2: Prontuários e Evoluções Clínicas */}
        <Link
          href="/patients"
          className="group block rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:border-teal-500/40 hover:shadow-xs"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <FileText className="size-5" />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Prontuários e Evoluções
                </span>
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                  ✓
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Mantenha a linha do tempo e anamnese dos pacientes sempre atualizadas após as consultas.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 pt-0.5">
                Acessar prontuários <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Item 3: Conexão do WhatsApp */}
        <Link
          href="/settings/clinic"
          className="group block rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:border-teal-500/40 hover:shadow-xs"
        >
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                isWhatsAppConnected
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
              )}
            >
              {isWhatsAppConnected ? (
                <MessageSquare className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  WhatsApp Automático
                </span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    isWhatsAppConnected
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  )}
                >
                  {isWhatsAppConnected ? "Conectado" : "Pendente"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isWhatsAppConnected
                  ? `Instância ativa (${pressurePoints.whatsappPhone || "WhatsApp conectado"}). Lembretes de 24h e 2h operando.`
                  : "Conecte o WhatsApp da clínica para disparar confirmações e lembretes anti no-show."}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 pt-0.5">
                {isWhatsAppConnected ? "Ver configurações" : "Conectar WhatsApp"} <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </Card>
  );
}
