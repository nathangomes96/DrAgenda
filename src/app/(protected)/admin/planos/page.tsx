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

import { PlansTable } from "./_components/plans-table";

export const metadata = {
  title: "Gestão de Planos & Limites | Doutor Agenda",
};

export default async function AdminPlanosPage() {
  await validateAuthentication({
    mustBeSuperAdmin: true,
  });

  const plans = await getPlansAdmin();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Planos & Limites</PageTitle>
          <PageDescription>
            Crie e personalize planos, preços e limites de médicos e pacientes para as clínicas cadastradas no SaaS.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <PlansTable plans={plans} />
      </PageContent>
    </PageContainer>
  );
}
