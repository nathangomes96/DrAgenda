"use client";

import { useMemo, useState } from "react";
import { isSameDay, isWithinInterval, startOfDay, endOfDay, addDays } from "date-fns";
import { Bell, Check, Copy, ExternalLink, Filter, Link2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import AddAppointmentButton from "./add-appointment-button";
import { appointmentsTableColumns } from "./table-columns";
import { CalendarGrid } from "../../agendamentos/_components/calendar-grid";
import { QuickFiltersBar } from "../../agendamentos/_components/quick-filters-bar";

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    sex: "male" | "female";
  };
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
};

interface AppointmentsViewProps {
  clinicId: string;
  clinicName: string;
  clinicSlug?: string | null;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  appointments: AppointmentWithRelations[];
}

export function AppointmentsView({
  clinicId,
  clinicName,
  clinicSlug,
  patients,
  doctors,
  appointments,
}: AppointmentsViewProps) {
  // Modo de visualização: Grade por padrão
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [periodFilter, setPeriodFilter] = useState<"today" | "tomorrow" | "7days" | "custom">("7days");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | "all">("all");
  const [searchPatient, setSearchPatient] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [hasCopied, setHasCopied] = useState(false);

  const activeIdentifier = clinicSlug || clinicId;

  const pendingAppointments = appointments.filter(
    (a) => a.status === "pending",
  );

  // Filtragem multi-critério
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      // 1. Filtro por status
      if (statusFilter !== "all" && appointment.status !== statusFilter) {
        return false;
      }

      // 2. Filtro por médico
      if (selectedDoctorId !== "all" && appointment.doctorId !== selectedDoctorId) {
        return false;
      }

      // 3. Filtro por nome do paciente
      if (searchPatient.trim()) {
        const query = searchPatient.toLowerCase();
        const patientName = appointment.patient?.name?.toLowerCase() || "";
        if (!patientName.includes(query)) {
          return false;
        }
      }

      // 4. Filtro por período rápido (se estiver no modo de tabela ou filtrando período)
      if (periodFilter === "today") {
        const aptDate = new Date(appointment.date);
        if (!isSameDay(aptDate, new Date())) {
          return false;
        }
      } else if (periodFilter === "tomorrow") {
        const aptDate = new Date(appointment.date);
        const tomorrow = addDays(new Date(), 1);
        if (!isSameDay(aptDate, tomorrow)) {
          return false;
        }
      } else if (periodFilter === "7days") {
        const aptDate = new Date(appointment.date);
        const start = startOfDay(new Date());
        const end = endOfDay(addDays(new Date(), 7));
        if (aptDate < start || aptDate > end) {
          // Para visualização em tabela, restringe aos 7 dias
          // Na grade visual mantemos para navegação semanal
          if (viewMode === "table") {
            return false;
          }
        }
      }

      return true;
    });
  }, [appointments, statusFilter, selectedDoctorId, searchPatient, periodFilter, viewMode]);

  const handleCopyBookingLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const bookingUrl = `${origin}/agendar/${activeIdentifier}`;
    navigator.clipboard.writeText(bookingUrl);
    setHasCopied(true);
    toast.success("Link de agendamento online copiado com sucesso!", {
      description: "Você pode enviar este link no WhatsApp para seus pacientes.",
    });
    setTimeout(() => setHasCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-2xl border">
        <div>
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            Link Público de Agendamento da Clínica
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compartilhe este link com seus pacientes para que eles mesmos escolham médico e horário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBookingLink}
            className="gap-2 font-medium"
          >
            {hasCopied ? (
              <>
                <Check className="size-4 text-emerald-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar Link
              </>
            )}
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href={`/agendar/${activeIdentifier}`} target="_blank">
              Abrir Página
              <ExternalLink className="size-3" />
            </Link>
          </Button>

          <AddAppointmentButton patients={patients} doctors={doctors} />
        </div>
      </div>

      {/* Alerta de Agendamentos Pendentes */}
      {pendingAppointments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
              <Bell className="size-5 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Você tem {pendingAppointments.length} solicitação(ões) de agendamento aguardando aprovação!
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                Pacientes agendaram online. Clique em &quot;Aceitar&quot; para confirmar a vaga ou &quot;Recusar&quot; para liberar o horário.
              </p>
            </div>
          </div>

          {statusFilter !== "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatusFilter("pending")}
              className="border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-semibold whitespace-nowrap self-end sm:self-auto"
            >
              Ver Pendentes ({pendingAppointments.length})
            </Button>
          )}
        </div>
      )}

      {/* Barra de Filtros Rápidos (Idêntica à referência ClínicaSys) */}
      <QuickFiltersBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        periodFilter={periodFilter}
        onPeriodFilterChange={setPeriodFilter}
        selectedDoctorId={selectedDoctorId}
        onDoctorChange={setSelectedDoctorId}
        doctors={doctors}
        searchPatient={searchPatient}
        onSearchPatientChange={setSearchPatient}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Alternância entre Grade Semanal/Diária e Tabela */}
      {viewMode === "grid" ? (
        <CalendarGrid
          appointments={filteredAppointments}
          doctors={doctors}
        />
      ) : (
        <DataTable data={filteredAppointments} columns={appointmentsTableColumns} />
      )}
    </div>
  );
}
