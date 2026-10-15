"use client";

import { AlertOctagon, AlertTriangle, ArrowRight, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function TrialBanner() {
  const session = authClient.useSession();
  const pathname = usePathname();

  // Se já estiver na página de assinatura ou se não tiver clínica, não precisa poluir a tela
  if (pathname === "/assinatura") {
    return null;
  }

  const clinic = session.data?.user?.clinic as
    | {
        planStatus?: "trial" | "active" | "expired" | "lifetime";
        planExpiresAt?: string | Date | null;
        name?: string;
      }
    | undefined;

  if (!clinic || clinic.planStatus === "lifetime" || !clinic.planExpiresAt) {
    return null;
  }

  const expiresAt = new Date(clinic.planExpiresAt);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = expiresAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Caso 1: Trial Expirado
  if (clinic.planStatus === "expired" || diffDays <= 0) {
    return (
      <div className="w-full bg-rose-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-white animate-pulse" />
            <span>
              Seu período de teste de 7 dias <strong>expirou</strong>! Renove o plano para desbloquear todas as funções e agendamentos.
            </span>
          </div>
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-7 text-xs font-semibold bg-white text-rose-700 hover:bg-rose-50 shadow-none"
          >
            <Link href="/assinatura" className="flex items-center gap-1">
              Reativar Agora
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Caso 2: Em Trial - Reta final (2 dias ou menos)
  if (clinic.planStatus === "trial" && diffDays <= 2) {
    return (
      <div className="w-full bg-amber-500 text-white dark:bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
            <span>
              Atenção: Seu plano de teste gratuito expira em{" "}
              <strong>
                {diffDays === 1 ? "1 dia" : `${diffDays} dias`} ({formattedDate})
              </strong>
              . Garanta a continuidade dos seus agendamentos!
            </span>
          </div>
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-7 text-xs font-semibold bg-white text-amber-800 hover:bg-amber-50 shadow-none"
          >
            <Link href="/assinatura" className="flex items-center gap-1">
              Assinar Plano
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Caso 3: Em Trial - Dias 3 a 7
  if (clinic.planStatus === "trial") {
    return (
      <div className="w-full bg-primary/10 border-b border-primary/20 text-foreground px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-muted-foreground">
              Você está no período de teste gratuito: seu plano expira em{" "}
              <strong className="text-foreground">
                {diffDays} {diffDays === 1 ? "dia" : "dias"} ({formattedDate})
              </strong>
              .
            </span>
          </div>
          <Button
            asChild
            size="sm"
            className="h-7 text-xs font-semibold shadow-none gap-1"
          >
            <Link href="/assinatura">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Ver Planos / Assinar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Caso 4: Plano Ativo com Vencimento Próximo (3 dias ou menos)
  if (clinic.planStatus === "active" && diffDays <= 3) {
    return (
      <div className="w-full bg-blue-500/10 border-b border-blue-500/20 text-foreground px-4 py-2 text-xs sm:text-sm font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Sua assinatura vence em{" "}
              <strong className="text-foreground">
                {diffDays === 1 ? "1 dia" : `${diffDays} dias`} ({formattedDate})
              </strong>
              .
            </span>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 text-xs font-semibold border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <Link href="/assinatura">Renovar Mensalidade</Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
