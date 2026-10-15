import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CalendarX } from "lucide-react";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { getClinicByIdOrSlug } from "@/data/get-clinic-by-id-or-slug";

import { BookingForm } from "./_components/booking-form";

interface PageProps {
  params: Promise<{
    clinicId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { clinicId } = await params;
  const clinic = await getClinicByIdOrSlug(clinicId);

  if (!clinic) {
    return {
      title: "Clínica não encontrada | Doutor Agenda",
    };
  }

  return {
    title: `Agendamento Online - ${clinic.name} | Doutor Agenda`,
    description: `Agende sua consulta online na clínica ${clinic.name} com facilidade e rapidez.`,
  };
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { clinicId } = await params;

  const clinic = await getClinicByIdOrSlug(clinicId);

  if (!clinic) {
    notFound();
  }

  const isPlanExpired =
    clinic.planStatus === "expired" ||
    (clinic.planStatus !== "lifetime" &&
      clinic.planExpiresAt &&
      new Date() > new Date(clinic.planExpiresAt));

  if (isPlanExpired) {
    return (
      <main className="min-h-screen bg-[#F8FAFB] dark:bg-[#061214] text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <CalendarX className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Agendamentos Indisponíveis</h1>
          <p className="text-sm text-muted-foreground">
            Os agendamentos online para a clínica <strong>{clinic.name}</strong> estão temporariamente pausados.
          </p>
          <p className="text-xs text-muted-foreground border-t pt-4">
            Por favor, entre em contato diretamente com a clínica por telefone ou WhatsApp para agendar sua consulta.
          </p>
        </div>
      </main>
    );
  }

  const doctors = await db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, clinic.id),
  });

  return (
    <main className="min-h-screen bg-[#F8FAFB] dark:bg-[#061214] text-foreground transition-colors duration-300 relative overflow-hidden">
      {/* Ambient background glow inspirada no ClinicSuite */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(13,148,136,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.16),transparent_70%)]"
      />
      <div className="relative z-10 py-6 sm:py-10">
        <BookingForm clinic={clinic} doctors={doctors} />
      </div>
    </main>
  );
}
