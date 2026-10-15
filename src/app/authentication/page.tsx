import { asc, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { platformSettingsTable, saasPlansTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import LoginForm from "./_components/login-form";
import SignUpForm from "./_components/sign-up-form";

export const metadata = {
  title: "Acesso & Cadastro | Doutor Agenda",
};

interface AuthenticationPageProps {
  searchParams?: Promise<{
    tab?: string;
  }>;
}

const AuthenticationPage = async (props: AuthenticationPageProps) => {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const defaultTab = searchParams.tab === "register" ? "register" : "login";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  // Busca planos e configurações para a aba de cadastro
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
    <div className="bg-muted/20 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header com Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Doutor<span className="text-primary">Agenda</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            A plataforma completa de agendamento online e prontuário para sua clínica
          </p>
        </div>

        <Card className="shadow-lg border-border/80">
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-xs sm:text-sm font-medium">
                  Já tenho conta (Login)
                </TabsTrigger>
                <TabsTrigger value="register" className="text-xs sm:text-sm font-medium">
                  Criar conta (7 Dias Grátis)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="max-w-md mx-auto">
                  <LoginForm />
                </div>
              </TabsContent>

              <TabsContent value="register">
                <SignUpForm
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthenticationPage;
