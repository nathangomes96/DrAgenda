import { and, desc, eq, or } from "drizzle-orm";
import { Metadata } from "next";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { validateAuthentication } from "@/hocs/with-authentication";

import { DoctorAgendaView } from "./_components/doctor-agenda-view";

export const metadata: Metadata = {
  title: "Atendimento Clínico & Agenda do Médico | Doutor Agenda",
  description: "Fila de atendimento do dia e prontuário ágil para o médico",
};

export default async function AtendimentoPage() {
  const session = await validateAuthentication({
    mustHaveClinic: true,
    mustHavePlan: true,
    allowedRoles: ["admin", "doctor"],
  });

  const clinicId = session!.user.clinic!.id;
  const userRole = session!.user.clinic?.role ?? "admin";
  const userId = session!.user.id;
  const userEmail = session!.user.email;

  // Localiza perfil médico se o usuário logado for doctor
  let currentDoctor = null;
  if (userRole === "doctor") {
    currentDoctor = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.clinicId, clinicId),
        or(
          eq(doctorsTable.userId, userId),
          eq(doctorsTable.email, userEmail),
        ),
      ),
    });
  }

  // Filtragem: Médico vê apenas seus agendamentos, Admin vê todos
  const appointmentsWhere = currentDoctor
    ? and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.doctorId, currentDoctor.id),
      )
    : eq(appointmentsTable.clinicId, clinicId);

  const [appointments, doctors, patients] = await Promise.all([
    db.query.appointmentsTable.findMany({
      where: appointmentsWhere,
      with: {
        patient: true,
        doctor: true,
        clinic: true,
      },
      orderBy: [desc(appointmentsTable.date)],
    }),
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, clinicId),
    }),
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, clinicId),
      orderBy: [desc(patientsTable.createdAt)],
    }),
  ]);

  // Se for admin e não tiver um médico específico, utiliza o primeiro médico cadastrado como referência ou dados do admin
  const activeDoctor =
    currentDoctor ||
    doctors[0] || {
      id: "admin-view",
      name: session!.user.name || "Administrador Clínico",
      specialty: "Gestão Médica",
    };

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Atendimento Clínico</PageTitle>
          <PageDescription>
            Gerencie os atendimentos do dia, consulte a agenda e inicie consultas com prontuário completo.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <DoctorAgendaView
          doctor={activeDoctor}
          allDoctors={doctors}
          appointments={appointments}
          patients={patients}
          userRole={userRole}
        />
      </PageContent>
    </PageContainer>
  );
}
