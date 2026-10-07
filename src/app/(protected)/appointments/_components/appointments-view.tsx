"use client";

import { Bell, Check, Copy, ExternalLink, Filter, Link2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import AddAppointmentButton from "./add-appointment-button";
import { appointmentsTableColumns } from "./table-columns";

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
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [hasCopied, setHasCopied] = useState(false);

  const activeIdentifier = clinicSlug || clinicId;

  const pendingAppointments = appointments.filter(
    (a) => a.status === "pending",
  );
  const confirmedAppointments = appointments.filter(
    (a) => a.status === "confirmed",
  );
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled",
  );

  const filteredAppointments = appointments.filter((appointment) => {
    if (selectedFilter === "pending") return appointment.status === "pending";
    if (selectedFilter === "confirmed") return appointment.status === "confirmed";
    if (selectedFilter === "cancelled") return appointment.status === "cancelled";
    return true;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in">
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

          {selectedFilter !== "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedFilter("pending")}
              className="border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-semibold whitespace-nowrap self-end sm:self-auto"
            >
              Ver Pendentes ({pendingAppointments.length})
            </Button>
          )}
        </div>
      )}

      {/* Filtros em Abas */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mr-2">
          <Filter className="size-3.5" /> Filtrar:
        </span>

        <Button
          variant={selectedFilter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedFilter("all")}
          className="h-8 gap-1.5 text-xs font-medium rounded-full"
        >
          Todos
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {appointments.length}
          </Badge>
        </Button>

        <Button
          variant={selectedFilter === "pending" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedFilter("pending")}
          className="h-8 gap-1.5 text-xs font-medium rounded-full"
        >
          Pendentes
          <Badge
            className={
              pendingAppointments.length > 0
                ? "bg-amber-500 text-white px-1.5 py-0 text-[10px]"
                : "bg-muted text-muted-foreground px-1.5 py-0 text-[10px]"
            }
          >
            {pendingAppointments.length}
          </Badge>
        </Button>

        <Button
          variant={selectedFilter === "confirmed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedFilter("confirmed")}
          className="h-8 gap-1.5 text-xs font-medium rounded-full"
        >
          Confirmados
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {confirmedAppointments.length}
          </Badge>
        </Button>

        <Button
          variant={selectedFilter === "cancelled" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedFilter("cancelled")}
          className="h-8 gap-1.5 text-xs font-medium rounded-full"
        >
          Cancelados
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {cancelledAppointments.length}
          </Badge>
        </Button>
      </div>

      {/* Tabela de Agendamentos */}
      <DataTable data={filteredAppointments} columns={appointmentsTableColumns} />
    </div>
  );
}
