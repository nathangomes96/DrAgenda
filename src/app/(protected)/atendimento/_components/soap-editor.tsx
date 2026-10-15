"use client";

import { useState } from "react";
import { BookOpen, FileEdit, FolderOpen, Layers, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SoapData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  freeText: string;
}

interface SoapEditorProps {
  data: SoapData;
  onChange: (field: keyof SoapData, value: string) => void;
  mode: "soap" | "free";
  onModeChange: (mode: "soap" | "free") => void;
}

// Frases clínicas pré-configuradas para preenchimento ágil
const QUICK_PHRASES = {
  subjective: [
    { label: "Paciente assintomático", text: "Paciente assintomático, comparece em bom estado geral para consulta de rotina." },
    { label: "Sintomas respiratórios", text: "Refere tosse seca, coriza hialina e febrícula há 3 dias. Nega dispneia ou dor torácica." },
    { label: "Palpitações e cansaço", text: "Refere palpitações aos médios esforços há cerca de 2 semanas, sem síncope. Hipertenso em uso regular de medicação." },
    { label: "Dor lombar / osteomuscular", text: "Queixa-se de dor lombar de início insidioso, com piora ao final do dia. Nega irradiação para membros inferiores ou parestesia." },
  ],
  objective: [
    { label: "Exame Físico Normal / BEG", text: "BEG, LOTE, corado, hidratado, anictérico, acianótico, afebril, eupneico.\nACV: RCR em 2T, BNF sem sopros.\nAR: MV universalmente audível, sem ruídos adventícios.\nAbdome: Plano, flácido, indolor à palpação, RHA presentes.\nExtremidades: Livres de edemas, pulsos periféricos amplos e simétricos." },
    { label: "Arritmia / Palpitações", text: "BEG, corado, hidratado. PA 138/86 mmHg, FC 92 bpm irregular. Ausculta: ritmo irregular, sem sopros. MV presente sem RA." },
    { label: "Hipertensão Leve", text: "BEG, orientado. Níveis pressóricos elevados na consulta (PA 150/95 mmHg), restante do exame físico sem anormalidades agudas." },
  ],
  assessment: [
    { label: "Rotina / Check-up", text: "Exame médico preventivo de rotina / Check-up periódico (Z00.0)." },
    { label: "Arritmia cardíaca", text: "Fibrilação atrial a esclarecer. Hipertensão arterial sistêmica controlada." },
    { label: "IVAS / Resfriado comum", text: "Infecção de vias aéreas superiores de provável etiologia viral (J06.9)." },
    { label: "Lombalgia mecânica", text: "Lombalgia aguda de característica mecânico-postural (M54.5)." },
  ],
  plan: [
    { label: "Solicitação exames de rotina", text: "1. Solicitados exames laboratoriais: Hemograma completo, Glicemia, Perfil lipídico, Creatinina, TSH, Urina tipo I.\n2. Orientações sobre estilo de vida e dieta balanceada.\n3. Retorno com exames em 30 dias." },
    { label: "Conduta Cardiológica", text: "1. Solicitado ECG de 12 derivações, Holter 24h e Ecocardiograma transtorácico.\n2. Mantida medicação anti-hipertensiva habitual.\n3. Orientado pronto atendimento em caso de dor torácica típica ou síncope." },
    { label: "Tratamento Sintomático", text: "1. Hidratação oral abundante e repouso relativo.\n2. Prescrito analgésico e antitérmico se dor ou febre.\n3. Retorno se sinais de alarme ou febre persistente após 72h." },
  ],
};

export function SoapEditor({
  data,
  onChange,
  mode,
  onModeChange,
}: SoapEditorProps) {
  const insertPhrase = (field: keyof SoapData, text: string) => {
    const current = data[field] || "";
    const updated = current.trim() ? `${current}\n${text}` : text;
    onChange(field, updated);
  };

  return (
    <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
      {/* Header com Abas SOAP x Texto Livre */}
      <div className="flex items-center justify-between p-3.5 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <FileEdit className="size-4 text-primary" />
          <span className="font-bold text-xs uppercase tracking-wider text-foreground">
            Evolução do Paciente
          </span>
        </div>

        <Tabs value={mode} onValueChange={(val: any) => onModeChange(val)}>
          <TabsList className="bg-muted p-1 h-8 rounded-xl">
            <TabsTrigger value="soap" className="text-xs h-6 px-3 rounded-lg font-semibold">
              SOAP
            </TabsTrigger>
            <TabsTrigger value="free" className="text-xs h-6 px-3 rounded-lg font-semibold">
              Texto Livre
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo: Modo SOAP (Grid 2x2 amplo) */}
      {mode === "soap" ? (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* S — Subjetivo */}
          <div className="rounded-xl border border-border/80 bg-background overflow-hidden flex flex-col focus-within:border-primary transition-all">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <span className="text-primary font-black">S —</span> Subjetivo
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground">
                    <FolderOpen className="size-3 text-amber-500" />
                    Modelos
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <DropdownMenuLabel>Inserir Frase Rápida</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {QUICK_PHRASES.subjective.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={() => insertPhrase("subjective", item.text)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              value={data.subjective}
              onChange={(e) => onChange("subjective", e.target.value)}
              placeholder="Descreva o que o paciente relata: queixas, história da moléstia atual, sintomas relatados..."
              className="border-0 focus-visible:ring-0 rounded-none p-3 text-xs leading-relaxed resize-none min-h-[140px]"
            />
          </div>

          {/* O — Objetivo */}
          <div className="rounded-xl border border-border/80 bg-background overflow-hidden flex flex-col focus-within:border-primary transition-all">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <span className="text-rose-500 font-black">O —</span> Objetivo (exame físico / SV)
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground">
                    <FolderOpen className="size-3 text-amber-500" />
                    Modelos
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <DropdownMenuLabel>Inserir Exame Físico</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {QUICK_PHRASES.objective.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={() => insertPhrase("objective", item.text)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              value={data.objective}
              onChange={(e) => onChange("objective", e.target.value)}
              placeholder="Descreva os achados do exame físico: ectoscopia, aparelhos cardiovascular, respiratório, abdome..."
              className="border-0 focus-visible:ring-0 rounded-none p-3 text-xs leading-relaxed resize-none min-h-[140px]"
            />
          </div>

          {/* A — Avaliação */}
          <div className="rounded-xl border border-border/80 bg-background overflow-hidden flex flex-col focus-within:border-primary transition-all">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <span className="text-amber-500 font-black">A —</span> Avaliação (raciocínio clínico)
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground">
                    <FolderOpen className="size-3 text-amber-500" />
                    Modelos
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <DropdownMenuLabel>Inserir Diagnóstico Clínico</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {QUICK_PHRASES.assessment.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={() => insertPhrase("assessment", item.text)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              value={data.assessment}
              onChange={(e) => onChange("assessment", e.target.value)}
              placeholder="Hipóteses diagnósticas, correlações clínicas e impressões do médico..."
              className="border-0 focus-visible:ring-0 rounded-none p-3 text-xs leading-relaxed resize-none min-h-[140px]"
            />
          </div>

          {/* P — Plano */}
          <div className="rounded-xl border border-border/80 bg-background overflow-hidden flex flex-col focus-within:border-primary transition-all">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <span className="text-emerald-500 font-black">P —</span> Plano (conduta & terapêutica)
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground">
                    <FolderOpen className="size-3 text-amber-500" />
                    Modelos
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <DropdownMenuLabel>Inserir Plano Terapêutico</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {QUICK_PHRASES.plan.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={() => insertPhrase("plan", item.text)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              value={data.plan}
              onChange={(e) => onChange("plan", e.target.value)}
              placeholder="Tratamento proposto, medicamentos orientados, exames complementares solicitados, cuidados gerais..."
              className="border-0 focus-visible:ring-0 rounded-none p-3 text-xs leading-relaxed resize-none min-h-[140px]"
            />
          </div>
        </div>
      ) : (
        /* Conteúdo: Modo Texto Livre */
        <div className="p-4">
          <Textarea
            value={data.freeText}
            onChange={(e) => onChange("freeText", e.target.value)}
            placeholder="Digite a evolução clínica completa do paciente em formato livre..."
            className="text-xs leading-relaxed rounded-xl min-h-[300px] p-4"
          />
        </div>
      )}
    </div>
  );
}
