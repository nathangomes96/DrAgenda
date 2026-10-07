import dayjs from "dayjs";
import { redirect } from "next/navigation";

import { PageContainer, PageContent } from "@/components/ui/page-container";
import { getDashboard } from "@/data/get-dashboard";
import { validateAuthentication } from "@/hocs/with-authentication";

import { DashboardView } from "./_components/dashboard-view";

interface DashboardPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await validateAuthentication({
    mustHavePlan: true,
    mustHaveClinic: true,
    allowedRoles: ["admin"],
  });

  const { from, to } = await searchParams;
  if (!from || !to) {
    redirect(
      `/dashboard?from=${dayjs().format("YYYY-MM-DD")}&to=${dayjs()
        .add(1, "month")
        .format("YYYY-MM-DD")}`,
    );
  }

  const dashboardData = await getDashboard({
    from,
    to,
    session: {
      user: {
        clinic: {
          id: session.user.clinic!.id,
        },
      },
    },
  });

  return (
    <PageContainer>
      <PageContent>
        <DashboardView
          userName={session.user.name}
          clinicName={
            session.user.clinic?.name ||
            dashboardData.clinicInfo?.name ||
            "Minha Clínica"
          }
          dashboardData={dashboardData}
        />
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
