"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  HeartPulse,
  History,
  Lock,
  RotateCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { doctorsTable, patientsTable } from "@/db/schema";

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("history");
  const [currentPatient, setCurrentPatient] = useState(initialPatient);
  const [records, setRecords] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Estado da Ficha Clínica / Resumo de Saúde
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

  // Cálculo da Idade
  const patientAge = useMemo(() => {
    if (!currentPatient?.birthDate) return null;
    let birth: Date;
    if (currentPatient.birthDate.includes("-")) {
      const parts = currentPatient.birthDate.split("-");
      birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else if (currentPatient.birthDate.includes("/")) {
      const parts = currentPatient.birthDate.split("/");
      birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      birth = new Date(currentPatient.birthDate);
    }
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
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
        setCurrentPatient((prev) => ({
          ...prev,
          ...data.patient,
        }));
      }
    },
    onError: () => {
      toast.error("Erro ao carregar prontuário do paciente.");
    },
  });

  // Action para excluir registro (apenas admin ou autor)
  const deleteRecordAction = useAction(deleteMedicalRecord, {
    onSuccess: ({ data }) => {
      if (data?.id) {
        setRecords((prev) => prev.filter((r) => r.id !== data.id));
        toast.success("Registro removido com sucesso.");
      }
    },
    onError: (err) => {
      toast.error(err.error.serverError || "Erro ao remover registro.");
    },
  });

  // Action para atualizar resumo clínico do paciente
  const updateSummaryAction = useAction(updatePatientClinicalSummary, {
    onSuccess: ({ data }) => {
      if (data?.patient) {
        setCurrentPatient((prev) => ({
          ...prev,
          ...data.patient,
        }));
      }
      toast.success("Ficha de saúde atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar ficha de saúde.");
    },
  });

  const handleUpdateSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient?.id) return;
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

  const handleStartAttendance = () => {
    onOpenChange(false);
    router.push(`/atendimento/avulso?patientId=${currentPatient.id}`);
  };

  const canAccessMedicalRecords = userRole === "admin" || userRole === "doctor";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        {/* ============================================================
            CABEÇALHO COM IDENTIFICAÇÃO DO PACIENTE E AÇÃO DE ATENDER
           ============================================================ */}
        <DialogHeader className="p-5 pb-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                <ShieldCheck className="size-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {currentPatient.name}
                  </DialogTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    {currentPatient.sex === "male" ? "Masc." : "Fem."}
                    {patientAge !== null && ` • ${patientAge} anos`}
                  </Badge>
                  {currentPatient.bloodType && (
                    <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs font-bold">
                      {currentPatient.bloodType}
                    </Badge>
                  )}
                  {currentPatient.allergies && (
                    <Badge className="bg-rose-600 text-white text-xs font-bold gap-1 animate-pulse">
                      <ShieldAlert className="size-3" /> Alergias
                    </Badge>
                  )}
                </div>

                <DialogDescription className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>CPF: <strong className="text-foreground font-mono">{currentPatient.cpf || "Não informado"}</strong></span>
                  <span>•</span>
                  <span>Tel: <strong className="text-foreground">{currentPatient.phoneNumber}</strong></span>
                  {currentPatient.healthInsurance && (
                    <>
                      <span>•</span>
                      <span>Convênio: <strong className="text-foreground">{currentPatient.healthInsurance}</strong></span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Botão de Destaque: Iniciar Atendimento Clínico Completo */}
            {canAccessMedicalRecords && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={handleStartAttendance}
                  className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  <Stethoscope className="size-4" />
                  <span>Iniciar Atendimento</span>
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {!canAccessMedicalRecords ? (
          <div className="p-8 text-center space-y-3">
            <Lock className="size-8 text-destructive mx-auto" />
            <h3 className="font-bold text-destructive text-base">
              Acesso Restrito - Sigilo Médico & LGPD
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Em cumprimento à Lei Geral de Proteção de Dados e às normas do CFM, o prontuário eletrônico só pode ser acessado por profissionais de saúde e gestores autorizados.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b">
                <TabsList className="bg-muted/70 p-1">
                  <TabsTrigger value="history" className="gap-1.5 text-xs py-1.5">
                    <History className="size-3.5" /> Histórico de Atendimentos ({records.length})
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="gap-1.5 text-xs py-1.5">
                    <HeartPulse className="size-3.5 text-rose-500" /> Ficha de Saúde & Alertas
                  </TabsTrigger>
                </TabsList>

                {activeTab === "history" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => {
                      if (currentPatient?.id) {
                        getRecordsAction.execute({ patientId: currentPatient.id });
                      }
                    }}
                    disabled={getRecordsAction.isExecuting}
                  >
                    <RotateCw className={`size-3 ${getRecordsAction.isExecuting ? "animate-spin" : ""}`} />
                    <span>Atualizar</span>
                  </Button>
                )}
              </div>

              {/* ABA 1: HISTÓRICO & LINHA DO TEMPO */}
              <TabsContent value="history" className="flex-1 overflow-y-auto mt-3 pr-1">
                {getRecordsAction.isExecuting && records.length === 0 ? (
                  <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
                    Carregando histórico do prontuário sob sigilo médico...
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
                    onOpenNewTab={handleStartAttendance}
                  />
                )}
              </TabsContent>

              {/* ABA 2: FICHA DE SAÚDE & ALERTAS CLÍNICOS */}
              <TabsContent value="summary" className="flex-1 overflow-y-auto mt-3 pr-1">
                <form onSubmit={handleUpdateSummary} className="space-y-4">
                  <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <HeartPulse className="size-4 text-rose-500" />
                      Ficha de Saúde & Antecedentes Clínicos
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Mantenha atualizadas as informações vitais de alergias, medicamentos contínuos e contatos de emergência do paciente.
                    </p>
                  </div>

                  {/* Alergias */}
                  <div className="rounded-xl border border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-2">
                    <Label className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="size-4 text-rose-600" />
                      Alergias Conhecidas (Medicamentos, Látex, Alimentos)
                    </Label>
                    <Input
                      placeholder="Ex: Alérgico a Dipirona, Penicilina e Anti-inflamatórios"
                      value={editAllergies}
                      onChange={(e) => setEditAllergies(e.target.value)}
                      className="bg-background border-rose-300 focus-visible:ring-rose-500 text-xs"
                    />
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                      Caso o paciente não apresente alergias conhecidas, deixe em branco.
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
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Medicamentos de Uso Contínuo</Label>
                      <Textarea
                        rows={3}
                        placeholder="Ex: Losartana 50mg 1x/dia, AAS 100mg, Metformina 850mg..."
                        value={editCurrentMedications}
                        onChange={(e) => setEditCurrentMedications(e.target.value)}
                        className="text-xs"
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
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nome Contato Emergência</Label>
                      <Input
                        placeholder="Ex: Maria (Esposa)"
                        value={editEmergencyName}
                        onChange={(e) => setEditEmergencyName(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Telefone Emergência</Label>
                      <Input
                        placeholder="Ex: (11) 98765-4321"
                        value={editEmergencyPhone}
                        onChange={(e) => setEditEmergencyPhone(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateSummaryAction.isExecuting}
                      className="gap-1.5 text-xs font-semibold rounded-xl"
                    >
                      <Save className="size-3.5" />
                      {updateSummaryAction.isExecuting ? "Salvando..." : "Salvar Ficha de Saúde"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
