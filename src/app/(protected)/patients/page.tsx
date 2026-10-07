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

import AddPatientButton from "./_components/add-patient-button";
import { PatientsView } from "./_components/patients-view";

const PatientsPage = async () => {
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

    const patientIds = new Set<string>([
      ...doctorAppointments.map((a) => a.patientId),
      ...doctorRecords.map((r) => r.patientId),
    ]);

    if (patientIds.size > 0) {
      patientsList = await db.query.patientsTable.findMany({
        where: and(
          eq(patientsTable.clinicId, clinicId),
          inArray(patientsTable.id, Array.from(patientIds)),
        ),
        orderBy: [desc(patientsTable.name)],
      });
    } else {
      patientsList = [];
    }
  } else {
    patientsList = await db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, clinicId),
      orderBy: [desc(patientsTable.name)],
    });
  }

  // Lista de médicos disponível para o modal de prontuário
  const doctors = currentDoctor
    ? [currentDoctor]
    : await db.query.doctorsTable.findMany({
        where: eq(doctorsTable.clinicId, clinicId),
      });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {userRole === "doctor" ? "Meus Pacientes & Prontuários" : "Pacientes & Prontuários"}
          </PageTitle>
          <PageDescription>
            {userRole === "doctor"
              ? `Visualizando exclusivamente os pacientes sob seus cuidados clínicos, Dr(a). ${currentDoctor?.name || session!.user.name}.`
              : "Gerencie o cadastro de pacientes e prontuários médicos da clínica."}
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddPatientButton />
        </PageActions>
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

export default PatientsPage;
