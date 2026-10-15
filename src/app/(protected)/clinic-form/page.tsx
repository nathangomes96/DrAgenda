import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { platformSettingsTable, saasPlansTable } from "@/db/schema";
import { validateAuthentication } from "@/hocs/with-authentication";

import ClinicForm from "./_components/form";

export const metadata = {
  title: "Configuração da sua Clínica | Doutor Agenda",
};

const ClinicFormPage = async () => {
  await validateAuthentication({ mustHavePlan: true });

  const [plans, settings] = await Promise.all([
    db.query.saasPlansTable.findMany({
      where: eq(saasPlansTable.isActive, true),
      orderBy: (p, { desc, asc }) => [desc(p.isPopular), asc(p.price)],
    }),
    db.query.platformSettingsTable.findFirst({
      where: eq(platformSettingsTable.id, "default"),
    }),
  ]);

  const trialDays = settings?.trialDays ?? 7;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-4xl py-6">
        <ClinicForm
          plans={plans.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            interval: p.interval,
            maxDoctors: p.maxDoctors,
            isPopular: p.isPopular,
            features: (p.features as string[]) || [],
          }))}
          trialDays={trialDays}
        />
      </div>
    </div>
  );
};

export default ClinicFormPage;
