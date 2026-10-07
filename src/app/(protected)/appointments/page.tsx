import { and, desc, eq, or } from "drizzle-orm";

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

import { AppointmentsView } from "./_components/appointments-view";

const AppointmentsPage = async () => {
  const session = await validateAuthentication({
    mustHavePlan: true,
    mustHaveClinic: true,
    allowedRoles: ["admin", "receptionist", "doctor"],
  });

  const clinicId = session!.user.clinic!.id;
  const clinicName = session!.user.clinic!.name || "Minha Clínica";
  const clinicSlug = session!.user.clinic!.slug;
  const userRole = session!.user.clinic?.role ?? "admin";
  const userId = session!.user.id;
  const userEmail = session!.user.email;

  // Se o usuário logado for médico, localiza o registro dele em doctorsTable
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

  // Isolamento de privacidade:
  // Médico vê APENAS suas próprias consultas.
  // Admin e Recepção veem as consultas de todos os médicos da clínica.
  const appointmentsWhere = currentDoctor
    ? and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.doctorId, currentDoctor.id),
      )
    : eq(appointmentsTable.clinicId, clinicId);

  const doctorsWhere = currentDoctor
    ? and(
        eq(doctorsTable.clinicId, clinicId),
        eq(doctorsTable.id, currentDoctor.id),
      )
    : eq(doctorsTable.clinicId, clinicId);

  const [patients, doctors, appointments] = await Promise.all([
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, clinicId),
      orderBy: [desc(patientsTable.createdAt)],
    }),
    db.query.doctorsTable.findMany({
      where: doctorsWhere,
      orderBy: [desc(doctorsTable.createdAt)],
    }),
    db.query.appointmentsTable.findMany({
      where: appointmentsWhere,
      with: {
        patient: true,
        doctor: true,
        clinic: true,
      },
      orderBy: [desc(appointmentsTable.date)],
    }),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {userRole === "doctor" ? "Minha Agenda de Consultas" : "Agendamentos"}
          </PageTitle>
          <PageDescription>
            {userRole === "doctor"
              ? `Visualizando exclusivamente as suas consultas, Dr(a). ${currentDoctor?.name || session!.user.name}.`
              : "Gerencie consultas, aprove solicitações de agendamento online e compartilhe o link da clínica."}
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <AppointmentsView
          clinicId={clinicId}
          clinicName={clinicName}
          clinicSlug={clinicSlug}
          patients={patients}
          doctors={doctors}
          appointments={appointments}
        />
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;
