import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { validateAuthentication } from "@/hocs/with-authentication";

import { ClinicSettingsView } from "./_components/clinic-settings-view";

const ClinicSettingsPage = async () => {
  const session = await validateAuthentication({
    mustHaveClinic: true,
    allowedRoles: ["admin", "receptionist", "doctor"],
  });

  const clinicId = session!.user.clinic!.id;
  const userRole = session!.user.clinic?.role ?? "admin";

  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, clinicId),
  });

  if (!clinic) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Configurações da Clínica</PageTitle>
          <PageDescription>
            Gerencie o nome comercial, identidade e link público da sua clínica.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <ClinicSettingsView clinic={clinic} userRole={userRole} />
      </PageContent>
    </PageContainer>
  );
};

export default ClinicSettingsPage;
