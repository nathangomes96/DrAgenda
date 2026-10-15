import { and, desc, eq, or } from "drizzle-orm";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { appointmentsTable, clinicsTable, doctorsTable, medicalRecordsTable, patientsTable } from "@/db/schema";
import { validateAuthentication } from "@/hocs/with-authentication";

import { ClinicalAttendanceView } from "../_components/clinical-attendance-view";

export const metadata: Metadata = {
  title: "Consulta Clínica | Doutor Agenda",
  description: "Estação de atendimento clínico e prontuário eletrônico do paciente",
};

interface AtendimentoPageProps {
  params: Promise<{
    appointmentId: string;
  }>;
}

export default async function AtendimentoDetailPage(props: AtendimentoPageProps) {
  const params = await props.params;
  const appointmentId = params.appointmentId;

  const session = await validateAuthentication({
    mustHaveClinic: true,
    mustHavePlan: true,
    allowedRoles: ["admin", "doctor"],
  });

  const clinicId = session!.user.clinic!.id;
  const userRole = session!.user.clinic?.role ?? "admin";
  const userId = session!.user.id;
  const userEmail = session!.user.email;

  // Busca o agendamento completo com paciente e médico
  const appointment = await db.query.appointmentsTable.findFirst({
    where: and(
      eq(appointmentsTable.id, appointmentId),
      eq(appointmentsTable.clinicId, clinicId),
    ),
    with: {
      patient: true,
      doctor: true,
      clinic: true,
    },
  });

  if (!appointment || !appointment.patient || !appointment.doctor) {
    notFound();
  }

  // Se o usuário for médico, garante que ele só atende os seus próprios agendamentos
  if (userRole === "doctor") {
    const doctorRecord = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.clinicId, clinicId),
        or(
          eq(doctorsTable.userId, userId),
          eq(doctorsTable.email, userEmail),
        ),
      ),
    });

    if (doctorRecord && appointment.doctorId !== doctorRecord.id) {
      redirect("/atendimento");
    }
  }

  // Busca o histórico prévio de prontuários do paciente
  const records = await db.query.medicalRecordsTable.findMany({
    where: eq(medicalRecordsTable.patientId, appointment.patientId),
    with: {
      doctor: true,
      appointment: true,
    },
    orderBy: [desc(medicalRecordsTable.createdAt)],
  });

  return (
    <ClinicalAttendanceView
      patient={appointment.patient}
      doctor={appointment.doctor}
      clinic={appointment.clinic}
      appointment={appointment}
      records={records}
      userRole={userRole}
    />
  );
}
