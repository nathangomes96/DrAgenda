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

import { AiAgentSettingsView } from "./_components/ai-agent-settings-view";

export const metadata = {
  title: "Secretária IA | Doutor Agenda",
};

const AiAgentSettingsPage = async () => {
  const session = await validateAuthentication({
    mustHaveClinic: true,
    allowedRoles: ["admin"],
  });

  const clinicId = session!.user.clinic!.id;

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
          <PageTitle>Secretária IA no WhatsApp</PageTitle>
          <PageDescription>
            Atendimento automático 24 horas: tire dúvidas de pacientes, informe horários de consultas e agende automaticamente pelo WhatsApp.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <AiAgentSettingsView clinic={clinic} />
      </PageContent>
    </PageContainer>
  );
};

export default AiAgentSettingsPage;

