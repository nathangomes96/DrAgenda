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

import { WhatsAppSettingsView } from "./_components/whatsapp-settings-view";

const WhatsAppSettingsPage = async () => {
  const session = await validateAuthentication({
    mustHaveClinic: true,
    allowedRoles: ["admin", "receptionist"],
  });

  const clinicId = session!.user.clinic!.id;
  const userRole = session!.user.clinic?.role ?? "admin";

  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, clinicId),
  });

  if (!clinic) {
    notFound();
  }

  const hasEnvConfig = Boolean(
    process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY,
  );

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>WhatsApp & Automações</PageTitle>
          <PageDescription>
            Conecte o WhatsApp da sua clínica via Evolution API para envio automático de lembretes e confirmações anti no-show.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <WhatsAppSettingsView
          clinic={clinic}
          userRole={userRole}
          hasEnvConfig={hasEnvConfig}
        />
      </PageContent>
    </PageContainer>
  );
};

export default WhatsAppSettingsPage;
