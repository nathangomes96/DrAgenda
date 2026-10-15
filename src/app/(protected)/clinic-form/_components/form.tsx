"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { createClinic } from "@/actions/create-clinic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  interval: string;
  maxDoctors: number;
  isPopular: boolean;
  features: string[];
}

interface ClinicFormProps {
  plans: PlanItem[];
  trialDays: number;
}

export default function ClinicForm({ plans, trialDays }: ClinicFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa o plano selecionado com o mais popular ou o primeiro da lista
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const popular = plans.find((p) => p.isPopular);
      setSelectedPlanId(popular ? popular.id : plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Atualiza o slug automaticamente ao digitar o nome da clínica
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugEdited(true);
    const cleaned = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Por favor, informe o nome da sua clínica.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createClinic({
        name: name.trim(),
        slug: slug.trim() || null,
        planId: selectedPlanId || null,
        whatsappPhone: whatsappPhone.trim() || null,
      });

      toast.success("Clínica configurada com sucesso! Redirecionando...");
      // Redireciona com reload completo para recarregar a sessão do usuário com a nova clínica
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro ao cadastrar a clínica.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{trialDays} Dias de Teste Grátis • Sem Cartão de Crédito</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Vamos configurar sua clínica ou consultório
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Personalize as informações da sua clínica e escolha o plano ideal para iniciar seus {trialDays} dias de degustação gratuita.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloco 1: Informações da Empresa */}
        <Card className="shadow-sm border-border/80">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Dados da sua Clínica
                </CardTitle>
                <CardDescription className="text-xs">
                  Nome oficial e link exclusivo que seus pacientes usarão para agendar consultas online.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome da Clínica */}
            <div className="space-y-1.5">
              <Label htmlFor="clinic-name" className="text-xs font-semibold">
                Nome da Clínica ou Consultório *
              </Label>
              <Input
                id="clinic-name"
                placeholder="Ex: Clínica Bem Estar, Consultório Dr. Silva, Odonto Vita..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isSubmitting}
                className="text-sm h-10"
                required
              />
            </div>

            {/* Link / Slug de Agendamento */}
            <div className="space-y-1.5">
              <Label htmlFor="clinic-slug" className="text-xs font-semibold flex items-center justify-between">
                <span>Link Exclusivo de Agendamento Online</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  (personalizável)
                </span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="clinic-slug"
                  placeholder="link-da-sua-clinica"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-9 font-mono text-xs h-10"
                />
              </div>

              {/* Preview interativo do link */}
              <div className="p-3 bg-muted/60 rounded-xl border border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xs text-muted-foreground font-medium shrink-0">
                    Seu link público:
                  </span>
                  <span className="font-mono text-xs text-primary font-semibold truncate">
                    /agendar/{slug || "sua-clinica"}
                  </span>
                </div>
                <Badge variant="outline" className="w-fit text-[10px] bg-background">
                  24h Disponível para pacientes
                </Badge>
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <Label htmlFor="clinic-phone" className="text-xs font-semibold flex items-center justify-between">
                <span>WhatsApp da Clínica (Opcional)</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Pode configurar depois
                </span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="clinic-phone"
                  placeholder="Ex: (11) 99999-8888"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-9 text-xs h-10"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Usado pelo sistema para enviar confirmações e lembretes automáticos para seus pacientes via WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 2: Escolha do Plano para Teste Grátis */}
        <Card className="shadow-sm border-border/80">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Escolha o Plano para seu Período de Teste
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Teste gratuitamente com todas as funcionalidades liberadas por {trialDays} dias.
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                {trialDays} Dias Grátis
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="p-4 rounded-xl border bg-muted/40 text-center text-xs text-muted-foreground">
                Plano Padrão com {trialDays} dias de teste gratuito já incluso.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 bg-card hover:bg-muted/10"
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-2.5 right-3">
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Mais Escolhido
                          </span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-foreground">
                              {plan.name}
                            </h3>
                            {plan.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                {plan.description}
                              </p>
                            )}
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Preço e período */}
                        <div className="pt-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold text-foreground">
                              R$ {plan.price}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /{plan.interval === "year" ? "ano" : "mês"}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Grátis por {trialDays} dias
                          </span>
                        </div>

                        {/* Médicos */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <Stethoscope className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-foreground">
                            {plan.maxDoctors === 0
                              ? "Médicos Ilimitados"
                              : `Até ${plan.maxDoctors} ${plan.maxDoctors === 1 ? "médico" : "médicos"}`}
                          </span>
                        </div>

                        {/* Recursos */}
                        {plan.features.length > 0 && (
                          <ul className="space-y-1.5 pt-1 text-[11px] text-muted-foreground">
                            {plan.features.slice(0, 4).map((feat, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="pt-4 mt-auto">
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="w-full text-xs h-8 font-medium"
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          {isSelected ? "Plano Selecionado" : "Escolher Este"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão de Conclusão */}
        <div className="space-y-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Configurando sua Clínica...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Começar Meus {trialDays} Dias de Teste Grátis
              </>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sem cartão de crédito</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>Acesso completo imediato</span>
            <span className="hidden sm:inline">•</span>
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </form>
    </div>
  );
}
