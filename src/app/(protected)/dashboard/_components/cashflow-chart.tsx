"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";
import { cn } from "@/lib/utils";

dayjs.locale("pt-br");

interface CashflowChartProps {
  dailyAppointmentsData: {
    date: string;
    appointments: number;
    revenue: number;
  }[];
  cashflowSummary: {
    expectedRevenueInCents: number;
    confirmedRevenueInCents: number;
    cancelledRevenueInCents: number;
    averageTicketInCents: number;
  };
}

export function CashflowChart({
  dailyAppointmentsData,
  cashflowSummary,
}: CashflowChartProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const daysCount = period === "7d" ? 7 : period === "30d" ? 21 : 30;

  const chartData = useMemo(() => {
    // Gera os dias centrados em hoje
    const half = Math.floor(daysCount / 2);
    return Array.from({ length: daysCount }).map((_, index) => {
      const d = dayjs().subtract(half - index, "days");
      const dateStr = d.format("YYYY-MM-DD");
      const found = dailyAppointmentsData.find((item) => item.date === dateStr);

      const revenueInCents = Number(found?.revenue || 0);
      const appointments = found?.appointments || 0;

      return {
        dateStr,
        label: d.format("D MMM"),
        shortDate: d.format("DD/MM"),
        revenue: Math.round(revenueInCents / 100),
        appointments,
      };
    });
  }, [dailyAppointmentsData, daysCount]);

  const formatBRL = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <Card className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs space-y-6">
      {/* Header do Gráfico com Filtros 7d / 30d / 90d */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">
            Fluxo diário de caixa
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            entradas líquidas, previsões e movimentações realizadas
          </p>
        </div>

        {/* Pílulas de filtro de período */}
        <div className="inline-flex items-center rounded-xl bg-muted/60 p-1 border border-border/50">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                period === p
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Os 4 KPIs do Fluxo de Caixa (estilo ClinicSuite) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Receita Prevista */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Receita Prevista
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-foreground">
            {formatBRL(cashflowSummary.expectedRevenueInCents)}
          </p>
        </div>

        {/* KPI 2: Pago / Confirmado */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
            Confirmado / Pago
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400">
            {formatBRL(cashflowSummary.confirmedRevenueInCents)}
          </p>
        </div>

        {/* KPI 3: Canceladas / Perdas */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-rose-500 uppercase">
            Canceladas
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-500">
            {formatBRL(cashflowSummary.cancelledRevenueInCents)}
          </p>
        </div>

        {/* KPI 4: Ticket Médio */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Ticket Médio
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-foreground">
            {formatBRL(cashflowSummary.averageTicketInCents)}
          </p>
        </div>
      </div>

      {/* Gráfico Recharts com Curva Suave e Gradiente Esmeralda */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
            <XAxis
              dataKey="shortDate"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
              tickFormatter={(v) => `R$ ${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                      <p className="font-bold text-foreground">{data.label}</p>
                      <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                        <span className="size-2 rounded-full bg-teal-500" />
                        <span>Faturamento: <strong>R$ {data.revenue.toLocaleString("pt-BR")}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2 rounded-full bg-slate-400" />
                        <span>Consultas: <strong>{data.appointments}</strong></span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0d9488"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#cashflowGradient)"
              dot={{ r: 3, fill: "#0d9488" }}
              activeDot={{ r: 6, fill: "#0d9488", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda do Gráfico */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/40 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 bg-teal-600 rounded-full" />
          <span>Faturamento Diário</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-teal-500/30 border border-teal-600" />
          <span>Ponto de Movimentação</span>
        </span>
      </div>
    </Card>
  );
}
