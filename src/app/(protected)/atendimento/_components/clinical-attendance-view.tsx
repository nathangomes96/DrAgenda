"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  History,
  Layers,
  Save,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { createMedicalRecord } from "@/actions/medical-records";
import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import { BUILTIN_CLINICAL_TEMPLATES } from "@/app/(protected)/patients/_components/clinical-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { appointmentsTable, clinicsTable, doctorsTable, medicalRecordsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

import { ExamRequestDialog } from "./exam-request-dialog";
import { MedicalCertificateDialog } from "./medical-certificate-dialog";
import { PatientHistoryDrawer } from "./patient-history-drawer";
import { PatientSidebarCard } from "./patient-sidebar-card";
import { PrescriptionDialog } from "./prescription-dialog";
import { SoapEditor } from "./soap-editor";
import { VitalSignsBar } from "./vital-signs-bar";

type MedicalRecordItem = typeof medicalRecordsTable.$inferSelect & {
  doctor?: typeof doctorsTable.$inferSelect | null;
  appointment?: typeof appointmentsTable.$inferSelect | null;
};

interface ClinicalAttendanceViewProps {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
  clinic: typeof clinicsTable.$inferSelect;
  appointment?: (typeof appointmentsTable.$inferSelect & {
    doctor?: typeof doctorsTable.$inferSelect | null;
  }) | null;
  records: MedicalRecordItem[];
  userRole?: string;
}

const COMMON_CIDS = [
  { code: "Z00.0", label: "Exame geral / Rotina" },
  { code: "I10", label: "Hipertensão essencial" },
  { code: "E11", label: "Diabetes Mellitus Tipo 2" },
  { code: "J06.9", label: "Infecção VAS / Resfriado" },
  { code: "M54.5", label: "Dor lombar baixa" },
  { code: "K29.7", label: "Gastrite" },
  { code: "F41.1", label: "Ansiedade generalizada" },
  { code: "R51", label: "Cefaleia" },
];

export function ClinicalAttendanceView({
  patient,
  doctor,
  clinic,
  appointment,
  records,
  userRole = "doctor",
}: ClinicalAttendanceViewProps) {
  const router = useRouter();

  // Estados dos Sinais Vitais
  const [vitalSigns, setVitalSigns] = useState({
    weight: "",
    height: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
    respiratoryRate: "",
  });

  // Queixa Principal
  const [chiefComplaint, setChiefComplaint] = useState("");

  // SOAP
  const [soapMode, setSoapMode] = useState<"soap" | "free">("soap");
  const [soapData, setSoapData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    freeText: "",
  });

  // Diagnóstico & Conduta
  const [diagnosis, setDiagnosis] = useState("");
  const [conduct, setConduct] = useState("retorno");
  const [returnPeriod, setReturnPeriod] = useState("30");
  const [prescription, setPrescription] = useState("");

  // Diálogos modais
  const [historyOpen, setHistoryOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [examRequestOpen, setExamRequestOpen] = useState(false);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVitalChange = (field: keyof typeof vitalSigns, value: string) => {
    setVitalSigns((prev) => ({ ...prev, [field]: value }));
  };

  const handleSoapChange = (field: keyof typeof soapData, value: string) => {
    setSoapData((prev) => ({ ...prev, [field]: value }));
  };

  // Aplica um modelo clínico pré-configurado
  const handleApplyTemplate = (templateId: string) => {
    const tpl = BUILTIN_CLINICAL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    if (tpl.defaults.symptoms && !chiefComplaint.trim()) {
      setChiefComplaint(tpl.defaults.symptoms);
    }
    if (tpl.defaults.diagnosis && !diagnosis.trim()) {
      setDiagnosis(tpl.defaults.diagnosis);
    }
    if (tpl.defaults.bloodPressure && !vitalSigns.bloodPressure) {
      setVitalSigns((prev) => ({ ...prev, bloodPressure: tpl.defaults.bloodPressure || "" }));
    }
    if (tpl.defaults.heartRate && !vitalSigns.heartRate) {
      setVitalSigns((prev) => ({ ...prev, heartRate: tpl.defaults.heartRate || "" }));
    }

    setSoapData((prev) => ({
      ...prev,
      subjective: tpl.defaults.symptoms || prev.subjective,
      objective: tpl.defaults.notes || prev.objective,
      assessment: tpl.defaults.diagnosis || prev.assessment,
      plan: tpl.defaults.treatmentPlan || prev.plan,
    }));

    toast.success(`Modelo "${tpl.title}" aplicado com sucesso!`);
  };

  // Concluir e Salvar Atendimento
  const handleSaveAttendance = async () => {
    // Monta o texto de evolução para notes
    let notes = "";
    if (soapMode === "soap") {
      const parts = [];
      if (soapData.subjective.trim()) parts.push(`[SUBJETIVO]\n${soapData.subjective.trim()}`);
      if (soapData.objective.trim()) parts.push(`[OBJETIVO]\n${soapData.objective.trim()}`);
      if (soapData.assessment.trim()) parts.push(`[AVALIAÇÃO / HIPÓTESE]\n${soapData.assessment.trim()}`);
      if (soapData.plan.trim()) parts.push(`[PLANO / CONDUTA]\n${soapData.plan.trim()}`);
      notes = parts.join("\n\n");
    } else {
      notes = soapData.freeText.trim();
    }

    if (!notes && !chiefComplaint.trim() && !diagnosis.trim()) {
      toast.error("Por favor, preencha ao menos a queixa, evolução SOAP ou hipótese diagnóstica.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Monta plano de tratamento
      let treatmentPlan = soapData.plan;
      if (conduct === "retorno") {
        treatmentPlan = `${treatmentPlan ? `${treatmentPlan}\n` : ""}Retorno previsto em ${returnPeriod} dias.`;
      } else if (conduct === "alta") {
        treatmentPlan = `${treatmentPlan ? `${treatmentPlan}\n` : ""}Alta clínica ambulatorial concedida.`;
      } else if (conduct === "encaminhamento") {
        treatmentPlan = `${treatmentPlan ? `${treatmentPlan}\n` : ""}Encaminhamento para especialidade/serviço terciário.`;
      }

      const res = await createMedicalRecord({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: appointment?.id || null,
        recordType: "medical",
        bloodPressure: vitalSigns.bloodPressure || null,
        heartRate: vitalSigns.heartRate || null,
        temperature: vitalSigns.temperature || null,
        weight: vitalSigns.weight || null,
        height: vitalSigns.height || null,
        symptoms: chiefComplaint || null,
        diagnosis: diagnosis || null,
        treatmentPlan: treatmentPlan || null,
        prescription: prescription || null,
        notes: notes || chiefComplaint || "Atendimento clínico concluído.",
      });

      if (!res?.data?.success) {
        throw new Error(res?.serverError || "Falha ao gravar prontuário.");
      }

      // Se há consulta vinculada e está pendente, confirma a realização
      if (appointment?.id && appointment.status === "pending") {
        await updateAppointmentStatus({
          id: appointment.id,
          status: "confirmed",
        });
      }

      toast.success("Atendimento clínico concluído e registrado no prontuário!");
      router.push("/atendimento");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao salvar atendimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-16">
      {/* Topbar Fixa do Atendimento */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-xl h-9 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Link href="/atendimento">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Voltar para Atendimentos</span>
            </Link>
          </Button>

          <div className="h-5 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Stethoscope className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-foreground">
                  Atendimento Clínico
                </h1>
                {appointment ? (
                  <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    Consulta Agendada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Atendimento Avulso
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate max-w-[280px] sm:max-w-md">
                Médico: Dr(a). {doctor.name} • {clinic.name}
              </p>
            </div>
          </div>
        </div>

        {/* Ações da Topbar */}
        <div className="flex items-center gap-2">
          {/* Modelos Clínicos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span className="hidden md:inline">Modelos Clínicos</span>
                <span className="md:hidden">Modelos</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
                Aplicar Modelo Rápido
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {BUILTIN_CLINICAL_TEMPLATES.map((tpl) => (
                <DropdownMenuItem
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className="rounded-lg text-xs py-2 cursor-pointer flex flex-col items-start gap-0.5"
                >
                  <span className="font-semibold text-foreground">{tpl.title}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    {tpl.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão Finalizar */}
          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={handleSaveAttendance}
            className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Clock className="size-4 animate-spin" />
                <span>Gravando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Concluir Atendimento</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Grid Principal: 2 Colunas (Ergonomia Clínica Ampla) */}
      <main className="max-w-[1700px] mx-auto w-full px-4 lg:px-8 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Estação Clínica Principal (Lg: 8 ou 9 colunas) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Barra de Sinais Vitais */}
          <VitalSignsBar
            data={vitalSigns}
            onChange={handleVitalChange}
            allergies={patient.allergies}
            currentMedications={patient.currentMedications}
          />

          {/* Queixa Principal (QP) */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Queixa Principal (QP) / Motivo da Consulta</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Relato das queixas e tempo de início
              </span>
            </div>
            <Input
              placeholder="Ex: Paciente refere dor torácica atípica e falta de ar aos médios esforços há 3 dias..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          {/* Editor SOAP Estruturado */}
          <SoapEditor
            data={soapData}
            onChange={handleSoapChange}
            mode={soapMode}
            onModeChange={setSoapMode}
          />

          {/* Diagnóstico & Conduta */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <FileCheck className="size-4 text-emerald-600" />
                <span>Hipótese Diagnóstica & Conduta Terapêutica</span>
              </span>
            </div>

            {/* Diagnóstico e Sugestões CID-10 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Diagnóstico Principal / Código CID-10
              </Label>
              <Input
                placeholder="Ex: Z00.0 - Exame médico geral de rotina / Check-up"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />

              {/* Chips rápidos de CID-10 */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-medium text-muted-foreground mr-1">
                  CIDs Frequentes:
                </span>
                {COMMON_CIDS.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      const entry = `${c.code} - ${c.label}`;
                      setDiagnosis((prev) => (prev ? `${prev}, ${entry}` : entry));
                    }}
                    className="px-2 py-0.5 rounded-md border text-[10px] font-mono bg-muted/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
                  >
                    {c.code} ({c.label})
                  </button>
                ))}
              </div>
            </div>

            {/* Conduta e Retorno */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Conduta do Atendimento
                </Label>
                <Select value={conduct} onValueChange={setConduct}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Selecione a conduta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retorno">Retorno ambulatorial programado</SelectItem>
                    <SelectItem value="alta">Alta clínica / Tratamento concluído</SelectItem>
                    <SelectItem value="encaminhamento">Encaminhamento a especialista</SelectItem>
                    <SelectItem value="pronto-atendimento">Encaminhado ao Pronto Atendimento / Urgência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {conduct === "retorno" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Prazo Previsto para Retorno
                  </Label>
                  <Select value={returnPeriod} onValueChange={setReturnPeriod}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Dias de retorno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Em 7 dias (Reavaliação aguda)</SelectItem>
                      <SelectItem value="15">Em 15 dias</SelectItem>
                      <SelectItem value="30">Em 30 dias (Retorno com exames)</SelectItem>
                      <SelectItem value="60">Em 60 dias (Acompanhamento)</SelectItem>
                      <SelectItem value="90">Em 90 dias (Trimestral)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Orientações / Prescrição Rápida Gravada na Consulta */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Prescrição & Orientações Médicas (Gravadas no Prontuário)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrescriptionOpen(true)}
                  className="h-6 text-[11px] text-primary hover:text-primary/80 px-2"
                >
                  Abrir Gerador de Receitas
                </Button>
              </div>
              <Textarea
                placeholder="Ex: 1. Losartana Potássica 50mg - Tomar 1 cp pela manhã em jejum..."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="text-xs min-h-[70px] resize-none rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Coluna Direita: Sidebar Fixa do Paciente & Documentos (Lg: 4 ou 3 colunas) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <PatientSidebarCard
            patient={patient}
            appointment={appointment}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenPrescription={() => setPrescriptionOpen(true)}
            onOpenCertificate={() => setCertificateOpen(true)}
            onOpenExamRequest={() => setExamRequestOpen(true)}
          />

          {/* Card Resumo do Atendimento */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs text-xs space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              <span>Resumo do Atendimento</span>
            </h4>
            <div className="space-y-1 text-muted-foreground text-[11px]">
              <div className="flex justify-between">
                <span>Data:</span>
                <span className="font-medium text-foreground">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Histórico prévio:</span>
                <span className="font-medium text-foreground">
                  {records.length} atendimento(s)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profissional:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  Dr(a). {doctor.name}
                </span>
              </div>
            </div>

            <Button
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 shadow-xs"
              disabled={isSubmitting}
              onClick={handleSaveAttendance}
            >
              <Save className="size-3.5 mr-1.5" />
              Gravar Prontuário
            </Button>
          </div>
        </div>
      </main>

      {/* Drawer com Histórico e Linha do Tempo do Paciente */}
      <PatientHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        patient={patient}
        records={records}
        userRole={userRole}
      />

      {/* Modal de Prescrição Médica */}
      <PrescriptionDialog
        open={prescriptionOpen}
        onOpenChange={setPrescriptionOpen}
        patientName={patient.name}
        patientCpf={patient.cpf}
        doctorName={doctor.name}
        doctorCrm={doctor.professionalDocument}
        doctorSpecialty={doctor.specialty}
        clinicName={clinic.name}
        onApplyToRecord={(text) => {
          setPrescription((prev) => (prev ? `${prev}\n\n${text}` : text));
          toast.success("Prescrição inserida no atendimento!");
        }}
      />

      {/* Modal de Atestado Médico */}
      <MedicalCertificateDialog
        open={certificateOpen}
        onOpenChange={setCertificateOpen}
        patientName={patient.name}
        patientCpf={patient.cpf}
        doctorName={doctor.name}
        doctorCrm={doctor.professionalDocument}
        doctorSpecialty={doctor.specialty}
        clinicName={clinic.name}
        defaultCid={diagnosis}
      />

      {/* Modal de Pedido de Exames */}
      <ExamRequestDialog
        open={examRequestOpen}
        onOpenChange={setExamRequestOpen}
        patientName={patient.name}
        patientCpf={patient.cpf}
        doctorName={doctor.name}
        doctorCrm={doctor.professionalDocument}
        doctorSpecialty={doctor.specialty}
        clinicName={clinic.name}
      />
    </div>
  );
}
