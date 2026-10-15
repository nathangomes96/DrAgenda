import { and, desc, eq, or } from "drizzle-orm";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { clinicsTable, doctorsTable, medicalRecordsTable, patientsTable } from "@/db/schema";
import { validateAuthentication } from "@/hocs/with-authentication";

import { ClinicalAttendanceView } from "../_components/clinical-attendance-view";

export const metadata: Metadata = {
  title: "Atendimento Avulso | Doutor Agenda",
  description: "Estação de atendimento clínico para pacientes sem agendamento prévio",
};

interface AtendimentoAvulsoPageProps {
  searchParams: Promise<{
    patientId?: string;
    doctorId?: string;
  }>;
}

export default async function AtendimentoAvulsoPage(props: AtendimentoAvulsoPageProps) {
  const searchParams = await props.searchParams;
  const patientId = searchParams.patientId;
  const doctorIdParam = searchParams.doctorId;

  if (!patientId) {
    redirect("/atendimento");
  }

  const session = await validateAuthentication({
    mustHaveClinic: true,
    mustHavePlan: true,
    allowedRoles: ["admin", "doctor"],
  });

  const clinicId = session!.user.clinic!.id;
  const userRole = session!.user.clinic?.role ?? "admin";
  const userId = session!.user.id;
  const userEmail = session!.user.email;

  // Busca dados do paciente
  const patient = await db.query.patientsTable.findFirst({
    where: and(
      eq(patientsTable.id, patientId),
      eq(patientsTable.clinicId, clinicId),
    ),
  });

  if (!patient) {
    notFound();
  }

  // Busca a clínica
  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, clinicId),
  });

  if (!clinic) {
    notFound();
  }

  // Identifica o médico responsável
  let activeDoctor = null;

  if (userRole === "doctor") {
    activeDoctor = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.clinicId, clinicId),
        or(
          eq(doctorsTable.userId, userId),
          eq(doctorsTable.email, userEmail),
        ),
      ),
    });
  } else if (doctorIdParam) {
    activeDoctor = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.id, doctorIdParam),
        eq(doctorsTable.clinicId, clinicId),
      ),
    });
  }

  // Fallback: se ainda não achou, pega o primeiro médico da clínica
  if (!activeDoctor) {
    activeDoctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.clinicId, clinicId),
    });
  }

  if (!activeDoctor) {
    redirect("/atendimento");
  }

  // Busca o histórico prévio de prontuários do paciente
  const records = await db.query.medicalRecordsTable.findMany({
    where: eq(medicalRecordsTable.patientId, patient.id),
    with: {
      doctor: true,
      appointment: true,
    },
    orderBy: [desc(medicalRecordsTable.createdAt)],
  });

  return (
    <ClinicalAttendanceView
      patient={patient}
      doctor={activeDoctor}
      clinic={clinic}
      appointment={null}
      records={records}
      userRole={userRole}
    />
  );
}
