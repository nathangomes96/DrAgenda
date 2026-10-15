"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AppointmentCard } from "./appointment-card";
import { AppointmentDetailSheet } from "./appointment-detail-sheet";

interface CalendarGridProps {
  appointments: any[];
  doctors: any[];
  onSelectSlot?: (date: Date) => void;
  targetDate?: Date;
}

// Horários exibidos na grade: das 07:00 às 20:00
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export function CalendarGrid({
  appointments,
  doctors,
  onSelectSlot,
  targetDate,
}: CalendarGridProps) {
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(targetDate || new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  useEffect(() => {
    if (targetDate) {
      setCurrentWeekDate(targetDate);
    }
  }, [targetDate]);

  // Calcula os 7 dias da semana atual (iniciando na Segunda-feira)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeekDate, { weekStartsOn: 1 }); // 1 = Segunda
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeekDate]);

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${format(start, "dd 'de' MMM", { locale: ptBR })} - ${format(
      end,
      "dd 'de' MMM 'de' yyyy",
      { locale: ptBR },
    )}`;
  }, [weekDays]);

  const handlePrevWeek = () => setCurrentWeekDate((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeekDate((prev) => addWeeks(prev, 1));
  const handleToday = () => setCurrentWeekDate(new Date());

  // Mapeia as consultas por dia e hora para renderização rápida
  const appointmentsByDayAndHour = useMemo(() => {
    const map = new Map<string, any[]>();

    appointments.forEach((apt) => {
      const aptDate = new Date(apt.date);
      const dayKey = format(aptDate, "yyyy-MM-dd");
      const hourKey = aptDate.getHours();
      const key = `${dayKey}_${hourKey}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(apt);
    });

    return map;
  }, [appointments]);

  return (
    <div className="bg-card rounded-2xl border shadow-xs overflow-hidden flex flex-col">
      {/* Barra de Navegação da Semana */}
      <div className="flex items-center justify-between p-3.5 border-b bg-muted/20">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
            className="size-8 rounded-lg"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs font-semibold px-2 capitalize">
            {weekRangeLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            className="size-8 rounded-lg"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleToday}
          className="text-xs h-8 px-3 rounded-lg font-medium"
        >
          Hoje
        </Button>
      </div>

      {/* Grade com scroll horizontal em telas menores */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-8 border-b bg-muted/30">
            {/* Coluna vazia para alinhar com os horários */}
            <div className="p-3 text-center border-r font-medium text-xs text-muted-foreground flex items-center justify-center">
              <Clock className="size-3.5 mr-1" /> Hora
            </div>

            {weekDays.map((day) => {
              const today = isToday(day);
              const dayName = format(day, "EEE", { locale: ptBR }).toUpperCase();
              const dayNumber = format(day, "dd");

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2.5 text-center border-r last:border-r-0 transition-colors",
                    today && "bg-primary/10",
                  )}
                >
                  <div
                    className={cn(
                      "text-[10px] font-bold tracking-wider",
                      today ? "text-primary font-extrabold" : "text-muted-foreground",
                    )}
                  >
                    {dayName}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-extrabold mt-0.5 inline-flex items-center justify-center size-6 rounded-full",
                      today && "bg-primary text-primary-foreground",
                    )}
                  >
                    {dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linhas de Horários e Células dos Dias */}
          <div className="divide-y divide-border">
            {HOURS.map((hour) => {
              const hourLabel = `${hour.toString().padStart(2, "0")}:00`;

              return (
                <div key={hour} className="grid grid-cols-8 min-h-[76px]">
                  {/* Coluna de Horário */}
                  <div className="border-r p-2 text-center text-xs font-mono font-medium text-muted-foreground bg-muted/10 flex items-start justify-center pt-2">
                    {hourLabel}
                  </div>

                  {/* Células para cada dia da semana */}
                  {weekDays.map((day) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const slotKey = `${dayKey}_${hour}`;
                    const slotAppointments = appointmentsByDayAndHour.get(slotKey) || [];
                    const today = isToday(day);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "border-r last:border-r-0 p-1.5 transition-colors relative flex flex-col gap-1.5",
                          today && "bg-primary/[0.02]",
                          "hover:bg-muted/40",
                        )}
                      >
                        {slotAppointments.map((apt) => (
                          <AppointmentCard
                            key={apt.id}
                            appointment={apt}
                            doctors={doctors}
                            onClick={() => setSelectedAppointment(apt)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Painel lateral de detalhes da consulta com ação de iniciar atendimento */}
      <AppointmentDetailSheet
        isOpen={Boolean(selectedAppointment)}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
    </div>
  );
}
