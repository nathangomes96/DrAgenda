import { AlertOctagon, CheckCircle2, Clock, Infinity as InfinityIcon, Sparkles } from "lucide-react";

import { getPlansAdmin } from "@/actions/admin/plans";
import { getPlatformSettings } from "@/actions/admin/platform-settings";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { validateAuthentication } from "@/hocs/with-authentication";

import { PaymentMethodsCard } from "./_components/payment-methods-card";
import { SaasPlansClient } from "./_components/saas-plans-client";

export const metadata = {
  title: "Assinatura & Planos | Doutor Agenda",
};

interface AssinaturaPageProps {
  searchParams?: Promise<{
    expirado?: string;
  }>;
}

const AssinaturaPage = async ({ searchParams }: AssinaturaPageProps) => {
  const session = await validateAuthentication({
    mustHaveClinic: true,
    checkPlanExpiration: false,
    allowedRoles: ["admin"],
  });

  const resolvedParams = searchParams ? await searchParams : {};
  const isExpQuery = resolvedParams.expirado === "true";

  const [settings, plans] = await Promise.all([
    getPlatformSettings(),
    getPlansAdmin(),
  ]);

  const clinic = session!.user.clinic as any;
  const planStatus = clinic?.planStatus || "trial";
  const planExpiresAt = clinic?.planExpiresAt
    ? new Date(clinic.planExpiresAt)
    : null;

  const now = new Date();
  const diffDays = planExpiresAt
    ? Math.ceil((planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isExpired =
    isExpQuery ||
    planStatus === "expired" ||
    (planStatus !== "lifetime" && planExpiresAt && now > planExpiresAt);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Assinatura & Planos</PageTitle>
          <PageDescription>
            Acompanhe a situação do seu plano, limites de médicos e formas de pagamento da clínica.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>

      <PageContent>
        <div className="space-y-8">
        {/* Banner de Situação Atual do Plano */}
        {isExpired ? (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-base">
                  Seu período de teste expirou!
                </h4>
                <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                  Para reativar seu painel e voltar a receber agendamentos online de pacientes, realize o pagamento através de uma das opções abaixo.
                </p>
              </div>
            </div>
            <Badge className="bg-rose-600 text-white shrink-0 self-start sm:self-auto">
              Acesso Bloqueado
            </Badge>
          </div>
        ) : planStatus === "lifetime" ? (
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <InfinityIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground">
                  Plano Vitalício Ativo
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sua empresa possui acesso permanente sem data de expiração.
                </p>
              </div>
            </div>
            <Badge className="bg-purple-600 text-white shrink-0">
              Vitalício
            </Badge>
          </div>
        ) : planStatus === "trial" ? (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground">
                  Período de Teste Gratuito de 7 Dias
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Seu teste expira em{" "}
                  <strong>
                    {diffDays} {diffDays === 1 ? "dia" : "dias"}
                  </strong>{" "}
                  {planExpiresAt && (
                    <span>
                      ({planExpiresAt.toLocaleDateString("pt-BR")})
                    </span>
                  )}
                  .
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500 text-white shrink-0">
              {diffDays} {diffDays === 1 ? "dia restante" : "dias restantes"}
            </Badge>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground">
                  Assinatura Ativa
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sua clínica está em dia. Próxima renovação em{" "}
                  <strong>
                    {planExpiresAt?.toLocaleDateString("pt-BR") || "—"}
                  </strong>{" "}
                  ({diffDays} dias).
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white shrink-0">
              Ativo
            </Badge>
          </div>
        )}

        {/* Grade de Planos do SaaS */}
        <SaasPlansClient plans={plans} currentPlanId={clinic?.planId} />

        {/* Métodos de Pagamento Habilitados */}
        <PaymentMethodsCard settings={settings} clinicName={clinic?.name || "Clínica"} />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default AssinaturaPage;
