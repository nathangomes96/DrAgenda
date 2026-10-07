"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  HeartPulse,
  Loader2,
  Moon,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { createClientAppointment } from "@/actions/create-client-appointment";
import { getPublicAvailableTimes } from "@/actions/get-public-available-times";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { clinicsTable, doctorsTable } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";

interface BookingFormProps {
  clinic: typeof clinicsTable.$inferSelect;
  doctors: (typeof doctorsTable.$inferSelect)[];
}

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function BookingForm({ clinic, doctors }: BookingFormProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Passos: 1: Médico, 2: Data & Horário, 3: Dados Pessoais, 4: Confirmação Concluída
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Estados da seleção de consulta
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Dados do paciente
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientBirthDate, setPatientBirthDate] = useState("");
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [patientSex, setPatientSex] = useState<"female" | "male">("female");

  // Estado para busca de agendamento existente
  const [searchAppointmentId, setSearchAppointmentId] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dados do agendamento finalizado
  const [appointmentResult, setAppointmentResult] = useState<{
    appointmentId: string;
    appointmentCode?: string;
    doctorName: string;
    doctorSpecialty: string;
    date: string;
    time: string;
    patientName: string;
    priceInCents: number;
  } | null>(null);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Busca horários livres para o médico na data selecionada
  const { data: availableTimesResponse, isLoading: isLoadingTimes } = useQuery({
    queryKey: [
      "public-available-times",
      selectedDoctorId,
      selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : null,
    ],
    queryFn: () =>
      getPublicAvailableTimes({
        doctorId: selectedDoctorId,
        date: dayjs(selectedDate).format("YYYY-MM-DD"),
      }),
    enabled: !!selectedDoctorId && !!selectedDate,
  });

  const availableTimes = availableTimesResponse?.data || [];

  // Categorização de horários por turno para melhor experiência do usuário
  const morningSlots = availableTimes.filter((slot) => {
    const hour = parseInt(slot.value.slice(0, 2), 10);
    return hour < 12 || (hour === 12 && parseInt(slot.value.slice(3, 5), 10) === 0);
  });

  const afternoonSlots = availableTimes.filter((slot) => {
    const hour = parseInt(slot.value.slice(0, 2), 10);
    const minute = parseInt(slot.value.slice(3, 5), 10);
    const totalMin = hour * 60 + minute;
    return totalMin > 12 * 60 && totalMin <= 18 * 60;
  });

  const eveningSlots = availableTimes.filter((slot) => {
    const hour = parseInt(slot.value.slice(0, 2), 10);
    return hour > 18;
  });

  // Máscara de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    setPatientPhone(val);
  };

  // Máscara e cálculo de Idade a partir da Data de Nascimento
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);

    let formatted = val;
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setPatientBirthDate(formatted);

    // Se completou os 8 dígitos (DDMMAAAA), calcula a idade
    if (val.length === 8) {
      const day = parseInt(val.slice(0, 2), 10);
      const month = parseInt(val.slice(2, 4), 10) - 1;
      const year = parseInt(val.slice(4, 8), 10);
      const birth = new Date(year, month, day);
      const today = new Date();

      if (
        !isNaN(birth.getTime()) &&
        year >= 1900 &&
        birth <= today &&
        birth.getDate() === day &&
        birth.getMonth() === month
      ) {
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        setCalculatedAge(age >= 0 ? age : null);
      } else {
        setCalculatedAge(null);
      }
    } else {
      setCalculatedAge(null);
    }
  };

  // Action para submissão
  const createAppointmentAction = useAction(createClientAppointment, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        setAppointmentResult(data);
        setStep(4);
        toast.success("Solicitação de agendamento enviada com sucesso!");
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao solicitar agendamento.");
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      toast.error("Por favor, selecione médico, data e horário.");
      return;
    }

    if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Formata a data de nascimento para ISO YYYY-MM-DD se preenchida
    let isoBirthDate: string | undefined = undefined;
    if (patientBirthDate.length === 10) {
      const parts = patientBirthDate.split("/");
      if (parts.length === 3) {
        isoBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    createAppointmentAction.execute({
      clinicId: clinic.id,
      doctorId: selectedDoctorId,
      date: dayjs(selectedDate).format("YYYY-MM-DD"),
      time: selectedTime,
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone: patientPhone.trim(),
      patientSex,
      patientBirthDate: isoBirthDate || null,
    });
  };

  const handleSearchAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchAppointmentId.trim();
    if (!id) {
      toast.error("Por favor, informe o código do agendamento.");
      return;
    }
    setIsSearchOpen(false);
    router.push(`/agendar/${clinic.slug || clinic.id}/status/${id}`);
  };

  // Formata os dias atendidos para exibição no card
  const getDoctorAvailabilitySummary = (doctor: typeof doctorsTable.$inferSelect) => {
    if (doctor.schedules && Array.isArray(doctor.schedules) && doctor.schedules.length > 0) {
      const activeDays = (doctor.schedules as any[])
        .filter((s) => s.enabled)
        .map((s) => WEEKDAYS[s.day]?.slice(0, 3) || "");
      if (activeDays.length > 0) {
        return activeDays.join(", ");
      }
    }
    return `${WEEKDAYS[doctor.availableFromWeekDay]?.slice(0, 3)} a ${WEEKDAYS[doctor.availableToWeekDay]?.slice(0, 3)}`;
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      {/* Top Bar Institucional no estilo ClinicSuite */}
      <header className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20 shadow-xs">
            <HeartPulse className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {clinic.name}
              </h1>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex items-center gap-1 border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300 text-[11px] font-medium"
              >
                <ShieldCheck className="size-3 text-teal-500" /> Verificada
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Portal Oficial de Agendamento Online
            </p>
          </div>
        </div>

        {/* Ações do Topo: Alternar Tema & Consultar Agendamento */}
        <div className="flex items-center gap-2.5">
          {/* Seletor de Tema Claro / Escuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-md transition-all hover:bg-accent hover:border-teal-500/40 cursor-pointer"
            title="Alternar entre modo claro e escuro"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? (
              <>
                <Sun className="size-3.5 text-amber-400 transition-transform group-hover:rotate-45" />
                <span className="hidden sm:inline font-medium">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="size-3.5 text-slate-700 transition-transform group-hover:-rotate-12" />
                <span className="hidden sm:inline font-medium">Modo Escuro</span>
              </>
            )}
          </button>

          {/* Modal de busca de agendamento */}
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-md transition-all hover:bg-accent hover:border-teal-500/40 cursor-pointer"
              >
                <Search className="size-3 text-teal-600 dark:text-teal-400" />
                <span>Consultar Status</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Search className="size-4 text-teal-600 dark:text-teal-400" />
                  Consultar Agendamento
                </DialogTitle>
                <DialogDescription>
                  Informe o código da sua consulta (Ex: AG-54952) para verificar se já foi aprovado pela clínica.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSearchAppointment} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="searchId" className="text-xs font-medium">
                    Código do Agendamento
                  </Label>
                  <Input
                    id="searchId"
                    placeholder="Ex: AG-54952"
                    value={searchAppointmentId}
                    onChange={(e) => setSearchAppointmentId(e.target.value)}
                    required
                    className="font-mono text-sm"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto font-medium bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Acessar Agendamento
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Hero Header Card com visual ClinicSuite */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-900 via-[#0d3438] to-[#071d20] p-6 sm:p-8 text-white shadow-xl">
        {/* Glow de fundo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-teal-400/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-200 backdrop-blur-md border border-white/15">
              <Sparkles className="size-3 text-teal-300" /> Agendamento em 3 etapas simples
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Marque sua consulta online
            </h2>
            <p className="text-teal-100/80 text-xs sm:text-sm">
              Escolha seu especialista de preferência, visualize a grade de horários disponíveis em tempo real e confirme seu atendimento com conforto.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center rounded-2xl bg-white/[0.07] px-5 py-4 backdrop-blur-md border border-white/10 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 mb-1">
              <Clock className="size-5" />
            </div>
            <span className="text-xs font-semibold text-white">Sem Espera</span>
            <span className="text-[11px] text-teal-200/70">Resposta Ágil</span>
          </div>
        </div>

        {/* Stepper de Progresso Moderno */}
        {step < 4 && (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/15">
            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
              {/* Etapa 1 */}
              <div
                className={cn(
                  "flex items-center gap-2.5 font-medium transition-all",
                  step >= 1 ? "text-white" : "text-white/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs",
                    step > 1
                      ? "bg-teal-400 text-teal-950"
                      : step === 1
                        ? "bg-white text-teal-900 ring-4 ring-white/20"
                        : "bg-white/15 text-white/60",
                  )}
                >
                  {step > 1 ? <Check className="size-3.5 stroke-[3]" /> : "1"}
                </span>
                <span className="truncate">Especialista</span>
              </div>

              {/* Etapa 2 */}
              <div
                className={cn(
                  "flex items-center gap-2.5 font-medium transition-all",
                  step >= 2 ? "text-white" : "text-white/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs",
                    step > 2
                      ? "bg-teal-400 text-teal-950"
                      : step === 2
                        ? "bg-white text-teal-900 ring-4 ring-white/20"
                        : "bg-white/15 text-white/60",
                  )}
                >
                  {step > 2 ? <Check className="size-3.5 stroke-[3]" /> : "2"}
                </span>
                <span className="truncate">Data & Horário</span>
              </div>

              {/* Etapa 3 */}
              <div
                className={cn(
                  "flex items-center gap-2.5 font-medium transition-all",
                  step >= 3 ? "text-white" : "text-white/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs",
                    step === 3
                      ? "bg-white text-teal-900 ring-4 ring-white/20"
                      : "bg-white/15 text-white/60",
                  )}
                >
                  3
                </span>
                <span className="truncate">Seus Dados</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          ETAPA 1: ESCOLHA DO MÉDICO / ESPECIALISTA
      ======================================================== */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Selecione o Profissional
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Escolha o médico ou especialista com quem deseja realizar o atendimento.
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit text-xs border-teal-500/20 bg-teal-500/5 text-teal-700 dark:text-teal-300"
            >
              {doctors.length} {doctors.length === 1 ? "profissional disponível" : "profissionais disponíveis"}
            </Badge>
          </div>

          {doctors.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border/80 p-10 text-center">
              <Stethoscope className="mx-auto size-12 text-muted-foreground/40 mb-3" />
              <h4 className="font-semibold text-base text-foreground">
                Nenhum profissional disponível
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No momento não há médicos ou especialistas com agenda pública aberta nesta clínica.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {doctors.map((doctor) => {
                const isSelected = selectedDoctorId === doctor.id;
                return (
                  <Card
                    key={doctor.id}
                    onClick={() => {
                      setSelectedDoctorId(doctor.id);
                      setSelectedDate(undefined);
                      setSelectedTime("");
                    }}
                    className={cn(
                      "group relative cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden",
                      isSelected
                        ? "border-teal-600 bg-teal-500/[0.04] dark:bg-teal-500/[0.08] shadow-md ring-2 ring-teal-500/30"
                        : "border-border/70 bg-card hover:border-teal-500/40 hover:shadow-md hover:-translate-y-0.5",
                    )}
                  >
                    <CardHeader className="flex flex-row items-start gap-4 pb-3">
                      <div className="relative">
                        <Avatar className="size-16 border-2 border-teal-500/20 shadow-xs">
                          {doctor.avatarImageUrl ? (
                            <AvatarImage src={doctor.avatarImageUrl} alt={doctor.name} />
                          ) : null}
                          <AvatarFallback className="bg-teal-600/10 text-teal-700 dark:text-teal-300 font-bold text-lg">
                            {doctor.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <CardTitle className="text-base font-bold leading-tight truncate text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {doctor.name}
                          </CardTitle>
                          {isSelected && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-teal-600 text-white shrink-0">
                              <Check className="size-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/15 border-none text-[11px] font-medium"
                        >
                          {doctor.specialty}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2.5 pt-0 text-xs">
                      {doctor.bio && (
                        <p className="line-clamp-2 text-muted-foreground text-[11px] leading-relaxed">
                          {doctor.bio}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="size-3.5 text-teal-600 dark:text-teal-400" />
                          <span>{getDoctorAvailabilitySummary(doctor)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 px-2 py-0.5 rounded-md">
                          ⏱️ {doctor.appointmentDurationInMinutes || 30} min
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-muted-foreground text-[11px]">Valor da Consulta:</span>
                        <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                          {formatPrice(doctor.appointmentPriceInCents)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              disabled={!selectedDoctorId}
              onClick={() => setStep(2)}
              className="gap-2 px-8 font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
            >
              Continuar para Horários
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          ETAPA 2: ESCOLHA DA DATA E HORÁRIO (COM TURNOS)
      ======================================================== */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="mb-1 -ml-2 text-muted-foreground hover:text-foreground h-8 text-xs cursor-pointer"
              >
                <ArrowLeft className="mr-1 size-3.5" /> Voltar aos Especialistas
              </Button>
              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Escolha a Data e o Horário
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Consulta com <strong className="text-foreground">{selectedDoctor.name}</strong> ({selectedDoctor.specialty})
              </p>
            </div>
            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
              <span className="text-xs text-muted-foreground">Valor:</span>
              <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
                {formatPrice(selectedDoctor.appointmentPriceInCents)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* Calendário */}
            <Card className="md:col-span-6 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
              <CardHeader className="p-0 pb-3 text-center">
                <CardTitle className="text-sm font-semibold flex items-center justify-center gap-2 text-foreground">
                  <CalendarIcon className="size-4 text-teal-600 dark:text-teal-400" /> Selecione o dia
                </CardTitle>
                <CardDescription className="text-xs">
                  Dias atendidos: {getDoctorAvailabilitySummary(selectedDoctor)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex justify-center">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime("");
                  }}
                  disabled={(date) => {
                    if (date < dayjs().startOf("day").toDate()) return true;
                    const dayOfWeek = dayjs(date).day();
                    // Se o médico possuir turnos flexíveis em schedules
                    if (
                      selectedDoctor.schedules &&
                      Array.isArray(selectedDoctor.schedules) &&
                      selectedDoctor.schedules.length > 0
                    ) {
                      const dayConfig = (selectedDoctor.schedules as any[]).find(
                        (s) => s.day === dayOfWeek,
                      );
                      return !dayConfig || !dayConfig.enabled;
                    }
                    return (
                      dayOfWeek < selectedDoctor.availableFromWeekDay ||
                      dayOfWeek > selectedDoctor.availableToWeekDay
                    );
                  }}
                  className="rounded-xl border border-border/50"
                />
              </CardContent>
            </Card>

            {/* Painel de Horários Livres (Organizado em Turnos) */}
            <Card className="md:col-span-6 rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Clock className="size-4 text-teal-600 dark:text-teal-400" /> Horários Disponíveis
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedDate
                    ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                    : "Escolha uma data no calendário para ver os horários."}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                {!selectedDate ? (
                  <div className="flex h-56 flex-col items-center justify-center text-center text-muted-foreground">
                    <CalendarIcon className="size-8 opacity-30 mb-2" />
                    <p className="text-xs">Selecione uma data para carregar os horários.</p>
                  </div>
                ) : isLoadingTimes ? (
                  <div className="flex h-56 flex-col items-center justify-center text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-teal-600 mb-2" />
                    <p className="text-xs">Buscando horários disponíveis...</p>
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <AlertCircle className="size-8 opacity-30 mb-2" />
                    <p className="text-xs font-semibold text-foreground">Nenhum horário livre nesta data</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Por favor, escolha outro dia disponível no calendário.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {/* Turno da Manhã */}
                    {morningSlots.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <span>☀️</span> Manhã
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {morningSlots.map((slot) => {
                            const isSelected = selectedTime === slot.value;
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedTime(slot.value)}
                                className={cn(
                                  "h-10 rounded-xl text-xs font-medium transition-all duration-150 border cursor-pointer",
                                  isSelected
                                    ? "bg-teal-600 text-white font-bold border-teal-600 shadow-md scale-[1.02]"
                                    : slot.available
                                      ? "bg-background border-border/80 hover:border-teal-500/50 hover:bg-teal-500/5 text-foreground"
                                      : "bg-muted/40 border-transparent text-muted-foreground/40 cursor-not-allowed line-through",
                                )}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Turno da Tarde */}
                    {afternoonSlots.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <span>🌤️</span> Tarde
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {afternoonSlots.map((slot) => {
                            const isSelected = selectedTime === slot.value;
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedTime(slot.value)}
                                className={cn(
                                  "h-10 rounded-xl text-xs font-medium transition-all duration-150 border cursor-pointer",
                                  isSelected
                                    ? "bg-teal-600 text-white font-bold border-teal-600 shadow-md scale-[1.02]"
                                    : slot.available
                                    ? "bg-background border-border/80 hover:border-teal-500/50 hover:bg-teal-500/5 text-foreground"
                                    : "bg-muted/40 border-transparent text-muted-foreground/40 cursor-not-allowed line-through",
                                )}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Turno da Noite */}
                    {eveningSlots.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <span>🌙</span> Noite
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {eveningSlots.map((slot) => {
                            const isSelected = selectedTime === slot.value;
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedTime(slot.value)}
                                className={cn(
                                  "h-10 rounded-xl text-xs font-medium transition-all duration-150 border cursor-pointer",
                                  isSelected
                                    ? "bg-teal-600 text-white font-bold border-teal-600 shadow-md scale-[1.02]"
                                    : slot.available
                                    ? "bg-background border-border/80 hover:border-teal-500/50 hover:bg-teal-500/5 text-foreground"
                                    : "bg-muted/40 border-transparent text-muted-foreground/40 cursor-not-allowed line-through",
                                )}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="rounded-xl cursor-pointer"
            >
              Voltar
            </Button>
            <Button
              size="lg"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(3)}
              className="gap-2 px-8 font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
            >
              Continuar para Identificação
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          ETAPA 3: DADOS DO PACIENTE (COM SEXO, DATA DE NASCIMENTO & IDADE)
      ======================================================== */}
      {step === 3 && selectedDoctor && selectedDate && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="border-b border-border/50 pb-4">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setStep(2)}
              className="mb-1 -ml-2 text-muted-foreground hover:text-foreground h-8 text-xs cursor-pointer"
            >
              <ArrowLeft className="mr-1 size-3.5" /> Alterar Data ou Horário
            </Button>
            <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Dados Pessoais do Paciente
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Informe os dados de quem comparecerá ao atendimento para que a recepção possa validar o horário.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* Formulário Principal */}
            <Card className="md:col-span-7 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <div className="space-y-1 pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <User className="size-4 text-teal-600 dark:text-teal-400" /> Informações do Paciente
                </CardTitle>
                <CardDescription className="text-xs">
                  Campos com asterisco (*) são obrigatórios
                </CardDescription>
              </div>

              {/* Nome Completo */}
              <div className="space-y-1.5">
                <Label htmlFor="patientName" className="text-xs font-medium">
                  Nome Completo *
                </Label>
                <Input
                  id="patientName"
                  placeholder="Ex: Maria Silva Santos"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="rounded-xl h-10 text-sm"
                />
              </div>

              {/* Telefone e E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="patientPhone" className="text-xs font-medium flex items-center gap-1">
                    <Phone className="size-3 text-teal-600 dark:text-teal-400" /> WhatsApp / Celular *
                  </Label>
                  <Input
                    id="patientPhone"
                    placeholder="(00) 00000-0000"
                    required
                    value={patientPhone}
                    onChange={handlePhoneChange}
                    className="rounded-xl h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="patientEmail" className="text-xs font-medium">
                    E-mail *
                  </Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="rounded-xl h-10 text-sm"
                  />
                </div>
              </div>

              {/* Data de Nascimento e Idade Calculada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="patientBirthDate" className="text-xs font-medium">
                      Data de Nascimento
                    </Label>
                    {calculatedAge !== null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-2 py-0.5 text-[11px] font-semibold animate-in fade-in">
                        🎂 {calculatedAge} {calculatedAge === 1 ? "ano" : "anos"}
                      </span>
                    )}
                  </div>
                  <Input
                    id="patientBirthDate"
                    placeholder="DD/MM/AAAA"
                    value={patientBirthDate}
                    onChange={handleBirthDateChange}
                    maxLength={10}
                    className="rounded-xl h-10 text-sm font-mono"
                  />
                </div>

                {/* Idade (Exibição Dinâmica) */}
                <div className="space-y-1.5">
                  <Label htmlFor="calculatedAgeField" className="text-xs font-medium text-muted-foreground">
                    Idade Calculada
                  </Label>
                  <Input
                    id="calculatedAgeField"
                    readOnly
                    disabled
                    value={
                      calculatedAge !== null
                        ? `${calculatedAge} ${calculatedAge === 1 ? "ano completo" : "anos completos"}`
                        : "Informe a data de nascimento"
                    }
                    className="rounded-xl h-10 text-xs bg-muted/40 font-medium text-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Sexo (apenas 'Sexo' conforme solicitado pelo usuário) */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-medium">Sexo *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPatientSex("female")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all cursor-pointer",
                      patientSex === "female"
                        ? "border-teal-500 bg-teal-500/10 text-teal-900 dark:text-teal-200 font-semibold shadow-xs ring-1 ring-teal-500/30"
                        : "border-border/80 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <span>Feminino</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientSex("male")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all cursor-pointer",
                      patientSex === "male"
                        ? "border-teal-500 bg-teal-500/10 text-teal-900 dark:text-teal-200 font-semibold shadow-xs ring-1 ring-teal-500/30"
                        : "border-border/80 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <span>Masculino</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Card Lateral de Resumo da Consulta (Sticky Summary) */}
            <Card className="md:col-span-5 rounded-2xl border border-teal-500/30 bg-teal-500/[0.03] dark:bg-teal-500/[0.06] p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-border/50 pb-3">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Resumo do Agendamento
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Revise as informações antes de enviar
                  </CardDescription>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Clínica:</span>
                    <span className="font-semibold text-right text-foreground">{clinic.name}</span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Especialista:</span>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{selectedDoctor.name}</span>
                      <span className="block text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                        {selectedDoctor.specialty}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-semibold text-foreground">
                      {format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Horário:</span>
                    <Badge variant="outline" className="font-bold text-xs border-teal-500/40 text-teal-700 dark:text-teal-300 bg-teal-500/10">
                      {selectedTime.slice(0, 5)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Duração estimada:</span>
                    <span className="font-medium text-foreground">
                      {selectedDoctor.appointmentDurationInMinutes || 30} minutos
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/50 pt-3">
                    <span className="text-muted-foreground font-medium">Valor da Consulta:</span>
                    <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400">
                      {formatPrice(selectedDoctor.appointmentPriceInCents)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-500/20 leading-relaxed">
                  <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                    <AlertCircle className="size-3.5 text-amber-600" /> Confirmação pela Recepção:
                  </p>
                  Sua solicitação será analisada pela equipe da clínica. Você receberá a confirmação pelo WhatsApp e poderá acompanhar o status em tempo real.
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createAppointmentAction.isExecuting}
                  className="w-full font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25 h-12 cursor-pointer"
                >
                  {createAppointmentAction.isExecuting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Enviando Solicitação...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Confirmar Solicitação de Agendamento
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </form>
      )}

      {/* ========================================================
          ETAPA 4: SUCESSO / TICKET DE CONFIRMAÇÃO
      ======================================================== */}
      {step === 4 && appointmentResult && (
        <Card className="rounded-3xl border border-teal-500/30 bg-card shadow-2xl p-6 sm:p-10 text-center animate-in zoom-in-95 duration-300 max-w-2xl mx-auto">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-8 ring-teal-500/10">
            <CheckCircle2 className="size-10" />
          </div>

          <Badge className="mb-3 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30">
            Aguardando Aprovação da Recepção
          </Badge>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Solicitação Enviada com Sucesso!
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground">
            Obrigado, <strong>{appointmentResult.patientName}</strong>! Sua solicitação de consulta já foi registrada no sistema da clínica <strong>{clinic.name}</strong>.
          </p>

          {/* Ticket de Resumo */}
          <div className="mx-auto my-6 max-w-md rounded-2xl border border-border/80 bg-muted/30 p-5 text-left shadow-xs space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Especialista:</span>
              <span className="font-semibold text-foreground">
                {appointmentResult.doctorName} ({appointmentResult.doctorSpecialty})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data e Horário:</span>
              <span className="font-semibold text-foreground">
                {dayjs(appointmentResult.date).format("DD/MM/YYYY")} às {appointmentResult.time.slice(0, 5)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {formatPrice(appointmentResult.priceInCents)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border/60 pt-2.5 text-muted-foreground">
              <span>Código da Consulta:</span>
              <span className="font-mono text-foreground font-bold text-sm bg-background px-3 py-1 rounded-lg border shadow-xs tracking-wider">
                {appointmentResult.appointmentCode || appointmentResult.appointmentId}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6">
            Guarde o código acima para acompanhar seu agendamento ou utilize o botão abaixo para verificar o status em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              className="w-full sm:w-auto gap-2 font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
            >
              <Link href={`/agendar/${clinic.slug || clinic.id}/status/${appointmentResult.appointmentCode || appointmentResult.appointmentId}`}>
                <ExternalLink className="size-4" /> Acompanhar Status da Consulta
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 font-medium rounded-xl cursor-pointer"
              onClick={() => {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const trackingCode = appointmentResult.appointmentCode || appointmentResult.appointmentId;
                const url = `${origin}/agendar/${clinic.slug || clinic.id}/status/${trackingCode}`;
                navigator.clipboard.writeText(url);
                toast.success("Link copiado para a área de transferência!");
              }}
            >
              <Copy className="size-4" /> Copiar Link
            </Button>

            <Button
              variant="ghost"
              className="w-full sm:w-auto rounded-xl cursor-pointer"
              onClick={() => {
                setStep(1);
                setSelectedDoctorId("");
                setSelectedDate(undefined);
                setSelectedTime("");
                setPatientName("");
                setPatientEmail("");
                setPatientPhone("");
                setPatientBirthDate("");
                setCalculatedAge(null);
                setAppointmentResult(null);
              }}
            >
              Novo Agendamento
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
