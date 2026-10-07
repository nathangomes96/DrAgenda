"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  LayoutDashboard,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

import { appointmentsTableColumns } from "../../appointments/_components/table-columns";
import { CashflowChart } from "./cashflow-chart";
import { ClinicPulseBanner } from "./clinic-pulse-banner";
import { DatePicker } from "./date-picker";
import { PressurePoints } from "./pressure-points";
import TopDoctors from "./top-doctors";
import TopSpecialties from "./top-specialties";

interface DashboardViewProps {
  userName: string;
  clinicName: string;
  dashboardData: any;
}

export function DashboardView({
  userName,
  clinicName,
  dashboardData,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"gestao" | "operacoes">("gestao");

  // Saudação com base na hora local
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Bom dia"
      : currentHour < 18
      ? "Boa tarde"
      : "Boa noite";

  const firstName = userName ? userName.split(" ")[0] : "Doutor(a)";
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  const {
    todayStats,
    monthStats,
    pending30dStats,
    totalPatients,
    totalDoctors,
    dailyAppointmentsData,
    cashflowSummary,
    pressurePoints,
    todayAppointments,
    topDoctors,
    topSpecialties,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header Principal: Saudação e Alternador de Visão (Gestão vs Operações) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 capitalize-first">
            {todayFormatted} ·{" "}
            <strong className="text-foreground">{clinicName}</strong> tem{" "}
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              {todayStats.confirmed} consultas confirmadas
            </span>{" "}
            e{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {pressurePoints.pendingAppointmentsCount} pontos de atenção
            </span>
            .
          </p>
        </div>

        {/* Controles do Topo: Pílulas de Alternância e DatePicker */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Alternador de Visão: Gestão / Operações */}
          <div className="inline-flex items-center rounded-2xl bg-muted/60 p-1 border border-border/60 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("gestao")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer",
                activeTab === "gestao"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutDashboard className="size-3.5" />
              <span>Gestão</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("operacoes")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer",
                activeTab === "operacoes"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Activity className="size-3.5" />
              <span>Operações</span>
              {todayStats.total > 0 && (
                <span className="ml-1 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 px-1.5 py-0.2 text-[10px]">
                  {todayStats.total}
                </span>
              )}
            </button>
          </div>

          <DatePicker />
        </div>
      </div>

      {/* Banner Principal: PULSO DA CLÍNICA */}
      <ClinicPulseBanner
        clinicName={clinicName}
        todayStats={todayStats}
        monthStats={monthStats}
        pending30dStats={pending30dStats}
        totalPatients={totalPatients.total ?? 0}
        totalDoctors={totalDoctors.total ?? 0}
      />

      {/* CONTEÚDO DA VISÃO: GESTÃO */}
      {activeTab === "gestao" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Grid Principal: Fluxo Diário de Caixa (2/3) + Pontos de Pressão (1/3) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1fr]">
            <CashflowChart
              dailyAppointmentsData={dailyAppointmentsData}
              cashflowSummary={cashflowSummary}
            />
            <PressurePoints pressurePoints={pressurePoints} />
          </div>

          {/* Destaques Secundários: Especialistas e Especialidades */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TopDoctors doctors={topDoctors} />
            <TopSpecialties topSpecialties={topSpecialties} />
          </div>
        </div>
      )}

      {/* CONTEÚDO DA VISÃO: OPERAÇÕES (Agendamentos de Hoje) */}
      {activeTab === "operacoes" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Calendar className="size-5 text-teal-600 dark:text-teal-400" />
                  Agendamentos de Hoje
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lista completa dos pacientes e horários marcados para hoje
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs"
                >
                  {todayStats.confirmed} confirmadas
                </Badge>
                {todayStats.pending > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs"
                  >
                    {todayStats.pending} pendentes
                  </Badge>
                )}
              </div>
            </div>

            <DataTable
              data={todayAppointments}
              columns={appointmentsTableColumns}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
