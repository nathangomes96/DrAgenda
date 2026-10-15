"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Lock,
  Search,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RenewPlanDialog } from "./renew-plan-dialog";

interface ClinicItem {
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
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  doctorsCount: number;
  createdAt: Date | string;
}

interface ClinicsTableProps {
  clinics: ClinicItem[];
  plans: Array<{
    id: string;
    name: string;
    price: string;
    maxDoctors: number;
  }>;
}

export function ClinicsTable({ clinics, plans }: ClinicsTableProps) {
  const [search, setSearch] = useState("");
  const [selectedClinic, setSelectedClinic] = useState<ClinicItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredClinics = useMemo(() => {
    if (!search.trim()) return clinics;
    const term = search.toLowerCase().trim();
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.slug && c.slug.toLowerCase().includes(term)) ||
        (c.owner && c.owner.email.toLowerCase().includes(term)) ||
        (c.owner && c.owner.name.toLowerCase().includes(term)),
    );
  }, [clinics, search]);

  const handleCopyLink = (c: ClinicItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/agendar/${c.slug || c.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(c.id);
    toast.success("Link público da clínica copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenRenew = (clinic: ClinicItem) => {
    setSelectedClinic(clinic);
    setDialogOpen(true);
  };

  const getStatusBadge = (clinic: ClinicItem) => {
    if (clinic.planStatus === "lifetime") {
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30">
          Vitalício
        </Badge>
      );
    }

    if (!clinic.planExpiresAt) {
      return <Badge variant="secondary">Sem data</Badge>;
    }

    const expiresAt = new Date(clinic.planExpiresAt);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (clinic.planStatus === "expired" || diffDays <= 0) {
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30">
          Expirado
        </Badge>
      );
    }

    if (clinic.planStatus === "trial") {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
          Trial ({diffDays}d)
        </Badge>
      );
    }

    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
        Ativo ({diffDays}d)
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, slug ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Total: <strong>{filteredClinics.length}</strong> empresas cadastradas
          </span>
        </div>
      </div>

      {/* Tabela de Clínicas */}
      <div className="border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa / Link</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Plano & Limites</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClinics.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhuma empresa encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredClinics.map((clinic) => {
                const maxDoctors =
                  clinic.customMaxDoctors ?? clinic.plan?.maxDoctors ?? 3;

                return (
                  <TableRow key={clinic.id}>
                    {/* Nome & Link */}
                    <TableCell>
                      <div className="font-semibold text-sm">
                        {clinic.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">
                          /agendar/{clinic.slug || clinic.id.slice(0, 8)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyLink(clinic)}
                          title="Copiar link de agendamento"
                        >
                          {copiedId === clinic.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>

                    {/* Dono / Responsável */}
                    <TableCell>
                      <div className="text-sm font-medium">
                        {clinic.owner?.name || "Sem responsável"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {clinic.owner?.email || "—"}
                      </div>
                    </TableCell>

                    {/* Plano & Médicos */}
                    <TableCell>
                      <div className="text-sm font-medium">
                        {clinic.plan?.name || "Plano Padrão"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Stethoscope className="w-3 h-3" />
                        <span>
                          {clinic.doctorsCount} /{" "}
                          {maxDoctors === 0 ? "∞" : maxDoctors} profissionais
                        </span>
                      </div>
                    </TableCell>

                    {/* Validade */}
                    <TableCell>
                      {clinic.planStatus === "lifetime" ? (
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          Nunca expira
                        </span>
                      ) : clinic.planExpiresAt ? (
                        <div className="text-xs">
                          <span className="font-medium">
                            {new Date(clinic.planExpiresAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {clinic.planNotes && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px] mt-0.5" title={clinic.planNotes}>
                          Obs: {clinic.planNotes}
                        </p>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(clinic)}</TableCell>

                    {/* Ações */}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
                        onClick={() => handleOpenRenew(clinic)}
                      >
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        Editar / Renovar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <RenewPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clinic={selectedClinic}
        plans={plans}
      />
    </div>
  );
}
