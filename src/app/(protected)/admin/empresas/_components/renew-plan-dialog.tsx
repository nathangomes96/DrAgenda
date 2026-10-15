"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  renewClinicPlan,
  type RenewClinicPlanInput,
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
  const [actionType, setActionType] =
    useState<RenewClinicPlanInput["actionType"]>("+30d");
  const [customDate, setCustomDate] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customMaxDoctors, setCustomMaxDoctors] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (clinic) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Gerenciar Plano da Empresa</DialogTitle>
          </div>
          <DialogDescription>
            Empresa: <strong className="text-foreground">{clinic.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
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
                <span>+30 Dias (Mensal)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 justify-start gap-2 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={() => handleQuickAction("+90d")}
                disabled={loading}
              >
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                <span>+90 Dias (Trimestral)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 justify-start gap-2 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={() => handleQuickAction("+1y")}
                disabled={loading}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>+1 Ano (Anual)</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <Label htmlFor="selectedPlan">Plano Associado</Label>
              <Select
                value={selectedPlanId}
                onValueChange={(val) => setSelectedPlanId(val)}
              >
                <SelectTrigger id="selectedPlan" className="mt-1">
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

            <div>
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
                className="mt-1"
              />
              <span className="text-[11px] text-muted-foreground">
                Deixe vazio para usar o limite do plano.
              </span>
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
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Fechar
          </Button>
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
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
