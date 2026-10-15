"use client";

import { CheckCircle2, Sparkles, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  interval: string;
  maxDoctors: number;
  maxPatients: number;
  isPopular: boolean;
  isActive: boolean;
  features: string[] | null;
}

interface SaasPlansClientProps {
  plans: PlanItem[];
  currentPlanId?: string | null;
}

export function SaasPlansClient({
  plans,
  currentPlanId,
}: SaasPlansClientProps) {
  const activePlans = plans.filter((p) => p.isActive);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold tracking-tight">Planos Disponíveis</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o plano ideal para a quantidade de médicos do seu consultório ou clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activePlans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between transition-all duration-200 relative ${
                plan.isPopular
                  ? "border-primary shadow-md ring-1 ring-primary/20"
                  : "border-border shadow-sm hover:border-primary/40"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-0.5 text-xs shadow-sm gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    {plan.name}
                  </CardTitle>
                  {isCurrent && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                      Plano Atual
                    </Badge>
                  )}
                </div>
                {plan.description && (
                  <CardDescription className="text-xs min-h-[32px] mt-1">
                    {plan.description}
                  </CardDescription>
                )}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">
                    R$ {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    / mês
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-medium">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {plan.maxDoctors === 0
                        ? "Médicos Ilimitados"
                        : `Até ${plan.maxDoctors} ${
                            plan.maxDoctors === 1 ? "médico" : "médicos"
                          } inclusos`}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="space-y-2.5 border-t pt-4 text-xs">
                  {(plan.features || []).map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
