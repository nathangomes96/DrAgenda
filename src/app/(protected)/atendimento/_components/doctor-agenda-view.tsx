"use client";

import { useMemo, useState } from "react";
import { format, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  LayoutGrid,
  List,
  Play,
  Search,
  Sparkles,
  Stethoscope,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { CalendarGrid } from "../../agendamentos/_components/calendar-grid";

interface DoctorAgendaViewProps {
  doctor: any;
  allDoctors: any[];
  appointments: any[];
  patients: any[];
  userRole: string;
}

export function DoctorAgendaView({
  doctor,
  allDoctors,
  appointments,
  patients,
  userRole,
}: DoctorAgendaViewProps) {
  const [activeTab, setActiveTab] = useState<string>("today");
  const [patientSearch, setPatientSearch] = useState<string>("");

  const today = new Date();
  const todayFormatted = format(today, "EEEE, dd 'de' MMMM", { locale: ptBR });

  // Consultas de hoje
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((apt) => isToday(new Date(apt.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  // Estatísticas do dia
  const stats = useMemo(() => {
    const totalToday = todayAppointments.length;
    const confirmed = todayAppointments.filter((a) => a.status === "confirmed").length;
    const pending = todayAppointments.filter((a) => a.status === "pending").length;
    return { totalToday, confirmed, pending };
  }, [todayAppointments]);

  // Filtro de busca de paciente avulso
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return [];
    const query = patientSearch.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.phoneNumber?.includes(query) ||
          p.cpf?.includes(query),
      )
      .slice(0, 5);
  }, [patients, patientSearch]);

  return (
    <div className="space-y-6">
      {/* Banner de Boas-vindas e Resumo do Dia */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium">
              <Stethoscope className="size-3.5" />
              <span>Espaço do Médico · Consultório Digital</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Olá, Dr(a). {doctor?.name || "Médico"}!
            </h2>
            <p className="text-emerald-100 text-xs md:text-sm capitalize">
              {todayFormatted} · {doctor?.specialty || "Clínica Geral"}
            </p>
          </div>

          {/* Cards de Métricas Rápidas */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[90px]">
              <div className="text-2xl font-black">{stats.totalToday}</div>
              <div className="text-[11px] text-emerald-100 uppercase tracking-wider font-semibold">
                Hoje
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[90px]">
              <div className="text-2xl font-black text-amber-200">{stats.pending}</div>
              <div className="text-[11px] text-emerald-100 uppercase tracking-wider font-semibold">
                Aguardando
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[90px]">
              <div className="text-2xl font-black text-emerald-200">{stats.confirmed}</div>
              <div className="text-[11px] text-emerald-100 uppercase tracking-wider font-semibold">
                Confirmados
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Busca Rápida para Iniciar Atendimento de Qualquer Paciente */}
      <div className="bg-card p-4 rounded-2xl border shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Search className="size-4 text-emerald-600" />
            <span>Atendimento Avulso / Busca Rápida de Paciente</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Localize qualquer paciente da clínica para iniciar o atendimento imediatamente
          </span>
        </div>

        <div className="relative">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Digite o nome, CPF ou telefone do paciente para atender..."
            className="pl-10 h-10 text-xs rounded-xl"
          />
        </div>

        {/* Resultados da busca rápida */}
        {filteredPatients.length > 0 && (
          <div className="divide-y divide-border border rounded-xl overflow-hidden bg-muted/20 animate-in fade-in">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-emerald-600/10 text-emerald-600 font-bold flex items-center justify-center text-xs">
                    {patient.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground">
                      {patient.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      CPF: {patient.cpf || "Não informado"} · Tel:{" "}
                      {patient.phoneNumber || "Sem telefone"}
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5"
                >
                  <Link href={`/atendimento/avulso?patientId=${patient.id}`}>
                    <Play className="size-3 fill-current" />
                    Atender Paciente
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abas: Fila do Dia (Hoje) x Agenda Completa */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="today" className="text-xs gap-2 px-4 rounded-lg">
              <Clock className="size-3.5" />
              Fila do Dia ({todayAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="agenda" className="text-xs gap-2 px-4 rounded-lg">
              <Calendar className="size-3.5" />
              Agenda Semanal Completa
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Conteúdo Aba 1: Fila do Dia */}
        <TabsContent value="today" className="space-y-4 m-0">
          {todayAppointments.length === 0 ? (
            <Card className="border-dashed py-12 text-center rounded-2xl">
              <CardContent className="space-y-3">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-500" />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Nenhuma consulta agendada para hoje!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Você está com a agenda livre no momento. Se um paciente chegar de encaixe,
                  use o campo de busca acima para iniciar o atendimento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAppointments.map((apt) => {
                const aptDate = new Date(apt.date);
                const time = format(aptDate, "HH:mm");
                const isConfirmed = apt.status === "confirmed";
                const isCancelled = apt.status === "cancelled";

                return (
                  <Card
                    key={apt.id}
                    className={cn(
                      "rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden",
                      isConfirmed && "border-emerald-500/40 bg-emerald-500/[0.02]",
                      isCancelled && "opacity-60",
                    )}
                  >
                    <CardHeader className="p-4 pb-2 border-b bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-foreground">
                          <Clock className="size-3.5 text-primary" />
                          <span>{time}h</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold",
                            isConfirmed
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : isCancelled
                              ? "bg-rose-500/15 text-rose-700 border-rose-500/30"
                              : "bg-amber-500/15 text-amber-700 border-amber-500/30",
                          )}
                        >
                          {isConfirmed ? "Confirmada" : isCancelled ? "Cancelada" : "Pendente"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                          {apt.patient?.name?.slice(0, 2).toUpperCase() || "PA"}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {apt.patient?.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {apt.patient?.phoneNumber || "Sem telefone"}
                          </p>
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t pt-2">
                        <span>Procedimento:</span>
                        <span className="font-medium text-foreground">Consulta Médica</span>
                      </div>
                    </CardContent>

                    <div className="p-4 pt-0">
                      <Button
                        asChild
                        disabled={isCancelled}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-xl shadow-xs"
                      >
                        <Link href={`/atendimento/${apt.id}`}>
                          <Play className="size-3.5 fill-current" />
                          Iniciar Atendimento Clínico
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Conteúdo Aba 2: Grade Completa da Agenda */}
        <TabsContent value="agenda" className="m-0">
          <CalendarGrid appointments={appointments} doctors={allDoctors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
