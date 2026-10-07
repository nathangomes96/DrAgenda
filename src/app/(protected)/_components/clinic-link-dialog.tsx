"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Globe, Link2, Loader2, Sparkles } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { updateClinicSlug } from "@/actions/update-clinic-slug";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClinicLinkDialogProps {
  clinicName?: string;
  clinicId?: string;
  initialSlug?: string;
  userRole?: "admin" | "doctor" | "receptionist";
}

export function ClinicLinkDialog({
  clinicName = "Sua Clínica",
  clinicId = "",
  initialSlug = "",
  userRole = "admin",
}: ClinicLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState(initialSlug);
  const [isEditing, setIsEditing] = useState(false);

  const activeIdentifier = slug || initialSlug || clinicId;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${baseUrl}/agendar/${activeIdentifier}`;

  const { execute, isExecuting } = useAction(updateClinicSlug, {
    onSuccess: ({ data }) => {
      if (data?.slug) {
        setSlug(data.slug);
        setIsEditing(false);
        toast.success("Link da clínica atualizado com sucesso!");
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar o link da clínica.");
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link público copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlug = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (clean.length < 3) {
      toast.error("O link deve ter no mínimo 3 caracteres.");
      return;
    }

    execute({ slug: clean });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-medium border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all text-primary"
        >
          <Globe className="size-3.5" />
          <span className="truncate">Portal do Paciente</span>
          <span className="ml-auto flex size-2 rounded-full bg-emerald-500 animate-pulse" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Link2 className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            Link de Agendamento Online
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Compartilhe este link com seus pacientes nas redes sociais, WhatsApp e Google Meu Negócio para receber agendamentos 24 horas por dia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Caixa de visualização do Link */}
          <div className="rounded-xl border bg-muted/50 p-3 space-y-2">
            <Label className="text-xs text-muted-foreground">URL Pública da Clínica</Label>
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
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Copiar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Opção de Personalização de Slug (Apenas para Admin) */}
          {userRole === "admin" && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="size-3.5 text-primary" /> Personalizar Link (Slug)
                </span>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Alterar
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveSlug} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="slugInput" className="text-xs text-muted-foreground">
                      Identificador amigável
                    </Label>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-background border rounded-md px-2.5 py-1">
                      <span>/agendar/</span>
                      <input
                        id="slugInput"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="nome-da-sua-clinica"
                        className="bg-transparent border-none outline-none font-bold text-foreground w-full placeholder:text-muted-foreground/50 lowercase"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Use letras minúsculas, números e hífens. Ex: clinica-vida-saudavel
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setSlug(initialSlug);
                        setIsEditing(false);
                      }}
                      disabled={isExecuting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 text-xs gap-1.5 font-semibold"
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" /> Salvando...
                        </>
                      ) : (
                        "Salvar Novo Link"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Seu link amigável atual é: <strong className="text-foreground">/agendar/{activeIdentifier}</strong>. Pacientes podem acessar diretamente sem precisar de códigos longos.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t pt-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Abrir no Navegador
            </a>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
