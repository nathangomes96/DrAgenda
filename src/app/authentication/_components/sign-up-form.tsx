"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Zap,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { registerClinicAccountAction } from "@/actions/register-clinic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  interval: string;
  maxDoctors: number;
  isPopular: boolean;
  features: string[];
}

interface SignUpFormProps {
  plans?: PlanItem[];
  trialDays?: number;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, { message: "Informe seu nome completo" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
  clinicName: z
    .string()
    .trim()
    .min(2, { message: "Informe o nome da sua clínica ou consultório" }),
  slug: z.string().optional(),
  whatsappPhone: z.string().optional(),
  planId: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const SignUpForm = ({ plans = [], trialDays = 7 }: SignUpFormProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [slugEdited, setSlugEdited] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      clinicName: "",
      slug: "",
      whatsappPhone: "",
      planId: "",
    },
  });

  // Auto-seleciona o plano mais popular ou o primeiro
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const pop = plans.find((p) => p.isPopular);
      const chosen = pop ? pop.id : plans[0].id;
      setSelectedPlanId(chosen);
      form.setValue("planId", chosen);
    }
  }, [plans, selectedPlanId, form]);

  const handleClinicNameChange = (val: string) => {
    form.setValue("clinicName", val);
    if (!slugEdited) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      form.setValue("slug", generated);
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugEdited(true);
    const cleaned = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "");
    form.setValue("slug", cleaned);
  };

  const currentSlug = form.watch("slug");

  async function onSubmit(values: RegisterFormValues) {
    try {
      // 1. Cria a conta do usuário e a clínica com o plano selecionado de forma atômica no banco
      await registerClinicAccountAction({
        name: values.name.trim(),
        email: values.email.toLowerCase().trim(),
        password: values.password,
        clinicName: values.clinicName.trim(),
        slug: values.slug?.trim() || null,
        planId: selectedPlanId || null,
        whatsappPhone: values.whatsappPhone?.trim() || null,
      });

      toast.success("Conta e clínica criadas com sucesso! Entrando...");

      // 2. Realiza o login imediato com Better Auth para estabelecer a sessão do navegador
      await authClient.signIn.email(
        {
          email: values.email.toLowerCase().trim(),
          password: values.password,
          callbackURL: "/dashboard",
        },
        {
          onSuccess: () => {
            window.location.href = "/dashboard";
          },
          onError: () => {
            window.location.href = "/dashboard";
          },
        },
      );
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro ao criar sua conta.");
    }
  }

  return (
    <Card className="border-0 shadow-none p-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <CardHeader className="p-0 pb-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg font-bold">
                  Criar conta & Começar Grátis
                </CardTitle>
                <CardDescription className="text-xs">
                  Preencha os dados abaixo para configurar sua clínica com {trialDays} dias de teste gratuito.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1">
                <Sparkles className="w-3 h-3" />
                {trialDays} Dias Grátis
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {/* SEÇÃO 1: DADOS DE ACESSO */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-primary" />
                Seus Dados de Acesso
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">Seu Nome *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Dr. João Silva"
                          {...field}
                          className="text-xs h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">Seu E-mail *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="joao@clinica.com"
                          {...field}
                          className="text-xs h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Criar Senha de Acesso *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mínimo de 8 caracteres"
                        {...field}
                        className="text-xs h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* SEÇÃO 2: DADOS DA CLÍNICA */}
            <div className="space-y-3 pt-2 border-t">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Dados da sua Clínica
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="clinicName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">Nome da Clínica ou Consultório *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Clínica São Lucas, Consultório Dr. João"
                          value={field.value}
                          onChange={(e) => handleClinicNameChange(e.target.value)}
                          className="text-xs h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappPhone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">WhatsApp da Clínica (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-8888"
                          {...field}
                          className="text-xs h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Link de agendamento online com preview */}
              <div className="space-y-1.5">
                <FormLabel className="text-xs flex items-center justify-between">
                  <span>Link de Agendamento Online</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    (pacientes agendam por aqui)
                  </span>
                </FormLabel>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="link-exclusivo"
                    value={currentSlug || ""}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="pl-9 font-mono text-xs h-9"
                  />
                </div>
                <div className="p-2 bg-muted/50 rounded-lg border border-dashed text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Link público: <strong className="text-primary font-mono font-medium">/agendar/{currentSlug || "sua-clinica"}</strong></span>
                  <span className="text-[10px] text-emerald-600 font-medium">Ativo 24h</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: ESCOLHA DO PLANO PARA O TESTE */}
            {plans.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Escolha o Plano para o Teste Grátis
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Sem cobrança nos primeiros {trialDays} dias
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          form.setValue("planId", plan.id);
                        }}
                        className={`relative rounded-xl border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                            : "border-border hover:border-muted-foreground/30 bg-card"
                        }`}
                      >
                        {plan.isPopular && (
                          <div className="absolute -top-2 right-2">
                            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              Mais Escolhido
                            </span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground">
                              {plan.name}
                            </span>
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-extrabold text-foreground">
                              R$ {plan.price}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              /{plan.interval === "year" ? "ano" : "mês"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Stethoscope className="w-3 h-3 text-primary shrink-0" />
                            <span>
                              {plan.maxDoctors === 0
                                ? "Médicos Ilimitados"
                                : `Até ${plan.maxDoctors} médico(s)`}
                            </span>
                          </div>

                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {trialDays} dias grátis
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-0 pt-2 flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full h-11 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando sua conta e clínica...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Criar Conta & Iniciar {trialDays} Dias Grátis
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sem cartão de crédito</span>
              <span>•</span>
              <span>Cancele a qualquer momento</span>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SignUpForm;
