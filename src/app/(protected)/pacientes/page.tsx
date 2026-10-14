import { and, desc, eq, inArray, or } from "drizzle-orm";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  medicalRecordsTable,
  patientsTable,
} from "@/db/schema";
import { validateAuthentication } from "@/hocs/with-authentication";

import AddPatientButton from "../patients/_components/add-patient-button";
import { PatientsView } from "../patients/_components/patients-view";

const PacientesPage = async () => {
  const session = await validateAuthentication({
    mustHavePlan: true,
    mustHaveClinic: true,
    allowedRoles: ["admin", "receptionist", "doctor"],
  });

  const clinicId = session!.user.clinic!.id;
  const userRole = session!.user.clinic?.role ?? "admin";
  const userId = session!.user.id;
  const userEmail = session!.user.email;

  // Se o usuário logado for médico, localiza seu perfil
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

  // Isolamento de Pacientes:
  // Se for médico, busca exclusivamente pacientes que ele atendeu ou tem agendados
  // Se for admin ou recepcionista, busca todos os pacientes da clínica
  let patientsList: typeof patientsTable.$inferSelect[] = [];

  if (userRole === "doctor" && currentDoctor) {
    const [doctorAppointments, doctorRecords] = await Promise.all([
      db.query.appointmentsTable.findMany({
        where: and(
          eq(appointmentsTable.clinicId, clinicId),
          eq(appointmentsTable.doctorId, currentDoctor.id),
        ),
        columns: { patientId: true },
      }),
      db.query.medicalRecordsTable.findMany({
        where: and(
          eq(medicalRecordsTable.clinicId, clinicId),
          eq(medicalRecordsTable.doctorId, currentDoctor.id),
        ),
        columns: { patientId: true },
      }),
    ]);

    const patientIds = Array.from(
      new Set([
        ...doctorAppointments.map((a) => a.patientId),
        ...doctorRecords.map((r) => r.patientId),
      ]),
    );

    if (patientIds.length > 0) {
      patientsList = await db.query.patientsTable.findMany({
        where: and(
          eq(patientsTable.clinicId, clinicId),
          inArray(patientsTable.id, patientIds),
        ),
        orderBy: [desc(patientsTable.createdAt)],
      });
    } else {
      patientsList = [];
    }
  } else {
    patientsList = await db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, clinicId),
      orderBy: [desc(patientsTable.createdAt)],
    });
  }

  // Busca a lista de médicos da clínica para uso nos formulários
  const doctorsWhere =
    userRole === "doctor" && currentDoctor
      ? and(
          eq(doctorsTable.clinicId, clinicId),
          eq(doctorsTable.id, currentDoctor.id),
        )
      : eq(doctorsTable.clinicId, clinicId);

  const doctors = await db.query.doctorsTable.findMany({
    where: doctorsWhere,
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {userRole === "doctor" ? "Meus Pacientes" : "Pacientes"}
          </PageTitle>
          <PageDescription>
            {userRole === "doctor"
              ? "Prontuários e histórico dos pacientes sob seus cuidados médicos."
              : "Gerencie os pacientes da sua clínica e seus prontuários."}
          </PageDescription>
        </PageHeaderContent>
        {userRole !== "doctor" && (
          <PageActions>
            <AddPatientButton />
          </PageActions>
        )}
      </PageHeader>
      <PageContent>
        <PatientsView
          patients={patientsList}
          doctors={doctors}
          userRole={userRole}
        />
      </PageContent>
    </PageContainer>
  );
};

export default PacientesPage;
