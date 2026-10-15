"use client";

import { useState } from "react";
import { Check, Edit, Plus, Power, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { togglePlanActive } from "@/actions/admin/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PlanDialog } from "./plan-dialog";

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
  clinicsCount: number;
}

interface PlansTableProps {
  plans: PlanItem[];
}

export function PlansTable({ plans }: PlansTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  const handleEdit = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await togglePlanActive(id, currentStatus);
      toast.success(
        currentStatus ? "Plano desativado!" : "Plano ativado com sucesso!",
      );
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status do plano.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Plano
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Plano</TableHead>
              <TableHead>Preço Mensal</TableHead>
              <TableHead>Limite de Médicos</TableHead>
              <TableHead>Limite de Pacientes</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum plano cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{plan.name}</span>
                      {plan.isPopular && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1 py-0 h-4"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                        {plan.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {plan.price}
                    <span className="text-xs text-muted-foreground font-normal">
                      /mês
                    </span>
                  </TableCell>
                  <TableCell>
                    {plan.maxDoctors === 0 ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        Ilimitado
                      </Badge>
                    ) : (
                      <span className="font-medium text-sm">
                        Até {plan.maxDoctors} {plan.maxDoctors === 1 ? "médico" : "médicos"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {plan.maxPatients === 0 ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        Ilimitado
                      </Badge>
                    ) : (
                      <span className="font-medium text-sm">
                        Até {plan.maxPatients} pacientes
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{plan.clinicsCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                      title="Editar Plano"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleToggleActive(plan.id, plan.isActive)
                      }
                      title={plan.isActive ? "Desativar Plano" : "Ativar Plano"}
                    >
                      <Power
                        className={`w-4 h-4 ${
                          plan.isActive ? "text-amber-500" : "text-emerald-500"
                        }`}
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        planToEdit={selectedPlan}
      />
    </div>
  );
}
