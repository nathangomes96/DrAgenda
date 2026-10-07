"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { appointmentsTable } from "@/db/schema";

import AppointmentsTableAction from "./table-action";

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

export const appointmentsTableColumns: ColumnDef<AppointmentWithRelations>[] = [
  {
    id: "patient",
    accessorKey: "patient.name",
    header: "Paciente",
    cell: (params) => {
      const patient = params.row.original.patient;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{patient.name}</span>
          <span className="text-xs text-muted-foreground">{patient.phoneNumber}</span>
        </div>
      );
    },
  },
  {
    id: "doctor",
    accessorKey: "doctor.name",
    header: "Médico",
    cell: (params) => {
      const appointment = params.row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{appointment.doctor.name}</span>
          <span className="text-xs text-muted-foreground">{appointment.doctor.specialty}</span>
        </div>
      );
    },
  },
  {
    id: "date",
    accessorKey: "date",
    header: "Data e Hora",
    cell: (params) => {
      const appointment = params.row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {format(new Date(appointment.date), "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {format(new Date(appointment.date), "HH:mm", { locale: ptBR })}
          </span>
        </div>
      );
    },
  },
  {
    id: "price",
    accessorKey: "appointmentPriceInCents",
    header: "Valor",
    cell: (params) => {
      const appointment = params.row.original;
      const price = appointment.appointmentPriceInCents / 100;
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price);
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: (params) => {
      const status = params.row.original.status;
      if (status === "pending") {
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 gap-1 font-semibold text-xs py-0.5">
            <Clock className="size-3 text-amber-700 dark:text-amber-400 animate-pulse" />
            Pendente
          </Badge>
        );
      }
      if (status === "confirmed") {
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 gap-1 font-semibold text-xs py-0.5">
            <CheckCircle2 className="size-3 text-emerald-700 dark:text-emerald-400" />
            Confirmado
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1 text-xs py-0.5">
          <XCircle className="size-3 text-muted-foreground" />
          Cancelado
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: (params) => {
      const appointment = params.row.original;
      return <AppointmentsTableAction appointment={appointment} />;
    },
  },
];
