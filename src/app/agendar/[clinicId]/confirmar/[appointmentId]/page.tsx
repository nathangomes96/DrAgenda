import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClinicByIdOrSlug } from "@/data/get-clinic-by-id-or-slug";
import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { normalizeAppointmentCodeQuery } from "@/helpers/appointment-code";

import { ConfirmActions } from "./_components/confirm-actions";

interface ConfirmPageProps {
  params: Promise<{
    clinicId: string;
    appointmentId: string;
  }>;
}

function buildAppointmentLookupCondition(rawId: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
  const normalized = normalizeAppointmentCodeQuery(rawId);

  const conditions = [
    isUuid ? eq(appointmentsTable.id, rawId) : undefined,
    eq(appointmentsTable.code, normalized.upper),
    normalized.withPrefix ? eq(appointmentsTable.code, normalized.withPrefix) : undefined,
  ].filter(Boolean) as any[];

  return conditions.length === 1 ? conditions[0] : or(...conditions);
}

export async function generateMetadata({
  params,
}: ConfirmPageProps): Promise<Metadata> {
  const { appointmentId } = await params;
  const whereCondition = buildAppointmentLookupCondition(appointmentId);

  const appointment = await db.query.appointmentsTable.findFirst({
    where: whereCondition,
    with: {
      clinic: true,
      doctor: true,
    },
  });

  if (!appointment) {
    return {
      title: "Confirmação de Consulta | Doutor Agenda",
    };
  }

  return {
    title: `Confirmar Presença - ${appointment.clinic.name} | Doutor Agenda`,
    description: `Confirme sua presença na consulta com o(a) Dr(a). ${appointment.doctor.name}.`,
  };
}

export default async function ConfirmAppointmentPage({
  params,
}: ConfirmPageProps) {
  const { clinicId, appointmentId } = await params;

  const clinic = await getClinicByIdOrSlug(clinicId);
  if (!clinic) {
    notFound();
  }

  const whereCondition = buildAppointmentLookupCondition(appointmentId);

  const appointment = await db.query.appointmentsTable.findFirst({
    where: whereCondition,
    with: {
      doctor: true,
      patient: true,
      clinic: true,
    },
  });

  if (!appointment || appointment.clinicId !== clinic.id) {
    notFound();
  }

  const appointmentDate = new Date(appointment.date);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <Card className="border-2 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b pb-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">
              Confirmação de Presença
            </CardTitle>
            <CardDescription className="text-xs">
              {clinic.name} solicita sua confirmação para o horário agendado.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-6 text-sm">
            {/* Paciente */}
            <div className="flex items-center justify-between border-b pb-3 text-xs">
              <span className="text-muted-foreground">Paciente</span>
              <span className="font-bold text-foreground">
                {appointment.patient.name}
              </span>
            </div>

            {/* Especialista */}
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Stethoscope className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground block">
                  Profissional
                </span>
                <p className="font-bold text-foreground truncate">
                  {appointment.doctor.name}
                </p>
                <p className="text-xs text-primary font-medium">
                  {appointment.doctor.specialty}
                </p>
              </div>
            </div>

            {/* Data e Horário em Destaque */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center space-y-1">
              <span className="text-xs text-primary font-semibold uppercase tracking-wider block">
                Horário da sua consulta
              </span>
              <p className="text-2xl font-black text-foreground">
                {format(appointmentDate, "HH:mm", { locale: ptBR })}
              </p>
              <p className="text-xs font-medium text-muted-foreground capitalize">
                {format(appointmentDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>

            {/* Local de Atendimento */}
            <div className="rounded-lg bg-muted/60 p-3 space-y-1 border text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Local
              </span>
              <p className="font-medium">{clinic.name}</p>
              <p className="text-muted-foreground text-[11px]">
                Compareça com 10 minutos de antecedência.
              </p>
            </div>

            {/* Ações de Confirmação */}
            <ConfirmActions
              appointmentId={appointment.id}
              initialStatus={appointment.status}
              clinicIdentifier={clinic.slug || clinic.id}
            />
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="size-3.5 text-primary" />
          Seus dados estão protegidos em conformidade com a LGPD.
        </p>
      </div>
    </main>
  );
}
