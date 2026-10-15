"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Infinity as InfinityIcon,
  Link2,
  Loader2,
  Lock,
  Mail,
  Save,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  renewClinicPlan,
  type RenewClinicPlanInput,
  updateClinicInfoAdmin,
} from "@/actions/admin/clinics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface RenewPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic: {
    id: string;
    name: string;
    slug: string | null;
    planStatus: "trial" | "active" | "expired" | "lifetime";
    planExpiresAt: Date | string | null;
    planNotes: string | null;
    customMaxDoctors: number | null;
    plan: {
      id: string;
      name: string;
      price: string;
      maxDoctors: number;
    } | null;
    owner?: {
      id: string;
      name: string;
      email: string;
    } | null;
  } | null;
  plans: Array<{
    id: string;
    name: string;
    price: string;
    maxDoctors: number;
  }>;
}

export function RenewPlanDialog({
  open,
  onOpenChange,
  clinic,
  plans,
}: RenewPlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  // Estados dos Dados Cadastrais da Empresa
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Estados do Plano & Vencimento
  const [actionType, setActionType] =
    useState<RenewClinicPlanInput["actionType"]>("+30d");
  const [customDate, setCustomDate] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customMaxDoctors, setCustomMaxDoctors] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (clinic) {
      // Dados da Empresa
      setName(clinic.name || "");
      setSlug(clinic.slug || "");
      setOwnerName(clinic.owner?.name || "");
      setOwnerEmail(clinic.owner?.email || "");

      // Dados do Plano
      setSelectedPlanId(clinic.plan?.id || (plans[0]?.id ?? ""));
      setCustomMaxDoctors(
        clinic.customMaxDoctors ? String(clinic.customMaxDoctors) : "",
      );
      setNotes(clinic.planNotes || "");
      setActionType("+30d");

      if (clinic.planExpiresAt) {
        const d = new Date(clinic.planExpiresAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setCustomDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setCustomDate("");
      }
    }
  }, [clinic, plans, open]);

  if (!clinic) return null;

  // Salvar Dados Cadastrais (Nome, Slug, Responsável, Email)
  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nome da empresa é obrigatório.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Link/slug de agendamento é obrigatório.");
      return;
    }
    if (!ownerName.trim()) {
      toast.error("Nome do responsável é obrigatório.");
      return;
    }
    if (!ownerEmail.trim()) {
      toast.error("E-mail do responsável é obrigatório.");
      return;
    }

    setSavingCompany(true);
    try {
      const res = await updateClinicInfoAdmin({
        clinicId: clinic.id,
        name: name.trim(),
        slug: slug.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
      });

      if (res?.slug) {
        setSlug(res.slug);
      }

      toast.success("Dados da empresa e do responsável atualizados com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar dados da empresa.");
    } finally {
      setSavingCompany(false);
    }
  };

  // Ação Rápida de Renovação em 1 Clique
  const handleQuickAction = async (type: RenewClinicPlanInput["actionType"]) => {
    setLoading(true);
    try {
      await renewClinicPlan({
        clinicId: clinic.id,
        actionType: type,
        planId: selectedPlanId || undefined,
        customMaxDoctors: customMaxDoctors
          ? Number(customMaxDoctors)
          : undefined,
        notes: notes || undefined,
      });

      const labelMap: Record<string, string> = {
        "+30d": "Plano renovado por +30 dias!",
        "+90d": "Plano renovado por +90 dias!",
        "+1y": "Plano renovado por +1 ano!",
        "+7d_trial": "Período de teste prorrogado por +7 dias!",
        lifetime: "Plano definido como Vitalício!",
        expire: "Plano da clínica expirado/bloqueado com sucesso.",
      };

      toast.success(labelMap[type] || "Plano atualizado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar plano.");
    } finally {
      setLoading(false);
    }
  };

  // Salvar Data Exata no Calendário
  const handleCustomDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) {
      toast.error("Por favor, selecione uma data.");
      return;
    }

    setLoading(true);
    try {
      await renewClinicPlan({
        clinicId: clinic.id,
        actionType: "custom_date",
        customDate: `${customDate}T23:59:59`,
        planId: selectedPlanId || undefined,
        customMaxDoctors: customMaxDoctors
          ? Number(customMaxDoctors)
          : undefined,
        notes: notes || undefined,
      });

      toast.success("Validade do plano atualizada com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar data personalizada.");
    } finally {
      setLoading(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <DialogTitle>Gerenciar Empresa</DialogTitle>
          </div>
          <DialogDescription>
            Empresa: <strong className="text-foreground">{name || clinic.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="empresa" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="empresa" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span>Dados da Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="plano" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Plano & Vencimento</span>
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: DADOS DA EMPRESA */}
          <TabsContent value="empresa" className="space-y-4 focus-visible:outline-none">
            <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nome da Empresa / Clínica</Label>
                <div className="relative mt-1">
                  <Input
                    id="companyName"
                    placeholder="Ex: Clínica Sorriso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companySlug">Link de Agendamento Público (Slug)</Label>
                <div className="mt-1 flex items-center rounded-md border bg-muted/40 px-3 text-sm focus-within:ring-2 focus-within:ring-ring">
                  <span className="text-muted-foreground select-none font-mono text-xs">
                    {origin}/agendar/
                  </span>
                  <input
                    id="companySlug"
                    className="flex-1 bg-transparent py-2 pl-1 font-mono text-xs font-semibold outline-none"
                    placeholder="nome-da-clinica"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Este é o link que a clínica compartilha com os pacientes para agendamentos online.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <Label htmlFor="ownerName" className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Nome do Responsável
                  </Label>
                  <Input
                    id="ownerName"
                    placeholder="Ex: Dra. Mariana Costa"
                    className="mt-1"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerEmail" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    E-mail do Responsável
                  </Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="Ex: mariana@clinica.com"
                    className="mt-1"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    E-mail de acesso/login do responsável no sistema.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button
                  type="submit"
                  disabled={savingCompany}
                  className="gap-2"
                >
                  {savingCompany ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Dados da Empresa
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* ABA 2: PLANO & VENCIMENTO */}
          <TabsContent value="plano" className="space-y-6 focus-visible:outline-none">
            {/* Card de Status Atual */}
            <div className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">
                  Status Atual:
                </span>
                <span className="font-semibold capitalize">
                  {clinic.planStatus === "trial"
                    ? "Em Período de Teste"
                    : clinic.planStatus === "active"
                      ? "Assinante Ativo"
                      : clinic.planStatus === "expired"
                        ? "Expirado / Bloqueado"
                        : "Vitalício"}
                </span>
              </div>
              {clinic.planExpiresAt && clinic.planStatus !== "lifetime" && (
                <div className="text-right">
                  <span className="text-muted-foreground block text-xs">
                    Vencimento Atual:
                  </span>
                  <span className="font-semibold">
                    {new Date(clinic.planExpiresAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>

            {/* Ações Rápidas de 1 Clique */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Renovação Rápida em 1 Clique
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => handleQuickAction("+30d")}
                  disabled={loading}
                >
                  <CalendarDays className="w-4 h-4 text-emerald-500" />
                  <span>+30 Dias</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => handleQuickAction("+90d")}
                  disabled={loading}
                >
                  <CalendarDays className="w-4 h-4 text-emerald-500" />
                  <span>+90 Dias</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => handleQuickAction("+1y")}
                  disabled={loading}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>+1 Ano</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 hover:border-blue-500 hover:text-blue-600"
                  onClick={() => handleQuickAction("+7d_trial")}
                  disabled={loading}
                >
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>+7 Dias de Teste</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 hover:border-purple-500 hover:text-purple-600"
                  onClick={() => handleQuickAction("lifetime")}
                  disabled={loading}
                >
                  <InfinityIcon className="w-4 h-4 text-purple-500" />
                  <span>Tornar Vitalício</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 text-rose-600 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  onClick={() => handleQuickAction("expire")}
                  disabled={loading}
                >
                  <Lock className="w-4 h-4" />
                  <span>Bloquear Agora</span>
                </Button>
              </div>
            </div>

            {/* Vínculo de Plano e Limites Customizados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t pt-5">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="selectedPlan">Plano Associado</Label>
                <Select
                  value={selectedPlanId}
                  onValueChange={(val) => setSelectedPlanId(val)}
                >
                  <SelectTrigger id="selectedPlan" className="w-full">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (R$ {p.price}/mês)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="customMaxDoctors">
                  Limite Especial de Médicos (Opcional)
                </Label>
                <Input
                  id="customMaxDoctors"
                  type="number"
                  min={0}
                  placeholder="Padrão do plano"
                  value={customMaxDoctors}
                  onChange={(e) => setCustomMaxDoctors(e.target.value)}
                  className="w-full"
                />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Deixe vazio para usar o limite do plano.
                </p>
              </div>
            </div>

            {/* Data Específica no Calendário */}
            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="customDate">Ou Definir Data Exata de Vencimento</Label>
              <div className="flex gap-2">
                <Input
                  id="customDate"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading || !customDate}
                  onClick={handleCustomDateSubmit}
                  className="shrink-0"
                >
                  Aplicar Data
                </Button>
              </div>
            </div>

            {/* Observações Internas */}
            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="planNotes">Anotações Internas do Administrador</Label>
              <Textarea
                id="planNotes"
                rows={2}
                placeholder="Ex: Pagamento recebido via Pix Nubank em 15/10. Contato: Dr. João"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                type="button"
                onClick={() =>
                  handleQuickAction(
                    clinic.planStatus === "lifetime" ? "lifetime" : "+30d",
                  )
                }
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações do Plano
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading || savingCompany}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
