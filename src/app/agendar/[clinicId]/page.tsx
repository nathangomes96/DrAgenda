import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
