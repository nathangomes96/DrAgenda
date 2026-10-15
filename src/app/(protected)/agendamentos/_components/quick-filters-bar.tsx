"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Search,
  User,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { getDoctorColor } from "./appointment-card";

export type PeriodFilterType = "today" | "tomorrow" | "7days" | "30days" | "custom" | "all";

interface QuickFiltersBarProps {
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  periodFilter: PeriodFilterType;
  onPeriodFilterChange: (period: PeriodFilterType) => void;
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (start: string, end: string) => void;
  selectedDoctorId: string | "all";
  onDoctorChange: (doctorId: string | "all") => void;
  doctors: any[];
  searchPatient: string;
  onSearchPatientChange: (text: string) => void;
  statusFilter: "all" | "pending" | "confirmed" | "cancelled";
  onStatusFilterChange: (status: "all" | "pending" | "confirmed" | "cancelled") => void;
}

export function QuickFiltersBar({
  viewMode,
  onViewModeChange,
  periodFilter,
  onPeriodFilterChange,
  startDate,
  endDate,
  onDateRangeChange,
  selectedDoctorId,
  onDoctorChange,
  doctors,
  searchPatient,
  onSearchPatientChange,
  statusFilter,
  onStatusFilterChange,
}: QuickFiltersBarProps) {
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="bg-card rounded-2xl border p-4 space-y-3.5 shadow-xs">
      {/* Linha 1: Controles de Busca, Status e Alternância de Visualização */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Período Rápido */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground px-2">
            Período:
          </span>
          <Button
            variant={periodFilter === "today" ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodFilterChange("today")}
            className="h-7 text-xs px-2.5 rounded-lg"
          >
            Hoje
          </Button>
          <Button
            variant={periodFilter === "tomorrow" ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodFilterChange("tomorrow")}
            className="h-7 text-xs px-2.5 rounded-lg"
          >
            Amanhã
          </Button>
          <Button
            variant={periodFilter === "7days" ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodFilterChange("7days")}
            className="h-7 text-xs px-2.5 rounded-lg"
          >
            7 dias
          </Button>
          <Button
            variant={periodFilter === "30days" ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodFilterChange("30days")}
            className="h-7 text-xs px-2.5 rounded-lg font-medium"
          >
            30 dias
          </Button>
          <Button
            variant={periodFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodFilterChange("all")}
            className="h-7 text-xs px-2 rounded-lg text-muted-foreground"
          >
            Todos
          </Button>
        </div>

        {/* Busca por Paciente */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchPatient}
            onChange={(e) => onSearchPatientChange(e.target.value)}
            placeholder="Buscar por nome do paciente..."
            className="pl-9 h-9 text-xs rounded-xl"
          />
          {searchPatient && (
            <button
              onClick={() => onSearchPatientChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filtro de Status */}
        <Select
          value={statusFilter}
          onValueChange={(val: any) => onStatusFilterChange(val)}
        >
          <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="pending">Aguardando</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        {/* Alternador de Modo de Visão: Grade x Tabela */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="h-7 text-xs gap-1.5 px-3 rounded-lg"
            title="Visualização em Grade Semanal/Diária"
          >
            <LayoutGrid className="size-3.5" />
            Grade
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("table")}
            className="h-7 text-xs gap-1.5 px-3 rounded-lg"
            title="Visualização em Lista / Tabela"
          >
            <List className="size-3.5" />
            Lista
          </Button>
        </div>
      </div>

      {/* Linha 1.5: Faixa de Data Personalizada e Indicador Ativo */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1.5 border-t border-border/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <Calendar className="size-3.5 text-primary" />
            Faixa de Data:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">De:</span>
            <input
              type="date"
              value={startDate || ""}
              onChange={(e) => onDateRangeChange(e.target.value, endDate || "")}
              className="h-7 text-xs px-2 rounded-lg bg-background border border-input text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary font-mono shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Até:</span>
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => onDateRangeChange(startDate || "", e.target.value)}
              className="h-7 text-xs px-2 rounded-lg bg-background border border-input text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary font-mono shadow-2xs"
            />
          </div>

          {startDate && endDate && (
            <Badge variant="secondary" className="text-[11px] font-mono font-medium px-2.5 py-0.5 bg-muted/80 text-foreground border">
              {formatDateDisplay(startDate)} a {formatDateDisplay(endDate)}
            </Badge>
          )}
        </div>

        {periodFilter === "custom" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPeriodFilterChange("7days")}
            className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
          >
            Resetar para 7 dias
          </Button>
        )}
      </div>

      {/* Linha 2: Chips Coloridos por Profissional (Médicos) */}
      {doctors.length > 0 && (
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
            <Users className="size-3.5" /> Profissionais:
          </span>

          <button
            onClick={() => onDoctorChange("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border",
              selectedDoctorId === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted border-border",
            )}
          >
            Todos ({doctors.length})
          </button>

          {doctors.map((doctor) => {
            const colors = getDoctorColor(doctor.id, doctors);
            const isSelected = selectedDoctorId === doctor.id;
            return (
              <button
                key={doctor.id}
                onClick={() => onDoctorChange(isSelected ? "all" : doctor.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : `${colors.bg} ${colors.text} ${colors.border} hover:opacity-90`,
                )}
              >
                <span className={cn("size-2 rounded-full", colors.dot)} />
                <span>Dr(a). {doctor.name}</span>
                {isSelected && <Check className="size-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
