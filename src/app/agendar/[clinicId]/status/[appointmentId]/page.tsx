import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  Stethoscope,
  User,
  XCircle,
  ArrowLeft,
  Share2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { normalizeAppointmentCodeQuery } from "@/helpers/appointment-code";

interface PageProps {
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
}: PageProps): Promise<Metadata> {
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
      title: "Consulta não encontrada | Doutor Agenda",
    };
  }

  return {
    title: `Status da Consulta (${appointment.code || appointment.id.slice(0, 8)}) - ${appointment.clinic.name} | Doutor Agenda`,
    description: `Acompanhe o status do agendamento na clínica ${appointment.clinic.name}.`,
  };
}

export default async function AppointmentStatusPage({ params }: PageProps) {
  const { clinicId, appointmentId } = await params;
  const whereCondition = buildAppointmentLookupCondition(appointmentId);

  const appointment = await db.query.appointmentsTable.findFirst({
    where: whereCondition,
    with: {
      clinic: true,
      doctor: true,
      patient: true,
    },
  });

  if (
    !appointment ||
    (appointment.clinicId !== clinicId && appointment.clinic.slug !== clinicId)
  ) {
    notFound();
  }

  const { status, doctor, patient, clinic, date, appointmentPriceInCents } = appointment;
  const appointmentDate = new Date(date);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 py-10 px-4">
      <div className="mx-auto w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        
        {/* Botão de retorno */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href={`/agendar/${clinicId}`}>
              <ArrowLeft className="size-4" /> Novo Agendamento
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href={`/agendar/${clinicId}/status/${appointmentId}`}>
              <RefreshCw className="size-3.5" /> Atualizar Status
            </Link>
          </Button>
        </div>

        {/* Card Principal de Status */}
        <Card className="border-2 shadow-xl overflow-hidden">
          {/* Header estilizado baseado no status */}
          <div
            className={`p-6 text-center text-white ${
              status === "confirmed"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                : status === "cancelled"
                ? "bg-gradient-to-r from-rose-600 to-red-600"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}
          >
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-4 ring-white/20">
              {status === "confirmed" ? (
                <CheckCircle2 className="size-9 text-white" />
              ) : status === "cancelled" ? (
                <XCircle className="size-9 text-white" />
              ) : (
                <Clock className="size-9 text-white animate-pulse" />
              )}
            </div>

            <Badge
              className={`mb-2 font-bold px-3 py-1 text-xs uppercase tracking-wider ${
                status === "confirmed"
                  ? "bg-white text-emerald-800"
                  : status === "cancelled"
                  ? "bg-white text-rose-800"
                  : "bg-white text-amber-900"
              }`}
            >
              {status === "confirmed"
                ? "Consulta Confirmada"
                : status === "cancelled"
                ? "Consulta Recusada / Cancelada"
                : "Aguardando Aprovação da Recepção"}
            </Badge>

            <h1 className="text-xl sm:text-2xl font-black">
              {status === "confirmed"
                ? "Seu agendamento foi aceito!"
                : status === "cancelled"
                ? "Horário não disponível"
                : "Solicitação em Análise"}
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-white/90 max-w-md mx-auto">
              {status === "confirmed"
                ? "A equipe da clínica confirmou seu horário. Compareça com 10 minutos de antecedência."
                : status === "cancelled"
                ? "Infelizmente este horário não pôde ser confirmado pela clínica. Por favor, solicite um novo horário."
                : "A recepcionista está revisando os dados da consulta. Atualize a página a qualquer momento para verificar."}
            </p>
          </div>

          {/* Detalhes da Consulta */}
          <CardContent className="space-y-4 pt-6 text-sm">
            {/* Código da Consulta Amigável */}
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5 border text-xs">
              <span className="text-muted-foreground font-medium">Código do Agendamento:</span>
              <span className="font-mono font-bold text-foreground text-sm bg-background px-2.5 py-1 rounded-lg border shadow-xs">
                {appointment.code || appointment.id}
              </span>
            </div>

            <div className="flex items-center gap-3 border-b pb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Stethoscope className="size-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-muted-foreground block">Profissional / Especialista</span>
                <span className="font-bold text-foreground text-base">{doctor.name}</span>
                <span className="text-xs text-primary font-medium block">{doctor.specialty}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3.5" /> Data da Consulta
                </span>
                <p className="font-semibold text-foreground">
                  {format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {format(appointmentDate, "EEEE", { locale: ptBR })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" /> Horário
                </span>
                <p className="font-bold text-primary text-base">
                  {format(appointmentDate, "HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">Horário de Brasília</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">Paciente</span>
                <p className="font-medium text-foreground">{patient.name}</p>
                <p className="text-xs text-muted-foreground">{patient.phoneNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Valor Estimado</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(appointmentPriceInCents)}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/60 p-4 space-y-1.5 border">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Local de Atendimento
              </span>
              <p className="text-sm font-medium">{clinic.name}</p>
              <p className="text-xs text-muted-foreground">
                Dúvidas ou reagendamentos podem ser alinhados diretamente com a recepção da clínica.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2.5 pt-2">
            {status === "cancelled" ? (
              <Button asChild className="w-full font-bold shadow-md">
                <Link href={`/agendar/${clinicId}`}>
                  Escolher Outro Horário
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/agendar/${clinicId}`}>
                  Fazer Outro Agendamento
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Rodapé informativo */}
        <p className="text-center text-xs text-muted-foreground">
          Guarde este link para consultar o andamento da sua consulta a qualquer momento.
        </p>
      </div>
    </main>
  );
}
