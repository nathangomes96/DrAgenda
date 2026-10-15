"use client";

import { format } from "date-fns";
import { Clock, Play, User } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export const DOCTOR_COLOR_CLASSES = [
  {
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
    text: "text-blue-900 dark:text-blue-200",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
    badge: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  },
  {
    bg: "bg-pink-500/10 hover:bg-pink-500/20",
    text: "text-pink-900 dark:text-pink-200",
    border: "border-pink-500/30",
    dot: "bg-pink-500",
    badge: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
  },
  {
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
    text: "text-emerald-900 dark:text-emerald-200",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
  {
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  },
  {
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
    text: "text-purple-900 dark:text-purple-200",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
    badge: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  },
  {
    bg: "bg-teal-500/10 hover:bg-teal-500/20",
    text: "text-teal-900 dark:text-teal-200",
    border: "border-teal-500/30",
    dot: "bg-teal-500",
    badge: "bg-teal-500/20 text-teal-700 dark:text-teal-300",
  },
];

export function getDoctorColor(doctorId: string, doctorsList: any[] = []) {
  const index = doctorsList.findIndex((d) => d.id === doctorId);
  if (index === -1) {
    let hash = 0;
    for (let i = 0; i < doctorId.length; i++) {
      hash = doctorId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % DOCTOR_COLOR_CLASSES.length;
    return DOCTOR_COLOR_CLASSES[colorIndex];
  }
  return DOCTOR_COLOR_CLASSES[index % DOCTOR_COLOR_CLASSES.length];
}

interface AppointmentCardProps {
  appointment: any;
  doctors: any[];
  onClick: () => void;
}

export function AppointmentCard({
  appointment,
  doctors,
  onClick,
}: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.date);
  const startTime = format(appointmentDate, "HH:mm");
  // Consulta de 30min padrão para visualização de término
  const endDate = new Date(appointmentDate.getTime() + 30 * 60000);
  const endTime = format(endDate, "HH:mm");

  const colors = getDoctorColor(appointment.doctorId, doctors);

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg p-2 border transition-all text-xs shadow-xs relative group hover:shadow-md",
        colors.bg,
        colors.text,
        colors.border,
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded font-mono",
            colors.badge,
          )}
        >
          {startTime}-{endTime}
        </span>
        <span
          className={cn(
            "size-2 rounded-full shrink-0",
            appointment.status === "confirmed"
              ? appointment.patientConfirmedAt
                ? "bg-emerald-500"
                : "bg-yellow-400"
              : appointment.status === "cancelled"
              ? "bg-rose-500"
              : "bg-amber-500 animate-pulse",
          )}
          title={
            appointment.status === "confirmed"
              ? appointment.patientConfirmedAt
                ? "Consulta confirmada pelo paciente"
                : "Aprovado pela clínica (aguardando paciente)"
              : appointment.status === "cancelled"
              ? "Cancelado"
              : "Aguardando aprovação da clínica"
          }
        />
      </div>

      <div className="font-semibold truncate text-[11px] text-foreground">
        {appointment.patient?.name || "Paciente"}
      </div>

      <div className="text-[10px] text-muted-foreground truncate flex items-center justify-between mt-0.5">
        <span>Dr(a). {appointment.doctor?.name || "Médico"}</span>
      </div>

      {/* Botão de ação rápida ao passar o mouse */}
      <Link
        href={`/atendimento/${appointment.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-1.5 hidden group-hover:flex items-center justify-center gap-1 w-full py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] transition-colors"
      >
        <Play className="size-2.5 fill-current" />
        Atender
      </Link>
    </div>
  );
}
