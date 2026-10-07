"use client";

import { useEffect, useState } from "react";
import {
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

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

import {
  BUILTIN_CLINICAL_TEMPLATES,
  ClinicalTemplate,
  deleteCustomTemplate,
  getCustomTemplates,
  QUICK_CLINICAL_PHRASES,
  QuickPhrase,
  saveCustomTemplate,
} from "./clinical-templates";

interface ClinicalTemplatesBarProps {
  currentFormState: {
    recordType: "medical" | "dental" | "general";
    symptoms: string;
    diagnosis: string;
    treatmentPlan: string;
    prescription: string;
    notes: string;
    procedureName?: string;
    teeth?: string;
    materialsUsed?: string;
    postOpInstructions?: string;
  };
  onApplyTemplate: (template: ClinicalTemplate) => void;
  onInsertPhrase: (phrase: QuickPhrase) => void;
}

export function ClinicalTemplatesBar({
  currentFormState,
  onApplyTemplate,
  onInsertPhrase,
}: ClinicalTemplatesBarProps) {
  const [customTemplates, setCustomTemplates] = useState<ClinicalTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isPhrasesOpen, setIsPhrasesOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState<"medical" | "dental" | "general">("medical");

  // Carrega modelos customizados salvos no navegador
  useEffect(() => {
    setCustomTemplates(getCustomTemplates());
  }, []);

  const allTemplates = [...customTemplates, ...BUILTIN_CLINICAL_TEMPLATES];

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = allTemplates.find((t) => t.id === templateId);
    if (!found) return;

    // Se o usuário já tiver notas digitadas, alerta de substituição
    if (currentFormState.notes.trim().length > 25) {
      if (
        !confirm(
          `Deseja aplicar o modelo "${found.title}"? O texto base estruturado será carregado nos campos.`,
        )
      ) {
        return;
      }
    }

    onApplyTemplate(found);
    toast.success(`Modelo "${found.title}" aplicado com sucesso!`);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) {
      toast.error("Informe um nome para o modelo da clínica.");
      return;
    }
    if (!currentFormState.notes.trim() && !currentFormState.symptoms.trim()) {
      toast.error("Preencha ao menos a evolução ou queixa antes de salvar um modelo.");
      return;
    }

    const saved = saveCustomTemplate({
      title: newTemplateTitle.trim(),
      badge: "Clínica",
      category: newTemplateCategory,
      description: `Modelo personalizado criado em ${new Date().toLocaleDateString("pt-BR")}`,
      defaults: {
        recordType: currentFormState.recordType,
        symptoms: currentFormState.symptoms,
        diagnosis: currentFormState.diagnosis,
        treatmentPlan: currentFormState.treatmentPlan,
        prescription: currentFormState.prescription,
        notes: currentFormState.notes,
        procedureName: currentFormState.procedureName,
        teeth: currentFormState.teeth,
        materialsUsed: currentFormState.materialsUsed,
        postOpInstructions: currentFormState.postOpInstructions,
      },
    });

    setCustomTemplates(getCustomTemplates());
    setSaveModalOpen(false);
    setNewTemplateTitle("");
    toast.success(`Modelo "${saved.title}" salvo com sucesso para uso futuro!`);
  };

  const handleDeleteCustom = (templateId: string, title: string) => {
    if (confirm(`Deseja excluir o modelo personalizado "${title}"?`)) {
      const updated = deleteCustomTemplate(templateId);
      setCustomTemplates(updated);
      toast.success("Modelo removido.");
    }
  };

  return (
    <div className="rounded-2xl border bg-linear-to-r from-emerald-500/10 via-card to-teal-500/5 p-3.5 space-y-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Zap className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
                Modelos Clínicos & Documentação Rápida
              </span>
              <Badge variant="outline" className="text-[10px] bg-background font-semibold">
                Menos Digitação
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Carregue templates prontos de consulta em 1 clique ou insira frases frequentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-background font-semibold hover:border-emerald-500/50"
            onClick={() => setSaveModalOpen(true)}
            title="Salvar o conteúdo atual como um novo modelo da clínica"
          >
            <BookmarkPlus className="size-3.5 text-emerald-600" />
            Salvar Meu Modelo
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 text-primary hover:bg-primary/10"
            onClick={() => setIsPhrasesOpen(!isPhrasesOpen)}
          >
            <Sparkles className="size-3.5" />
            {isPhrasesOpen ? "Ocultar Frases" : "Frases Frequentes"}
            {isPhrasesOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>
      </div>

      {/* SELETOR DE MODELOS EM BOTÕES RÁPIDOS E DROPDOWN */}
      <div className="space-y-2 pt-1 border-t">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1">
            <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Selecione um modelo clínico padronizado..." />
              </SelectTrigger>
              <SelectContent>
                {customTemplates.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Modelos da Sua Clínica
                    </div>
                    {customTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        ⭐ {t.title}
                      </SelectItem>
                    ))}
                    <div className="my-1 border-t" />
                  </>
                )}

                <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                  Modelos do Sistema (ClinicSuite)
                </div>
                {BUILTIN_CLINICAL_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.category === "dental" ? "🦷" : t.category === "medical" ? "🩺" : "⚡"}{" "}
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Atalhos Rápidos mais comuns em pills */}
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 bg-background hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
              onClick={() => handleSelectTemplate("anamnese-completa")}
            >
              🩺 1ª Consulta
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 bg-background hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
              onClick={() => handleSelectTemplate("retorno-acompanhamento")}
            >
              🔄 Retorno
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 bg-background hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
              onClick={() => handleSelectTemplate("renovacao-cronicos")}
            >
              💊 Crônicos / HAS
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 bg-background hover:bg-cyan-500/10 hover:text-cyan-700 hover:border-cyan-300"
              onClick={() => handleSelectTemplate("odonto-restauracao")}
            >
              🦷 Restauração
            </Button>
          </div>
        </div>

        {/* Gerenciamento rápido de modelos customizados caso existam */}
        {customTemplates.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground">Meus Modelos:</span>
            {customTemplates.map((t) => (
              <Badge
                key={t.id}
                variant="secondary"
                className="text-[10px] py-0.5 px-2 gap-1 cursor-pointer hover:bg-muted"
                onClick={() => handleSelectTemplate(t.id)}
              >
                <span>⭐ {t.title}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustom(t.id, t.title);
                  }}
                  className="text-muted-foreground hover:text-destructive ml-0.5"
                  title="Excluir este modelo"
                >
                  <Trash2 className="size-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* BARRA EXPANSÍVEL DE FRASES FREQUENTES (MACROS DE 1 CLIQUE) */}
      {isPhrasesOpen && (
        <div className="rounded-xl border bg-background/90 p-3 space-y-2 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" />
              Clique em uma frase para anexar diretamente:
            </span>
            <span className="text-[10px] text-muted-foreground">
              Economiza tempo e padroniza a redação clínica
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_CLINICAL_PHRASES.map((phrase) => (
              <Button
                key={phrase.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-6.5 text-[11px] px-2 gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40 font-normal"
                onClick={() => {
                  onInsertPhrase(phrase);
                  toast.success(`Frase "${phrase.label}" inserida!`);
                }}
              >
                <span>+</span>
                <span>{phrase.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PARA SALVAR NOVO MODELO DA CLÍNICA */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookmarkPlus className="size-5 text-emerald-600" />
              Salvar como Modelo da Clínica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Transforme as anotações, conduta e prescrição preenchidas agora em um modelo permanente da sua clínica.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustom} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Modelo *</Label>
              <Input
                placeholder="Ex: Consulta Cardiológica Inicial, Pré-Natal 1º Trimestre..."
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Categoria</Label>
              <Select
                value={newTemplateCategory}
                onValueChange={(val: any) => setNewTemplateCategory(val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Consulta Médica</SelectItem>
                  <SelectItem value="dental">Odontologia</SelectItem>
                  <SelectItem value="general">Geral / Multiprofissional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1 border">
              <p className="font-semibold text-foreground">Campos que serão salvos no modelo:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Queixa Principal ({currentFormState.symptoms ? "Preenchida" : "Em branco"})</li>
                <li>Diagnóstico / CID ({currentFormState.diagnosis ? "Preenchido" : "Em branco"})</li>
                <li>Prescrição ({currentFormState.prescription ? "Preenchida" : "Em branco"})</li>
                <li>Evolução / Notas ({currentFormState.notes ? `${currentFormState.notes.length} caracteres` : "Em branco"})</li>
              </ul>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSaveModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="font-bold gap-1.5">
                <Check className="size-4" /> Salvar Modelo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
