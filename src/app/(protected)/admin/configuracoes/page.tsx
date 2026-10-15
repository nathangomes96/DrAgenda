import { getPlatformSettings } from "@/actions/admin/platform-settings";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { validateAuthentication } from "@/hocs/with-authentication";

import { SettingsForm } from "./_components/settings-form";

export const metadata = {
  title: "Configurações do SaaS | Doutor Agenda",
};

export default async function AdminConfiguracoesPage() {
  await validateAuthentication({
    mustBeSuperAdmin: true,
  });

  const settings = await getPlatformSettings();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Configurações do SaaS</PageTitle>
          <PageDescription>
            Defina o período de teste e habilite ou desabilite métodos de pagamento disponíveis para os clientes.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <SettingsForm initialSettings={settings} />
      </PageContent>
    </PageContainer>
  );
}
