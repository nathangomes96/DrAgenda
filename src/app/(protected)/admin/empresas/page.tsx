import { getClinicsAdmin } from "@/actions/admin/clinics";
import { getPlansAdmin } from "@/actions/admin/plans";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { validateAuthentication } from "@/hocs/with-authentication";

import { ClinicsTable } from "./_components/clinics-table";

export const metadata = {
  title: "Gestão de Empresas | Doutor Agenda",
};

export default async function AdminEmpresasPage() {
  await validateAuthentication({
    mustBeSuperAdmin: true,
  });

  const [clinics, plans] = await Promise.all([
    getClinicsAdmin(),
    getPlansAdmin(),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Empresas & Assinaturas</PageTitle>
          <PageDescription>
            Visualize todas as empresas cadastradas no SaaS, acompanhe o período de teste e renove ou altere planos manualmente com 1 clique.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <ClinicsTable clinics={clinics} plans={plans} />
      </PageContent>
    </PageContainer>
  );
}
