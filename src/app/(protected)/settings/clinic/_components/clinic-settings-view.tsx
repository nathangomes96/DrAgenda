"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Hash,
  Info,
  Link2,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { updateClinicProfile } from "@/actions/update-clinic-profile";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clinicsTable } from "@/db/schema";

interface ClinicSettingsViewProps {
  clinic: typeof clinicsTable.$inferSelect;
  userRole?: string;
}

export function ClinicSettingsView({
  clinic,
  userRole = "admin",
}: ClinicSettingsViewProps) {
  const [name, setName] = useState(clinic.name);
  const [slug, setSlug] = useState(clinic.slug || "");
  const [copied, setCopied] = useState(false);

  const isAdmin = userRole === "admin";
  const activeIdentifier = slug || clinic.slug || clinic.id;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${baseUrl}/agendar/${activeIdentifier}`;

  const { execute, isExecuting } = useAction(updateClinicProfile, {
    onSuccess: ({ data }) => {
      if (data?.clinic) {
        setName(data.clinic.name);
        setSlug(data.clinic.slug || "");
        toast.success("Dados da clínica atualizados com sucesso!");
        // Atualiza a página para refletir o novo nome no sidebar e header
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar os dados da clínica.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("O nome da clínica não pode ficar vazio.");
      return;
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    execute({
      name: name.trim(),
      slug: cleanSlug,
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link público da clínica copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="border-2 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/40 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Building2 className="size-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Dados & Identidade da Clínica</CardTitle>
              <CardDescription className="text-xs">
                Atualize o nome oficial da clínica e o link público de agendamento online compartilhado com os pacientes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-6">
            {/* Nome da Clínica */}
            <div className="space-y-2">
              <Label htmlFor="clinicName" className="text-xs font-semibold flex items-center gap-1.5">
                Nome da Clínica *
              </Label>
              <Input
                id="clinicName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clínica Vida & Saúde"
                disabled={!isAdmin || isExecuting}
                className="font-medium text-sm"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Este nome será exibido no topo da página de agendamentos online, nos cabeçalhos de prontuários e nas mensagens enviadas aos pacientes.
              </p>
            </div>

            {/* Link Personalizado (Slug) */}
            <div className="space-y-2">
              <Label htmlFor="clinicSlug" className="text-xs font-semibold flex items-center gap-1.5">
                <Globe className="size-3.5 text-primary" /> Link Personalizado de Agendamento (Slug)
              </Label>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-muted/40 border rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20">
                <span className="text-muted-foreground select-none">/agendar/</span>
                <input
                  id="clinicSlug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="nome-da-sua-clinica"
                  disabled={!isAdmin || isExecuting}
                  className="bg-transparent border-none outline-none font-bold text-foreground w-full placeholder:text-muted-foreground/50 lowercase font-mono"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Use letras minúsculas, números e hífens. Exemplo: <strong className="font-mono">clinica-saude-total</strong>
              </p>
            </div>

            {/* Caixa de Pré-visualização do Link */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Link2 className="size-3.5 text-primary" /> Endereço Público Atual
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-6 text-[11px] gap-1 text-primary hover:text-primary"
                >
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3" /> Testar no Navegador
                  </a>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={publicUrl}
                  className="bg-background text-xs font-mono select-all h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={copied ? "default" : "secondary"}
                  className="h-9 shrink-0 gap-1.5 text-xs font-semibold"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Informações Técnicas da Clínica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Hash className="size-3.5" /> Identificador Único (ID)
                </span>
                <code className="text-[11px] font-mono bg-muted p-1 rounded-md block truncate">
                  {clinic.id}
                </code>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3.5" /> Data de Cadastro
                </span>
                <p className="font-medium text-foreground">
                  {format(new Date(clinic.createdAt), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>

          {isAdmin ? (
            <CardFooter className="flex items-center justify-between border-t pt-4 bg-muted/20">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="size-3.5 text-primary" />
                Alterações de nome refletem imediatamente em todos os relatórios e mensagens.
              </span>

              <Button
                type="submit"
                size="sm"
                className="gap-2 font-bold shadow-md"
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          ) : (
            <CardFooter className="border-t pt-4 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Apenas usuários administradores podem modificar o nome e link oficial da clínica.
              </p>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
