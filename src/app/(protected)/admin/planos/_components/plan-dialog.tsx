"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { createOrUpdatePlan, type PlanInput } from "@/actions/admin/plans";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planToEdit?: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    interval?: string;
    maxDoctors: number;
    maxPatients: number;
    isPopular: boolean;
    isActive: boolean;
    features: string[] | null;
  } | null;
}

export function PlanDialog({
  open,
  onOpenChange,
  planToEdit,
}: PlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "59,90",
    maxDoctors: 3,
    maxPatients: 0,
    isPopular: false,
    isActive: true,
    featuresText: "",
  });

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        name: planToEdit.name,
        description: planToEdit.description || "",
        price: planToEdit.price,
        maxDoctors: planToEdit.maxDoctors,
        maxPatients: planToEdit.maxPatients,
        isPopular: planToEdit.isPopular,
        isActive: planToEdit.isActive,
        featuresText: (planToEdit.features || []).join("\n"),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "59,90",
        maxDoctors: 3,
        maxPatients: 0,
        isPopular: false,
        isActive: true,
        featuresText: [
          "Agendamentos online ilimitados",
          "Lembretes e confirmações no WhatsApp",
          "Prontuário eletrônico completo",
        ].join("\n"),
      });
    }
  }, [planToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const features = formData.featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const payload: PlanInput = {
        id: planToEdit?.id,
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        interval: "month",
        maxDoctors: Number(formData.maxDoctors) || 0,
        maxPatients: Number(formData.maxPatients) || 0,
        isPopular: formData.isPopular,
        isActive: formData.isActive,
        features,
      };

      await createOrUpdatePlan(payload);
      toast.success(
        planToEdit
          ? "Plano atualizado com sucesso!"
          : "Novo plano criado com sucesso!",
      );
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar o plano.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {planToEdit ? "Editar Plano" : "Criar Novo Plano"}
          </DialogTitle>
          <DialogDescription>
            Configure o preço, limite de médicos e recursos disponíveis para as clínicas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="planName">Nome do Plano</Label>
            <Input
              id="planName"
              placeholder="Ex: Plano Profissional"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="planDescription">Descrição Breve</Label>
            <Input
              id="planDescription"
              placeholder="Ex: Ideal para clínicas e policlínicas"
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planPrice">Preço Mensal (R$)</Label>
              <Input
                id="planPrice"
                placeholder="59,90"
                value={formData.price}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, price: e.target.value }))
                }
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="maxDoctors">Limite de Médicos</Label>
              <Input
                id="maxDoctors"
                type="number"
                min={0}
                placeholder="3 (0 para ilimitado)"
                value={formData.maxDoctors}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    maxDoctors: Number(e.target.value),
                  }))
                }
                required
                className="mt-1"
              />
              <span className="text-[11px] text-muted-foreground">
                Digite 0 para ilimitado.
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="maxPatients">Limite de Pacientes</Label>
            <Input
              id="maxPatients"
              type="number"
              min={0}
              placeholder="0 (0 para ilimitado)"
              value={formData.maxPatients}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  maxPatients: Number(e.target.value),
                }))
              }
              required
              className="mt-1"
            />
            <span className="text-[11px] text-muted-foreground">
              Geralmente 0 (ilimitado) em modelos SaaS de agendamento.
            </span>
          </div>

          <div>
            <Label htmlFor="featuresText">
              Recursos & Benefícios (um por linha)
            </Label>
            <Textarea
              id="featuresText"
              rows={4}
              placeholder="Até 3 médicos inclusos&#10;Agendamentos ilimitados&#10;Lembretes via WhatsApp"
              value={formData.featuresText}
              onChange={(e) =>
                setFormData((p) => ({ ...p, featuresText: e.target.value }))
              }
              className="mt-1 text-sm font-mono"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="space-y-0.5">
              <Label htmlFor="isPopular">Destacar como Mais Popular</Label>
              <p className="text-xs text-muted-foreground">
                Exibe selo de destaque nos cards de assinatura.
              </p>
            </div>
            <Switch
              id="isPopular"
              checked={formData.isPopular}
              onCheckedChange={(c) =>
                setFormData((p) => ({ ...p, isPopular: c }))
              }
            />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Plano Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Planos inativos não aparecem para novos clientes assinarem.
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(c) =>
                setFormData((p) => ({ ...p, isActive: c }))
              }
            />
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {planToEdit ? "Salvar Alterações" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
