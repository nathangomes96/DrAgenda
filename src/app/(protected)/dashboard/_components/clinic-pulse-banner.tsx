"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  LineChart,
  Package,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";

interface ClinicPulseBannerProps {
  clinicName: string;
  todayStats: {
    total: number;
    confirmed: number;
    pending: number;
    expectedRevenueInCents: number;
    confirmedRevenueInCents: number;
    confirmationRate: number;
  };
  monthStats: {
    confirmedRevenueInCents: number;
    appointmentsCount: number;
  };
  pending30dStats: {
    revenueInCents: number;
    count: number;
  };
  totalPatients: number;
  totalDoctors: number;
}

export function ClinicPulseBanner({
  clinicName,
  todayStats,
  monthStats,
  pending30dStats,
  totalPatients,
  totalDoctors,
}: ClinicPulseBannerProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const hasPendingToday = todayStats.pending > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-[#0d3438] via-[#092225] to-[#061719] p-6 sm:p-8 text-white shadow-xl">
      {/* Glow de ambientação no canto superior direito */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
        {/* Lado Esquerdo: Diagnóstico do Pulso da Clínica */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold tracking-wide text-teal-300 backdrop-blur-md border border-white/10">
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            <span>PULSO DA CLÍNICA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {hasPendingToday
              ? `${todayStats.pending} atendimento${todayStats.pending > 1 ? "s" : ""} sem confirmação hoje.`
              : "Nenhum atendimento sem confirmação até amanhã."}
          </h2>

          <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl leading-relaxed">
            A receita prevista hoje é{" "}
            <strong className="text-white">
              {formatCurrency(todayStats.expectedRevenueInCents)}
            </strong>{" "}
            e o time já confirmou{" "}
            <strong className="text-emerald-300">
              {todayStats.confirmationRate}%
            </strong>
            . Resolva os pontos abertos para fechar o dia operacional sem
            ajustes e manter a ocupação máxima.
          </p>

          {/* Chips de Métricas Operacionais */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 py-1.5 text-xs text-white/90 border border-white/10 backdrop-blur-xs">
              <Calendar className="size-3.5 text-teal-300" />
              <span>{todayStats.total} consultas hoje</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 py-1.5 text-xs text-white/90 border border-white/10 backdrop-blur-xs">
              <Users className="size-3.5 text-teal-300" />
              <span>{totalPatients} pacientes ativos</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 py-1.5 text-xs text-white/90 border border-white/10 backdrop-blur-xs">
              <Stethoscope className="size-3.5 text-teal-300" />
              <span>{totalDoctors} especialistas</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 py-1.5 text-xs text-white/90 border border-white/10 backdrop-blur-xs">
              <DollarSign className="size-3.5 text-emerald-400" />
              <span>previsto {formatCurrency(todayStats.expectedRevenueInCents)}</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: 2 Mini Cards translúcidos flutuantes */}
        <div className="flex flex-col gap-3">
          {/* Card 1: Faturamento do Mês */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5 backdrop-blur-md shadow-xs flex items-center justify-between gap-4 transition-all hover:bg-white/[0.09]">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-teal-300 uppercase flex items-center gap-1.5">
                <LineChart className="size-3.5 text-teal-400" />
                PAGO · MÊS ATUAL
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-white">
                {formatCurrency(monthStats.confirmedRevenueInCents)}
              </p>
              <p className="text-[11px] text-teal-100/60">
                {monthStats.appointmentsCount} consultas confirmadas
              </p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
              <TrendingUp className="size-5" />
            </div>
          </div>

          {/* Card 2: A Receber / Pendente 30D */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5 backdrop-blur-md shadow-xs flex items-center justify-between gap-4 transition-all hover:bg-white/[0.09]">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-400" />
                A RECEBER · 30D
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-white">
                {formatCurrency(pending30dStats.revenueInCents)}
              </p>
              <p className="text-[11px] text-teal-100/60">
                {pending30dStats.count} agendamentos pendentes
              </p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Clock className="size-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
