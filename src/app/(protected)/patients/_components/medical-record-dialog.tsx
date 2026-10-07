"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  FileCheck2,
  FileEdit,
  FileText,
  Filter,
  Heart,
  HeartPulse,
  History,
  Info,
  Layers,
  Lock,
  Pencil,
  Pill,
  PlusCircle,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  createMedicalRecord,
  deleteMedicalRecord,
  getPatientMedicalRecords,
  updatePatientClinicalSummary,
} from "@/actions/medical-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import {
  ClinicalTemplate,
  QuickPhrase,
} from "./clinical-templates";
import { ClinicalTemplatesBar } from "./clinical-templates-bar";
import { PatientTimeline } from "./patient-timeline";

interface MedicalRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patient: typeof patientsTable.$inferSelect;
  doctors: (typeof doctorsTable.$inferSelect)[];
  userRole?: string;
}

export function MedicalRecordDialog({
  isOpen,
  onOpenChange,
  patient: initialPatient,
  doctors,
  userRole = "admin",
}: MedicalRecordDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("history");
  const [currentPatient, setCurrentPatient] = useState(initialPatient);
  const [records, setRecords] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Modo do formulário: "complete" (estruturado com todas as seções) ou "quick" (ágil e direto)
  const [formMode, setFormMode] = useState<"complete" | "quick">("complete");

  // Estado da Nova Evolução
  const [recordType, setRecordType] = useState<"medical" | "dental" | "general">("medical");
  const [doctorId, setDoctorId] = useState<string>(
    doctors.length > 0 ? doctors[0].id : "",
  );

  // Sinais Vitais (Médico/Geral)
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // Campos Odontológicos
  const [teeth, setTeeth] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [postOpInstructions, setPostOpInstructions] = useState("");

  // Queixa, Diagnóstico, Conduta, Prescrição e Notas
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");

  // Seções colapsáveis no formulário
  const [sectionsExpanded, setSectionsExpanded] = useState({
    vitals: true,
    dental: true,
    diagnosis: true,
    prescription: true,
    treatment: true,
    notes: true,
  });

  // Estado da Ficha Clínica Rápida
  const [editAllergies, setEditAllergies] = useState(initialPatient?.allergies || "");
  const [editMedicalHistory, setEditMedicalHistory] = useState(initialPatient?.medicalHistory || "");
  const [editCurrentMedications, setEditCurrentMedications] = useState(initialPatient?.currentMedications || "");
  const [editBloodType, setEditBloodType] = useState(initialPatient?.bloodType || "");
  const [editEmergencyName, setEditEmergencyName] = useState(initialPatient?.emergencyContactName || "");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(initialPatient?.emergencyContactPhone || "");

  // Atualiza estados locais quando o paciente mudar
  useEffect(() => {
    setCurrentPatient(initialPatient);
    setEditAllergies(initialPatient?.allergies || "");
    setEditMedicalHistory(initialPatient?.medicalHistory || "");
    setEditCurrentMedications(initialPatient?.currentMedications || "");
    setEditBloodType(initialPatient?.bloodType || "");
    setEditEmergencyName(initialPatient?.emergencyContactName || "");
    setEditEmergencyPhone(initialPatient?.emergencyContactPhone || "");
    if (isOpen && initialPatient?.id) {
      getRecordsAction.execute({ patientId: initialPatient.id });
    }
  }, [initialPatient, isOpen]);

  // Cálculo automático do IMC com indicador de faixa
  const calculatedBmi = useMemo(() => {
    const w = parseFloat(weight.replace(",", "."));
    const h = parseFloat(height.replace(",", ".")) / 100;
    if (w > 0 && h > 0) {
      const bmi = parseFloat((w / (h * h)).toFixed(1));
      let status = "Normal";
      let statusColor = "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
      if (bmi < 18.5) {
        status = "Abaixo do peso";
        statusColor = "text-amber-600 bg-amber-500/10 border-amber-500/20";
      } else if (bmi >= 25 && bmi < 30) {
        status = "Sobrepeso";
        statusColor = "text-amber-600 bg-amber-500/10 border-amber-500/20";
      } else if (bmi >= 30) {
        status = "Obesidade";
        statusColor = "text-rose-600 bg-rose-500/10 border-rose-500/20";
      }
      return { value: bmi, status, statusColor };
    }
    return null;
  }, [weight, height]);

  // Cálculo da Idade
  const patientAge = useMemo(() => {
    if (!currentPatient?.birthDate) return null;
    const birth = new Date(currentPatient.birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [currentPatient?.birthDate]);

  // Action para carregar registros
  const getRecordsAction = useAction(getPatientMedicalRecords, {
    onSuccess: ({ data }) => {
      if (data?.records) {
        setRecords(data.records);
      }
      if (data?.appointments) {
        setAppointments(data.appointments);
      }
      if (data?.patient) {
        setCurrentPatient(data.patient);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao carregar prontuário.");
    },
  });

  // Action para criar registro
  const createRecordAction = useAction(createMedicalRecord, {
    onSuccess: ({ data }) => {
      toast.success("Atendimento registrado na Linha do Tempo com sucesso!");
      // Atualização imediata do estado local da Linha do Tempo!
      if (data?.record) {
        setRecords((prev) => [
          data.record,
          ...prev.filter((r) => r.id !== data.record.id),
        ]);
      }
      // Limpa formulário
      setSymptoms("");
      setDiagnosis("");
      setTreatmentPlan("");
      setPrescription("");
      setNotes("");
      setBloodPressure("");
      setHeartRate("");
      setTemperature("");
      setWeight("");
      setHeight("");
      setTeeth("");
      setProcedureName("");
      setMaterialsUsed("");
      setPostOpInstructions("");
      setActiveTab("history");
      // Recarrega lista completa em segundo plano
      if (currentPatient?.id) {
        getRecordsAction.execute({ patientId: currentPatient.id });
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao salvar atendimento no prontuário.");
    },
  });

  // Action para excluir registro
  const deleteRecordAction = useAction(deleteMedicalRecord, {
    onSuccess: () => {
      toast.success("Registro removido do prontuário.");
      getRecordsAction.execute({ patientId: currentPatient.id });
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao excluir registro.");
    },
  });

  // Action para atualizar resumo clínico
  const updateSummaryAction = useAction(updatePatientClinicalSummary, {
    onSuccess: ({ data }) => {
      toast.success("Ficha de segurança do paciente atualizada com sucesso!");
      if (data?.patient) {
        setCurrentPatient(data.patient);
      }
      setActiveTab("history");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar dados clínicos.");
    },
  });

  useEffect(() => {
    if (isOpen && currentPatient?.id) {
      getRecordsAction.execute({ patientId: currentPatient.id });
    }
  }, [isOpen, currentPatient?.id]);

  // Aplicação de Modelo / Template Clínico em 1 clique
  const handleApplyTemplate = (template: ClinicalTemplate) => {
    setRecordType(template.defaults.recordType);

    if (template.defaults.symptoms !== undefined) {
      setSymptoms(template.defaults.symptoms);
    }
    if (template.defaults.diagnosis !== undefined) {
      setDiagnosis(template.defaults.diagnosis);
    }
    if (template.defaults.treatmentPlan !== undefined) {
      setTreatmentPlan(template.defaults.treatmentPlan);
    }
    if (template.defaults.prescription !== undefined) {
      setPrescription(template.defaults.prescription);
    }
    if (template.defaults.notes !== undefined) {
      setNotes(template.defaults.notes);
    }
    if (template.defaults.procedureName !== undefined) {
      setProcedureName(template.defaults.procedureName);
    }
    if (template.defaults.teeth !== undefined) {
      setTeeth(template.defaults.teeth);
    }
    if (template.defaults.materialsUsed !== undefined) {
      setMaterialsUsed(template.defaults.materialsUsed);
    }
    if (template.defaults.postOpInstructions !== undefined) {
      setPostOpInstructions(template.defaults.postOpInstructions);
    }
  };

  // Inserção suave de Frases Rápidas (Macros)
  const handleInsertPhrase = (phrase: QuickPhrase) => {
    const target = phrase.targetField || "notes";

    if (target === "notes") {
      setNotes((prev) => (prev ? `${prev}\n- ${phrase.text}` : phrase.text));
    } else if (target === "symptoms") {
      setSymptoms((prev) => (prev ? `${prev}. ${phrase.text}` : phrase.text));
    } else if (target === "treatmentPlan") {
      setTreatmentPlan((prev) => (prev ? `${prev}\n- ${phrase.text}` : phrase.text));
    } else if (target === "prescription") {
      setPrescription((prev) => (prev ? `${prev}\n${phrase.text}` : phrase.text));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      toast.error("Selecione o profissional responsável pelo atendimento.");
      return;
    }
    if (!notes.trim()) {
      toast.error("A evolução clínica / anotações de atendimento são obrigatórias.");
      return;
    }

    createRecordAction.execute({
      patientId: currentPatient.id,
      doctorId,
      recordType,
      bloodPressure: bloodPressure || null,
      heartRate: heartRate || null,
      temperature: temperature || null,
      weight: weight || null,
      height: height || null,
      teeth: teeth || null,
      procedureName: procedureName || null,
      materialsUsed: materialsUsed || null,
      postOpInstructions: postOpInstructions || null,
      symptoms: symptoms || null,
      diagnosis: diagnosis || null,
      treatmentPlan: treatmentPlan || null,
      prescription: prescription || null,
      notes,
    });
  };

  const handleUpdateSummary = (e: React.FormEvent) => {
    e.preventDefault();
    updateSummaryAction.execute({
      patientId: currentPatient.id,
      allergies: editAllergies,
      medicalHistory: editMedicalHistory,
      currentMedications: editCurrentMedications,
      bloodType: editBloodType,
      emergencyContactName: editEmergencyName,
      emergencyContactPhone: editEmergencyPhone,
    });
  };

  const canAccessMedicalRecords = userRole === "admin" || userRole === "doctor";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        {/* ============================================================
            CABEÇALHO PRINCIPAL DO PACIENTE
           ============================================================ */}
        <DialogHeader className="space-y-3 pb-3 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {currentPatient.name}
                  </DialogTitle>
                  {patientAge !== null && (
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {patientAge} anos
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {currentPatient.sex === "male" ? "Masc" : "Fem"}
                  </Badge>
                  {currentPatient.bloodType && (
                    <Badge className="bg-rose-600 text-white text-[11px] font-bold">
                      {currentPatient.bloodType}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  <span>📱 {currentPatient.phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</span>
                  {currentPatient.cpf && <span>• CPF: {currentPatient.cpf}</span>}
                  <span>• Convênio: {currentPatient.healthInsurance || "Particular"}</span>
                  {currentPatient.healthInsuranceNumber && <span>({currentPatient.healthInsuranceNumber})</span>}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* BANNER DE SEGURANÇA E ALERGIAS (CRUCIAL PARA A CLÍNICA) */}
          <div className="rounded-xl border p-3 text-xs transition-colors shadow-2xs bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
                <HeartPulse className="size-3.5 text-primary" />
                Resumo Clínico de Segurança & Alertas
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10"
                onClick={() => setActiveTab("summary")}
              >
                <Pencil className="size-3 mr-1" /> Editar Resumo Clínico
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Alergias */}
              <div
                className={`rounded-lg p-2.5 border ${
                  currentPatient.allergies
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {currentPatient.allergies ? (
                    <AlertTriangle className="size-4 text-rose-600 animate-pulse shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="text-[11px] uppercase tracking-wide">
                    {currentPatient.allergies ? "ALERGIAS RELATADAS" : "ALERGIAS"}
                  </span>
                </div>
                <p className="font-semibold text-xs leading-relaxed">
                  {currentPatient.allergies || "Nenhuma alergia relatada"}
                </p>
              </div>

              {/* Comorbidades */}
              <div className="rounded-lg p-2.5 bg-muted/40 border">
                <div className="flex items-center gap-1.5 font-bold text-muted-foreground mb-1 text-[11px] uppercase">
                  <Activity className="size-3.5 text-amber-500 shrink-0" />
                  Histórico / Comorbidades
                </div>
                <p className="text-xs leading-relaxed text-foreground">
                  {currentPatient.medicalHistory || "Nenhuma comorbidade relatada"}
                </p>
              </div>

              {/* Remédios Contínuos / Emergência */}
              <div className="rounded-lg p-2.5 bg-muted/40 border">
                <div className="flex items-center gap-1.5 font-bold text-muted-foreground mb-1 text-[11px] uppercase">
                  <Pill className="size-3.5 text-blue-500 shrink-0" />
                  Uso Contínuo & Emergência
                </div>
                <p className="text-xs leading-relaxed text-foreground truncate">
                  {currentPatient.currentMedications || "Nenhum medicamento contínuo"}
                </p>
                {currentPatient.emergencyContactName && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    🚨 {currentPatient.emergencyContactName}: {currentPatient.emergencyContactPhone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {!canAccessMedicalRecords ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3 my-4">
            <Lock className="size-8 text-destructive mx-auto" />
            <h3 className="font-bold text-destructive text-base">
              Acesso Restrito - Sigilo Médico, Odontológico & LGPD
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Em cumprimento à Lei Geral de Proteção de Dados e às normas do CFM e CFO, o prontuário eletrônico só pode ser acessado por profissionais de saúde e gestores clínicos autorizados.
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mt-2"
          >
            <TabsList className="grid w-full grid-cols-3 bg-muted/70 p-1">
              <TabsTrigger value="history" className="gap-1.5 text-xs py-2">
                <History className="size-3.5" /> Linha do Tempo ({records.length})
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1.5 text-xs py-2 font-semibold">
                <PlusCircle className="size-3.5 text-primary" /> Novo Atendimento
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-1.5 text-xs py-2">
                <HeartPulse className="size-3.5 text-rose-500" /> Ficha de Saúde
              </TabsTrigger>
            </TabsList>

            {/* ========================================================
                TAB 1: LINHA DO TEMPO COMPLETA DO PACIENTE (CLINICSUITE)
               ======================================================== */}
            <TabsContent value="history" className="space-y-4 pt-3">
              {getRecordsAction.isExecuting && records.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                  Carregando Linha do Tempo completa do paciente sob sigilo...
                </div>
              ) : (
                <PatientTimeline
                  patient={currentPatient}
                  records={records}
                  appointments={appointments}
                  userRole={userRole}
                  isLoading={getRecordsAction.isExecuting}
                  onRefresh={() => {
                    if (currentPatient?.id) {
                      getRecordsAction.execute({ patientId: currentPatient.id });
                    }
                  }}
                  onDeleteRecord={(id) => deleteRecordAction.execute({ id })}
                  onOpenNewTab={() => setActiveTab("new")}
                />
              )}
            </TabsContent>

            {/* ========================================================
                TAB 2: NOVO ATENDIMENTO COM MODELOS E SEÇÕES ESTRUTURADAS
               ======================================================== */}
            <TabsContent value="new" className="space-y-4 pt-3">
              {/* BARRA DE MODELOS CLÍNICOS E FRASES RÁPIDAS (MENOS RETRABALHO) */}
              <ClinicalTemplatesBar
                currentFormState={{
                  recordType,
                  symptoms,
                  diagnosis,
                  treatmentPlan,
                  prescription,
                  notes,
                  procedureName,
                  teeth,
                  materialsUsed,
                  postOpInstructions,
                }}
                onApplyTemplate={handleApplyTemplate}
                onInsertPhrase={handleInsertPhrase}
              />

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. SEÇÃO ESTRUTURADA: TIPO, PROFISSIONAL E MODO */}
                <div className="rounded-xl border bg-muted/30 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="size-3.5" />
                      1. Tipo de Atendimento & Especialidade
                    </Label>

                    {/* Alternador de Modo: Completo vs Rápido */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant={formMode === "complete" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setFormMode("complete")}
                        title="Modo completo com todas as seções médicas e biométricas"
                      >
                        Modo Completo
                      </Button>
                      <Button
                        type="button"
                        variant={formMode === "quick" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-[11px] px-2 text-primary font-semibold"
                        onClick={() => setFormMode("quick")}
                        title="Modo ágil para consultas diretas e menor digitação"
                      >
                        ⚡ Modo Ágil
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant={recordType === "medical" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8 gap-1.5 font-semibold"
                      onClick={() => setRecordType("medical")}
                    >
                      <Stethoscope className="size-3.5" /> Consulta Médica
                    </Button>
                    <Button
                      type="button"
                      variant={recordType === "dental" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8 gap-1.5 font-semibold"
                      onClick={() => setRecordType("dental")}
                    >
                      <Smile className="size-3.5" /> Odontologia
                    </Button>
                    <Button
                      type="button"
                      variant={recordType === "general" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8 gap-1.5 font-semibold"
                      onClick={() => setRecordType("general")}
                    >
                      <Activity className="size-3.5" /> Multiprofissional / Geral
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-1.5">
                      <Label htmlFor="doctorSelect" className="text-xs font-semibold">
                        Profissional Responsável *
                      </Label>
                      <Select value={doctorId} onValueChange={setDoctorId}>
                        <SelectTrigger id="doctorSelect" className="bg-background">
                          <SelectValue placeholder="Selecione o profissional" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name} ({doc.specialty})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-lg bg-background p-2.5 border text-xs flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="size-5 text-primary shrink-0" />
                      <span>
                        Atendimento com sigilo profissional e registro na Linha do Tempo vitalícia de <strong>{currentPatient.name}</strong>.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. SEÇÃO ESTRUTURADA: SINAIS VITAIS (Quando Médico ou Geral) */}
                {recordType !== "dental" && (formMode === "complete" || bloodPressure || heartRate) && (
                  <div className="rounded-xl border p-3.5 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <Activity className="size-3.5 text-primary" />
                        2. Sinais Vitais & Biometria (Opcional):
                      </Label>
                      {calculatedBmi && (
                        <Badge
                          variant="outline"
                          className={`font-mono text-xs ${calculatedBmi.statusColor}`}
                        >
                          IMC: {calculatedBmi.value} kg/m² ({calculatedBmi.status})
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div>
                        <Label className="text-[11px]">PA (mmHg)</Label>
                        <Input
                          placeholder="Ex: 120/80"
                          value={bloodPressure}
                          onChange={(e) => setBloodPressure(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">FC (bpm)</Label>
                        <Input
                          placeholder="Ex: 75 bpm"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Temp (°C)</Label>
                        <Input
                          placeholder="Ex: 36.5 °C"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Peso (kg)</Label>
                        <Input
                          placeholder="Ex: 72.5"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Altura (cm)</Label>
                        <Input
                          placeholder="Ex: 175"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SEÇÃO ESTRUTURADA: CAMPOS ODONTOLÓGICOS (Dentista) */}
                {recordType === "dental" && (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 dark:bg-cyan-950/20 p-3.5 space-y-3">
                    <Label className="text-xs font-bold text-cyan-900 dark:text-cyan-200 uppercase flex items-center gap-1.5">
                      <Smile className="size-4 text-cyan-600" />
                      Procedimento Odontológico Realizado:
                    </Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Procedimento Realizado</Label>
                        <Input
                          placeholder="Ex: Restauração Resina Composta, Extração, Profilaxia..."
                          value={procedureName}
                          onChange={(e) => setProcedureName(e.target.value)}
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Dente(s) / Arcada / Região</Label>
                        <Input
                          placeholder="Ex: Dente 16 (MOD), Dente 21, Arcada Superior..."
                          value={teeth}
                          onChange={(e) => setTeeth(e.target.value)}
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Anestésico e Materiais Utilizados</Label>
                        <Input
                          placeholder="Ex: Mepivacaína 2% 1:100.000, Resina Filtek Z350..."
                          value={materialsUsed}
                          onChange={(e) => setMaterialsUsed(e.target.value)}
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Orientações Pós-Operatórias</Label>
                        <Input
                          placeholder="Ex: Evitar mastigar alimentos duros nas primeiras horas..."
                          value={postOpInstructions}
                          onChange={(e) => setPostOpInstructions(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SEÇÃO ESTRUTURADA: QUEIXA PRINCIPAL & ANAMNESE */}
                <div className="space-y-1.5">
                  <Label htmlFor="symptoms" className="text-xs font-semibold">
                    {recordType === "dental" ? "Queixa Odontológica & Motivo da Consulta" : "Queixa Principal & Anamnese"}
                  </Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Relato do paciente, início dos sintomas, intensidade da dor, histórico atual..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* 5. SEÇÃO ESTRUTURADA: DIAGNÓSTICO / CID-10 */}
                <div className="space-y-1.5">
                  <Label htmlFor="diagnosis" className="text-xs font-semibold">
                    {recordType === "dental" ? "Diagnóstico Odontológico (ex: Cárie Oclusal, Gengivite)" : "Hipótese Diagnóstica / CID-10"}
                  </Label>
                  <Input
                    id="diagnosis"
                    placeholder="Ex: Z00.0 - Exame de rotina, J00 - Resfriado comum, I10 - Hipertensão..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                {/* 6. SEÇÃO ESTRUTURADA: PRESCRIÇÃO MÉDICA & CONDUTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="prescription" className="text-xs font-semibold flex items-center gap-1">
                      <Pill className="size-3.5 text-emerald-600" /> Prescrição / Medicamentos Receitados
                    </Label>
                    <Textarea
                      id="prescription"
                      placeholder="Ex: Amoxicilina 500mg - 1 comp de 8/8h por 7 dias&#10;Dipirona 500mg - 1 comp se dor..."
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="treatmentPlan" className="text-xs font-semibold">
                      Conduta, Exames e Recomendações
                    </Label>
                    <Textarea
                      id="treatmentPlan"
                      placeholder="Ex: Solicitados exames de sangue, repouso, retorno em 30 dias..."
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* 7. SEÇÃO ESTRUTURADA: EVOLUÇÃO CLÍNICA DETALHADA (OBRIGATÓRIO) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notes" className="text-xs font-bold flex items-center gap-1.5">
                      <Lock className="size-3.5 text-primary" />
                      Evolução do Atendimento & Anotações Confidenciais *
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {notes.length} caracteres
                    </span>
                  </div>
                  <Textarea
                    id="notes"
                    required
                    placeholder="Exame físico detalhado, interrogatório sistemático, conduta e impressões clínicas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* BOTÕES DE AÇÃO DO FORMULÁRIO */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("history")}
                    disabled={createRecordAction.isExecuting}
                  >
                    Voltar à Linha do Tempo
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={createRecordAction.isExecuting}
                  >
                    <ShieldCheck className="size-4" />
                    {createRecordAction.isExecuting
                      ? "Salvando Atendimento..."
                      : "Salvar na Linha do Tempo"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* ========================================================
                TAB 3: FICHA DE SAÚDE & RESUMO CLÍNICO (EDIÇÃO RÁPIDA)
               ======================================================== */}
            <TabsContent value="summary" className="pt-3">
              <form onSubmit={handleUpdateSummary} className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <HeartPulse className="size-4 text-rose-500" />
                    Atualização Rápida da Ficha de Saúde
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Modifique alergias, comorbidades ou medicamentos de uso contínuo diretamente durante a consulta. As alterações refletem imediatamente no cabeçalho e nos alertas de segurança.
                  </p>
                </div>

                <div className="rounded-xl border border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-2">
                  <Label className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-rose-600" />
                    Alergias Conhecidas (Medicamentos, Látex, Alimentos)
                  </Label>
                  <Input
                    placeholder="Ex: Alérgico a Dipirona, Penicilina e Látex"
                    value={editAllergies}
                    onChange={(e) => setEditAllergies(e.target.value)}
                    className="bg-background border-rose-300 focus-visible:ring-rose-500"
                  />
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                    Se não houver alergias conhecidas, deixe em branco para exibir &quot;Nenhuma alergia relatada&quot;.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Histórico Clínico / Comorbidades</Label>
                    <Textarea
                      rows={3}
                      placeholder="Ex: Hipertenso controlado, Diabetes tipo 2, Histórico de infarto..."
                      value={editMedicalHistory}
                      onChange={(e) => setEditMedicalHistory(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Medicamentos de Uso Contínuo</Label>
                    <Textarea
                      rows={3}
                      placeholder="Ex: Losartana 50mg, AAS 100mg, Insulina NPH..."
                      value={editCurrentMedications}
                      onChange={(e) => setEditCurrentMedications(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tipo Sanguíneo</Label>
                    <Input
                      placeholder="Ex: O+, A-, B+..."
                      value={editBloodType}
                      onChange={(e) => setEditBloodType(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nome Contato Emergência</Label>
                    <Input
                      placeholder="Ex: Maria (Esposa)"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Telefone Emergência</Label>
                    <Input
                      placeholder="Ex: (11) 98888-8888"
                      value={editEmergencyPhone}
                      onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("history")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-2 font-bold"
                    disabled={updateSummaryAction.isExecuting}
                  >
                    <Save className="size-4" />
                    {updateSummaryAction.isExecuting
                      ? "Salvando Ficha..."
                      : "Salvar Resumo Clínico"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
