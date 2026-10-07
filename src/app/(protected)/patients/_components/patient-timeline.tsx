"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  HeartPulse,
  Layers,
  Lock,
  MessageCircle,
  Pill,
  Printer,
  RotateCw,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

interface MedicalRecordItem {
  id: string;
  recordType: "medical" | "dental" | "general";
  createdAt: string | Date;
  bloodPressure?: string | null;
  heartRate?: string | null;
  temperature?: string | null;
  weight?: string | null;
  height?: string | null;
  teeth?: string | null;
  procedureName?: string | null;
  materialsUsed?: string | null;
  postOpInstructions?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  prescription?: string | null;
  notes: string;
  doctor?: typeof doctorsTable.$inferSelect | null;
  appointment?: typeof appointmentsTable.$inferSelect | null;
}

interface PatientTimelineProps {
  patient: typeof patientsTable.$inferSelect;
  records: MedicalRecordItem[];
  appointments?: (typeof appointmentsTable.$inferSelect & {
    doctor?: typeof doctorsTable.$inferSelect | null;
  })[];
  userRole?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onDeleteRecord?: (id: string) => void;
  onNewRecordForAppointment?: (appointmentId: string, doctorId: string) => void;
  onOpenNewTab: () => void;
}

export function PatientTimeline({
  patient,
  records,
  appointments = [],
  userRole = "admin",
  isLoading = false,
  onRefresh,
  onDeleteRecord,
  onNewRecordForAppointment,
  onOpenNewTab,
}: PatientTimelineProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "medical" | "dental" | "general" | "prescriptions">("all");
  const [expandedRecordIds, setExpandedRecordIds] = useState<Record<string, boolean>>({});

  // Ordena os registros do mais recente ao mais antigo
  const sortedRecords = useMemo(() => {
    return [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [records]);

  // Primeiro e último atendimento
  const oldestRecord = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1] : null;
  const newestRecord = sortedRecords.length > 0 ? sortedRecords[0] : null;

  // Lista única de médicos que atenderam este paciente
  const involvedDoctors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; specialty: string }>();
    sortedRecords.forEach((r) => {
      if (r.doctor) {
        map.set(r.doctor.id, {
          id: r.doctor.id,
          name: r.doctor.name,
          specialty: r.doctor.specialty,
        });
      }
    });
    return Array.from(map.values());
  }, [sortedRecords]);

  // Filtro inteligente por texto e tipo
  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((rec) => {
      // Filtro de tipo
      if (typeFilter === "medical" && rec.recordType !== "medical") return false;
      if (typeFilter === "dental" && rec.recordType !== "dental") return false;
      if (typeFilter === "general" && rec.recordType !== "general") return false;
      if (typeFilter === "prescriptions" && !rec.prescription) return false;

      // Filtro de busca textual
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();

      return Boolean(
        rec.doctor?.name?.toLowerCase().includes(q) ||
        rec.doctor?.specialty?.toLowerCase().includes(q) ||
        rec.symptoms?.toLowerCase().includes(q) ||
        rec.diagnosis?.toLowerCase().includes(q) ||
        rec.treatmentPlan?.toLowerCase().includes(q) ||
        rec.prescription?.toLowerCase().includes(q) ||
        rec.notes?.toLowerCase().includes(q) ||
        rec.procedureName?.toLowerCase().includes(q) ||
        rec.teeth?.toLowerCase().includes(q)
      );
    });
  }, [sortedRecords, typeFilter, searchTerm]);

  // Alterna expansão de um card
  const toggleExpand = (id: string) => {
    setExpandedRecordIds((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Expandir / Recolher Todos
  const handleToggleAll = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    filteredRecords.forEach((r) => {
      newState[r.id] = expand;
    });
    setExpandedRecordIds(newState);
  };

  // Copia texto com toast
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiada com sucesso!`);
  };

  // Copia resumo completo do atendimento
  const copyFullRecordSummary = (rec: MedicalRecordItem) => {
    const dateStr = format(new Date(rec.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const doctorStr = rec.doctor ? `Dr(a). ${rec.doctor.name} (${rec.doctor.specialty})` : "Profissional Clínico";

    let text = `📄 RESUMO DE ATENDIMENTO CLÍNICO\n`;
    text += `Paciente: ${patient.name}\n`;
    text += `Data: ${dateStr}\n`;
    text += `Profissional: ${doctorStr}\n`;
    text += `Tipo: ${rec.recordType === "dental" ? "Odontológico" : rec.recordType === "medical" ? "Médico" : "Multiprofissional"}\n\n`;

    if (rec.symptoms) text += `📌 Queixa: ${rec.symptoms}\n`;
    if (rec.diagnosis) text += `🎯 Diagnóstico: ${rec.diagnosis}\n`;
    if (rec.prescription) text += `💊 Prescrição:\n${rec.prescription}\n\n`;
    if (rec.treatmentPlan) text += `📝 Conduta: ${rec.treatmentPlan}\n`;
    if (rec.procedureName) text += `🦷 Procedimento: ${rec.procedureName} (Dente: ${rec.teeth || "Geral"})\n`;

    navigator.clipboard.writeText(text);
    toast.success("Resumo do atendimento copiado para área de transferência!");
  };

  return (
    <div className="space-y-4">
      {/* ============================================================
          BANNER DE JORNADA DO PACIENTE (CLINICSUITE TIMELINE STATS)
         ============================================================ */}
      <div className="rounded-2xl border bg-linear-to-br from-emerald-500/10 via-card to-teal-500/5 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
                Linha do Tempo Completa do Paciente
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Jornada cronológica com cada atendimento, anotação e evolução clínica em um só lugar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 gap-1 bg-background hover:text-primary"
                onClick={onRefresh}
                disabled={isLoading}
                title="Atualizar linha do tempo"
              >
                <RotateCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 gap-1 bg-background"
              onClick={() => handleToggleAll(true)}
            >
              <ChevronDown className="size-3" /> Expandir Tudo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 gap-1 bg-background"
              onClick={() => handleToggleAll(false)}
            >
              <ChevronUp className="size-3" /> Recolher Tudo
            </Button>
          </div>
        </div>

        {/* 4 Cards de Métricas da Jornada */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-xl border bg-background/80 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <FileCheck2 className="size-3 text-emerald-600" />
              <span>Atendimentos</span>
            </div>
            <p className="text-base font-bold text-foreground mt-0.5">
              {sortedRecords.length}
            </p>
            <span className="text-[10px] text-muted-foreground">
              evoluções registradas
            </span>
          </div>

          <div className="rounded-xl border bg-background/80 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Award className="size-3 text-amber-500" />
              <span>1ª Consulta</span>
            </div>
            <p className="text-xs font-bold text-foreground mt-0.5 truncate">
              {oldestRecord
                ? format(new Date(oldestRecord.createdAt), "dd/MM/yyyy", { locale: ptBR })
                : "Aguardando"}
            </p>
            <span className="text-[10px] text-muted-foreground truncate block">
              {oldestRecord?.doctor ? oldestRecord.doctor.name : "Início da ficha"}
            </span>
          </div>

          <div className="rounded-xl border bg-background/80 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Clock className="size-3 text-teal-600" />
              <span>Mais Recente</span>
            </div>
            <p className="text-xs font-bold text-foreground mt-0.5 truncate">
              {newestRecord
                ? format(new Date(newestRecord.createdAt), "dd/MM/yyyy", { locale: ptBR })
                : "Sem registros"}
            </p>
            <span className="text-[10px] text-muted-foreground truncate block">
              {newestRecord
                ? formatDistanceToNow(new Date(newestRecord.createdAt), {
                    locale: ptBR,
                    addSuffix: true,
                  })
                : "—"}
            </span>
          </div>

          <div className="rounded-xl border bg-background/80 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Users className="size-3 text-primary" />
              <span>Corpo Clínico</span>
            </div>
            <p className="text-base font-bold text-foreground mt-0.5">
              {involvedDoctors.length}
            </p>
            <span className="text-[10px] text-muted-foreground truncate block">
              {involvedDoctors.length > 0
                ? involvedDoctors
                    .map((d) => d.name?.split(" ")?.[0] || d.name || "Dr.")
                    .join(", ")
                : "Sem profissionais"}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          BARRA DE PESQUISA & FILTROS DA LINHA DO TEMPO
         ============================================================ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por sintoma, CID, remédio prescrito, procedimento ou médico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8.5 pr-8 h-8 text-xs bg-card"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant={typeFilter === "all" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={() => setTypeFilter("all")}
          >
            Todos ({sortedRecords.length})
          </Button>
          <Button
            type="button"
            variant={typeFilter === "medical" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs px-2 gap-1"
            onClick={() => setTypeFilter("medical")}
          >
            <Stethoscope className="size-3" /> Médico
          </Button>
          <Button
            type="button"
            variant={typeFilter === "dental" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs px-2 gap-1"
            onClick={() => setTypeFilter("dental")}
          >
            <Smile className="size-3" /> Odonto
          </Button>
          <Button
            type="button"
            variant={typeFilter === "prescriptions" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs px-2 gap-1"
            onClick={() => setTypeFilter("prescriptions")}
          >
            <Pill className="size-3" /> Receitas
          </Button>
        </div>
      </div>

      {/* ============================================================
          TIMELINE VISUAL COM EIXO VERTICAL CONTÍNUO
         ============================================================ */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-3 bg-muted/10">
          <div className="size-12 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <div>
            <h5 className="font-bold text-sm text-foreground">
              {sortedRecords.length === 0
                ? "Nenhum atendimento na linha do tempo ainda"
                : "Nenhum registro encontrado para essa busca"}
            </h5>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              {sortedRecords.length === 0
                ? "Inicie a documentação clínica do paciente clicando em 'Novo Atendimento'. Modelos rápidos e seções estruturadas aceleram o registro."
                : "Tente buscar por outro termo ou limpe os filtros para visualizar todo o histórico."}
            </p>
          </div>
          {sortedRecords.length === 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                size="sm"
                className="text-xs font-semibold gap-1.5"
                onClick={onOpenNewTab}
              >
                <Sparkles className="size-3.5" /> Iniciar 1º Atendimento do Paciente
              </Button>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RotateCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
                  Recarregar Prontuário
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
              }}
            >
              Limpar Filtros de Busca
            </Button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-border before:to-muted">
          {filteredRecords.map((rec, index) => {
            const isFirstEver = oldestRecord?.id === rec.id;
            const isLatest = index === 0;
            const isDental = rec.recordType === "dental";
            const isMedical = rec.recordType === "medical";
            const isExpanded = expandedRecordIds[rec.id] !== false; // por padrão aberto

            // Calcula IMC se tiver peso e altura
            let calculatedBmi: string | null = null;
            if (rec.weight && rec.height) {
              const w = parseFloat(rec.weight.replace(",", "."));
              const h = parseFloat(rec.height.replace(",", ".")) / 100;
              if (w > 0 && h > 0) {
                calculatedBmi = (w / (h * h)).toFixed(1);
              }
            }

            return (
              <div key={rec.id} className="relative group">
                {/* NÓ DO EIXO VERTICAL DA TIMELINE */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3 size-6 sm:size-7 rounded-full border-2 bg-background flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
                    isLatest
                      ? "border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/20"
                      : isDental
                        ? "border-cyan-500 text-cyan-600"
                        : "border-primary text-primary"
                  }`}
                >
                  {isDental ? (
                    <Smile className="size-3 sm:size-3.5" />
                  ) : isMedical ? (
                    <Stethoscope className="size-3 sm:size-3.5" />
                  ) : (
                    <Activity className="size-3 sm:size-3.5" />
                  )}
                </div>

                {/* CARD DO ATENDIMENTO */}
                <div
                  className={`rounded-2xl border transition-all duration-200 bg-card shadow-2xs hover:shadow-md hover:border-primary/40 ${
                    isLatest ? "border-emerald-500/40 ring-1 ring-emerald-500/10" : ""
                  }`}
                >
                  {/* CABEÇALHO DO CARD */}
                  <div className="p-3.5 sm:p-4 border-b flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {isDental ? (
                        <Badge className="bg-cyan-600 text-white gap-1 text-[11px] font-semibold">
                          <Smile className="size-3" /> Odontologia
                        </Badge>
                      ) : isMedical ? (
                        <Badge className="bg-primary text-primary-foreground gap-1 text-[11px] font-semibold">
                          <Stethoscope className="size-3" /> Consulta Médica
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
                          <Activity className="size-3" /> Multiprofissional
                        </Badge>
                      )}

                      {isFirstEver && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40 text-[10px] font-bold">
                          🌟 1ª Consulta
                        </Badge>
                      )}

                      {isLatest && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 text-[10px] font-bold">
                          ✨ Mais Recente
                        </Badge>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-foreground font-bold">
                        <span>{rec.doctor?.name || "Profissional Clínico"}</span>
                        {rec.doctor?.specialty && (
                          <span className="text-muted-foreground font-normal">
                            ({rec.doctor.specialty})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-mono font-medium text-foreground flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          {format(new Date(rec.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {formatDistanceToNow(new Date(rec.createdAt), {
                            locale: ptBR,
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        title={isExpanded ? "Recolher atendimento" : "Expandir atendimento"}
                        onClick={() => toggleExpand(rec.id)}
                      >
                        {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-primary"
                        title="Copiar resumo do atendimento"
                        onClick={() => copyFullRecordSummary(rec)}
                      >
                        <Copy className="size-3.5" />
                      </Button>

                      {userRole === "admin" && onDeleteRecord && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Excluir evolução (Admin)"
                          onClick={() => {
                            if (
                              confirm(
                                "Deseja realmente remover esta evolução clínica do prontuário?",
                              )
                            ) {
                              onDeleteRecord(rec.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* CORPO EXPANSÍVEL DO CARD */}
                  {isExpanded && (
                    <div className="p-3.5 sm:p-4 space-y-3.5 text-xs">
                      {/* SINAIS VITAIS / BIOMETRIA */}
                      {(rec.bloodPressure ||
                        rec.heartRate ||
                        rec.temperature ||
                        rec.weight ||
                        rec.height) && (
                        <div className="rounded-xl bg-muted/40 p-3 border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <HeartPulse className="size-3.5 text-primary" />
                              Sinais Vitais & Biometria Registrados
                            </span>
                            {calculatedBmi && (
                              <Badge variant="outline" className="font-mono text-[11px] bg-background">
                                IMC: <strong>{calculatedBmi} kg/m²</strong>
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {rec.bloodPressure && (
                              <Badge variant="secondary" className="font-normal text-xs py-1 px-2.5">
                                PA: <strong className="ml-1 text-foreground">{rec.bloodPressure} mmHg</strong>
                              </Badge>
                            )}
                            {rec.heartRate && (
                              <Badge variant="secondary" className="font-normal text-xs py-1 px-2.5">
                                FC: <strong className="ml-1 text-foreground">{rec.heartRate} bpm</strong>
                              </Badge>
                            )}
                            {rec.temperature && (
                              <Badge variant="secondary" className="font-normal text-xs py-1 px-2.5">
                                Temp: <strong className="ml-1 text-foreground">{rec.temperature} °C</strong>
                              </Badge>
                            )}
                            {rec.weight && (
                              <Badge variant="secondary" className="font-normal text-xs py-1 px-2.5">
                                Peso: <strong className="ml-1 text-foreground">{rec.weight} kg</strong>
                              </Badge>
                            )}
                            {rec.height && (
                              <Badge variant="secondary" className="font-normal text-xs py-1 px-2.5">
                                Altura: <strong className="ml-1 text-foreground">{rec.height} cm</strong>
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* DETALHES ODONTOLÓGICOS */}
                      {isDental &&
                        (rec.procedureName ||
                          rec.teeth ||
                          rec.materialsUsed ||
                          rec.postOpInstructions) && (
                          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/25 p-3 space-y-2">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                              <Smile className="size-3.5 text-cyan-600" />
                              Procedimento Odontológico
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {rec.procedureName && (
                                <div>
                                  <span className="text-muted-foreground font-medium">Procedimento: </span>
                                  <span className="font-bold text-foreground">{rec.procedureName}</span>
                                </div>
                              )}
                              {rec.teeth && (
                                <div>
                                  <span className="text-muted-foreground font-medium">Dentes / Região: </span>
                                  <Badge className="bg-cyan-700 text-white font-mono text-xs">{rec.teeth}</Badge>
                                </div>
                              )}
                              {rec.materialsUsed && (
                                <div className="sm:col-span-2">
                                  <span className="text-muted-foreground font-medium">Materiais / Anestesia: </span>
                                  <span className="text-foreground">{rec.materialsUsed}</span>
                                </div>
                              )}
                              {rec.postOpInstructions && (
                                <div className="sm:col-span-2 pt-1 border-t border-cyan-500/20">
                                  <span className="font-bold text-cyan-800 dark:text-cyan-300 block mb-0.5">
                                    Orientações Pós-Operatórias:
                                  </span>
                                  <p className="text-foreground italic">{rec.postOpInstructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* QUEIXA PRINCIPAL / ANAMNESE */}
                      {rec.symptoms && (
                        <div className="space-y-1">
                          <span className="font-semibold text-muted-foreground text-[11px] uppercase block">
                            Queixa Principal & Anamnese:
                          </span>
                          <p className="text-foreground bg-muted/20 p-2.5 rounded-xl border leading-relaxed">
                            {rec.symptoms}
                          </p>
                        </div>
                      )}

                      {/* HIPÓTESE DIAGNÓSTICA / CID */}
                      {rec.diagnosis && (
                        <div className="space-y-1">
                          <span className="font-semibold text-muted-foreground text-[11px] uppercase block">
                            Hipótese Diagnóstica / CID-10:
                          </span>
                          <Badge className="bg-primary/10 text-primary border-primary/25 font-semibold text-xs py-1 px-3">
                            {rec.diagnosis}
                          </Badge>
                        </div>
                      )}

                      {/* PRESCRIÇÃO MÉDICA / MEDICAMENTOS */}
                      {rec.prescription && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase flex items-center gap-1.5">
                              <Pill className="size-3.5 text-emerald-600" />
                              Prescrição & Receituário Clínico
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px] text-emerald-700 hover:bg-emerald-500/15 gap-1 font-semibold"
                              onClick={() => copyToClipboard(rec.prescription!, "Prescrição")}
                            >
                              <Copy className="size-3" /> Copiar Prescrição
                            </Button>
                          </div>
                          <p className="text-foreground bg-background/80 p-2.5 rounded-lg border font-mono text-xs whitespace-pre-line leading-relaxed">
                            {rec.prescription}
                          </p>
                        </div>
                      )}

                      {/* CONDUTA & RECOMENDAÇÕES */}
                      {rec.treatmentPlan && (
                        <div className="space-y-1">
                          <span className="font-semibold text-muted-foreground text-[11px] uppercase block">
                            Conduta, Exames e Plano de Tratamento:
                          </span>
                          <p className="text-foreground bg-muted/20 p-2.5 rounded-xl border leading-relaxed whitespace-pre-line">
                            {rec.treatmentPlan}
                          </p>
                        </div>
                      )}

                      {/* EVOLUÇÃO CLÍNICA CONFIDENCIAL */}
                      <div className="space-y-1">
                        <span className="font-semibold text-muted-foreground text-[11px] uppercase flex items-center gap-1">
                          <Lock className="size-3" /> Evolução Clínica Detalhada & Sigilo:
                        </span>
                        <p className="text-foreground bg-muted/40 p-3 rounded-xl border leading-relaxed whitespace-pre-line">
                          {rec.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
