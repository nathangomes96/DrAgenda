"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Moon,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Sunrise,
  User,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat, PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertDoctor } from "@/actions/upsert-doctor";
import { dayScheduleSchema, upsertDoctorSchema } from "@/actions/upsert-doctor/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { doctorsTable } from "@/db/schema";

import { medicalSpecialties } from "../_constants";

type DayScheduleItem = {
  day: number;
  label: string;
  enabled: boolean;
  morningEnabled: boolean;
  morningFromTime: string;
  morningToTime: string;
  afternoonEnabled: boolean;
  afternoonFromTime: string;
  afternoonToTime: string;
  fromTime: string;
  toTime: string;
};

const defaultWeekSchedules: DayScheduleItem[] = [
  {
    day: 1,
    label: "Segunda-feira",
    enabled: true,
    morningEnabled: true,
    morningFromTime: "08:00:00",
    morningToTime: "12:00:00",
    afternoonEnabled: true,
    afternoonFromTime: "13:30:00",
    afternoonToTime: "18:00:00",
    fromTime: "08:00:00",
    toTime: "18:00:00",
  },
  {
    day: 2,
    label: "Terça-feira",
    enabled: true,
    morningEnabled: true,
    morningFromTime: "08:00:00",
    morningToTime: "12:00:00",
    afternoonEnabled: true,
    afternoonFromTime: "13:30:00",
    afternoonToTime: "18:00:00",
    fromTime: "08:00:00",
    toTime: "18:00:00",
  },
  {
    day: 3,
    label: "Quarta-feira",
    enabled: true,
    morningEnabled: true,
    morningFromTime: "08:00:00",
    morningToTime: "12:00:00",
    afternoonEnabled: true,
    afternoonFromTime: "13:30:00",
    afternoonToTime: "18:00:00",
    fromTime: "08:00:00",
    toTime: "18:00:00",
  },
  {
    day: 4,
    label: "Quinta-feira",
    enabled: true,
    morningEnabled: true,
    morningFromTime: "08:00:00",
    morningToTime: "12:00:00",
    afternoonEnabled: true,
    afternoonFromTime: "13:30:00",
    afternoonToTime: "18:00:00",
    fromTime: "08:00:00",
    toTime: "18:00:00",
  },
  {
    day: 5,
    label: "Sexta-feira",
    enabled: true,
    morningEnabled: true,
    morningFromTime: "08:00:00",
    morningToTime: "12:00:00",
    afternoonEnabled: true,
    afternoonFromTime: "13:30:00",
    afternoonToTime: "18:00:00",
    fromTime: "08:00:00",
    toTime: "18:00:00",
  },
  {
    day: 6,
    label: "Sábado",
    enabled: false,
    morningEnabled: true,
    morningFromTime: "08:00:00",
    morningToTime: "12:00:00",
    afternoonEnabled: false,
    afternoonFromTime: "13:30:00",
    afternoonToTime: "17:00:00",
    fromTime: "08:00:00",
    toTime: "12:00:00",
  },
  {
    day: 0,
    label: "Domingo",
    enabled: false,
    morningEnabled: false,
    morningFromTime: "08:00:00",
    morningToTime: "12:00:00",
    afternoonEnabled: false,
    afternoonFromTime: "13:30:00",
    afternoonToTime: "17:00:00",
    fromTime: "08:00:00",
    toTime: "12:00:00",
  },
];

const timeOptions = [
  "06:00:00", "06:30:00", "07:00:00", "07:30:00",
  "08:00:00", "08:30:00", "09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "11:30:00", "12:00:00", "12:30:00",
  "13:00:00", "13:30:00", "14:00:00", "14:30:00", "15:00:00", "15:30:00", "16:00:00", "16:30:00", "17:00:00", "17:30:00",
  "18:00:00", "18:30:00", "19:00:00", "19:30:00", "20:00:00", "20:30:00", "21:00:00", "21:30:00", "22:00:00", "22:30:00", "23:00:00"
];

const doctorFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório." }),
  specialty: z
    .string()
    .trim()
    .min(1, { message: "Especialidade é obrigatória." }),
  professionalDocument: z.string().trim().optional(),
  email: z
    .string()
    .email({ message: "E-mail inválido." })
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  createLogin: z.boolean(),
  isAccessBlocked: z.boolean(),
  appointmentDurationInMinutes: z.number().min(5).max(480),
  password: z.string().optional().or(z.literal("")),
  appointmentPrice: z
    .number()
    .min(1, { message: "Preço da consulta é obrigatório." }),
});

type FormValues = z.infer<typeof doctorFormSchema>;

interface UpsertDoctorFormProps {
  doctor?: typeof doctorsTable.$inferSelect;
  onSuccess?: () => void;
}

const UpsertDoctorForm = ({
  doctor,
  onSuccess,
}: UpsertDoctorFormProps = {}) => {
  const [activeTab, setActiveTab] = useState<string>("info");
  const [showPassword, setShowPassword] = useState(false);

  // Inicializa os horários flexíveis por dia com suporte a turnos (Manhã e Tarde)
  const [schedules, setSchedules] = useState<DayScheduleItem[]>(() => {
    if (doctor?.schedules && Array.isArray(doctor.schedules) && doctor.schedules.length > 0) {
      return defaultWeekSchedules.map((dw) => {
        const found = (doctor.schedules as any[]).find((s) => s.day === dw.day);
        if (found) {
          const hasTurnos =
            found.morningEnabled !== undefined || found.afternoonEnabled !== undefined;

          if (hasTurnos) {
            return {
              ...dw,
              enabled: !!found.enabled,
              morningEnabled: found.morningEnabled ?? true,
              morningFromTime: found.morningFromTime || "08:00:00",
              morningToTime: found.morningToTime || "12:00:00",
              afternoonEnabled: found.afternoonEnabled ?? true,
              afternoonFromTime: found.afternoonFromTime || "13:30:00",
              afternoonToTime: found.afternoonToTime || "18:00:00",
              fromTime: found.fromTime || "08:00:00",
              toTime: found.toTime || "18:00:00",
            };
          }

          // Formato antigo: converte inteligentemente para turnos
          const oldFrom = found.fromTime || "08:00:00";
          const oldTo = found.toTime || "18:00:00";
          const isMorningOnly = oldTo <= "13:00:00";
          const isAfternoonOnly = oldFrom >= "12:00:00";

          return {
            ...dw,
            enabled: !!found.enabled,
            morningEnabled: !isAfternoonOnly,
            morningFromTime: isAfternoonOnly ? "08:00:00" : oldFrom,
            morningToTime: isAfternoonOnly ? "12:00:00" : (isMorningOnly ? oldTo : "12:00:00"),
            afternoonEnabled: !isMorningOnly,
            afternoonFromTime: isMorningOnly ? "13:30:00" : (isAfternoonOnly ? oldFrom : "13:30:00"),
            afternoonToTime: isMorningOnly ? "18:00:00" : oldTo,
            fromTime: oldFrom,
            toTime: oldTo,
          };
        }
        return dw;
      });
    }

    // Se tiver apenas o formato clássico no banco
    if (doctor) {
      return defaultWeekSchedules.map((dw) => {
        const isWithin =
          dw.day >= doctor.availableFromWeekDay &&
          dw.day <= doctor.availableToWeekDay;
        return {
          ...dw,
          enabled: isWithin,
        };
      });
    }

    return defaultWeekSchedules;
  });

  const form = useForm<FormValues>({
    shouldUnregister: false,
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: doctor?.name ?? "",
      specialty: doctor?.specialty ?? "",
      professionalDocument: doctor?.professionalDocument ?? "",
      email: doctor?.email ?? "",
      phone: doctor?.phone ?? "",
      bio: doctor?.bio ?? "",
      createLogin: !!doctor?.userId,
      isAccessBlocked: doctor?.isAccessBlocked ?? false,
      appointmentDurationInMinutes: doctor?.appointmentDurationInMinutes ?? 30,
      password: "",
      appointmentPrice: doctor?.appointmentPriceInCents
        ? doctor.appointmentPriceInCents / 100
        : 0,
    },
  });

  const watchCreateLogin = form.watch("createLogin");
  const watchIsAccessBlocked = form.watch("isAccessBlocked");

  const upsertDoctorAction = useAction(upsertDoctor, {
    onSuccess: () => {
      const message = doctor
        ? `Profissional ${doctor.name} atualizado com sucesso!`
        : "Profissional cadastrado com sucesso!";
      toast.success(message);
      onSuccess?.();
    },
    onError: ({ error }) => {
      if (error.validationErrors) {
        const valErrors = error.validationErrors as Record<string, any>;
        const firstKey = Object.keys(valErrors)[0];
        const firstVal = valErrors[firstKey];
        const errorMsg = Array.isArray(firstVal)
          ? firstVal[0]
          : typeof firstVal === "object" && firstVal?._errors
            ? firstVal._errors[0]
            : String(firstVal);
        toast.error(`Erro de validação: ${errorMsg}`);
        return;
      }
      toast.error(error.serverError || "Erro ao salvar profissional.");
    },
  });

  const toggleDay = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const toggleTurno = (dayIndex: number, turno: "morning" | "afternoon") => {
    setSchedules((prev) =>
      prev.map((item, idx) => {
        if (idx !== dayIndex) return item;
        const key = turno === "morning" ? "morningEnabled" : "afternoonEnabled";
        return {
          ...item,
          [key]: !item[key],
        };
      }),
    );
  };

  const updateDayTurnoTime = (
    dayIndex: number,
    field:
      | "morningFromTime"
      | "morningToTime"
      | "afternoonFromTime"
      | "afternoonToTime",
    value: string,
  ) => {
    setSchedules((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, [field]: value } : item,
      ),
    );
  };

  const applyDayTurnoPreset = (
    dayIndex: number,
    preset: "both" | "morningOnly" | "afternoonOnly" | "continuous",
  ) => {
    setSchedules((prev) =>
      prev.map((item, idx) => {
        if (idx !== dayIndex) return item;
        if (preset === "both") {
          return {
            ...item,
            enabled: true,
            morningEnabled: true,
            morningFromTime: "08:00:00",
            morningToTime: "12:00:00",
            afternoonEnabled: true,
            afternoonFromTime: "13:30:00",
            afternoonToTime: "18:00:00",
          };
        } else if (preset === "morningOnly") {
          return {
            ...item,
            enabled: true,
            morningEnabled: true,
            morningFromTime: "08:00:00",
            morningToTime: "12:00:00",
            afternoonEnabled: false,
          };
        } else if (preset === "afternoonOnly") {
          return {
            ...item,
            enabled: true,
            morningEnabled: false,
            afternoonEnabled: true,
            afternoonFromTime: "13:30:00",
            afternoonToTime: "18:00:00",
          };
        } else {
          return {
            ...item,
            enabled: true,
            morningEnabled: true,
            morningFromTime: "08:00:00",
            morningToTime: "18:00:00",
            afternoonEnabled: false,
          };
        }
      }),
    );
  };

  const setBusinessDaysStandardWithLunch = () => {
    setSchedules((prev) =>
      prev.map((item) => {
        const isBusiness = item.day >= 1 && item.day <= 5;
        return {
          ...item,
          enabled: isBusiness,
          morningEnabled: true,
          morningFromTime: "08:00:00",
          morningToTime: "12:00:00",
          afternoonEnabled: true,
          afternoonFromTime: "13:30:00",
          afternoonToTime: "18:00:00",
        };
      }),
    );
    toast.info("Aplicado Seg a Sex: 08h–12h e 13h30–18h (com almoço).");
  };

  const setBusinessDaysContinuous = () => {
    setSchedules((prev) =>
      prev.map((item) => {
        const isBusiness = item.day >= 1 && item.day <= 5;
        return {
          ...item,
          enabled: isBusiness,
          morningEnabled: true,
          morningFromTime: "08:00:00",
          morningToTime: "18:00:00",
          afternoonEnabled: false,
        };
      }),
    );
    toast.info("Aplicado Seg a Sex: 08h–18h (contínuo).");
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", pwd, { shouldValidate: true });
    setShowPassword(true);
    toast.info("Senha gerada automaticamente!");
  };

  const onSubmit = (values: FormValues) => {
    // Valida credenciais caso esteja habilitando acesso de login
    if (values.createLogin && !doctor?.userId) {
      if (!values.email || values.email.trim() === "") {
        toast.error("Para criar o acesso, o e-mail é obrigatório.");
        setActiveTab("access");
        return;
      }
      if (!values.password || values.password.length < 8) {
        toast.error("Para criar o acesso, a senha deve ter no mínimo 8 dígitos.");
        setActiveTab("access");
        return;
      }
    }

    if (values.password && values.password.length > 0 && values.password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 dígitos.");
      setActiveTab("access");
      return;
    }

    // Valida se ao menos um dia está ativo
    const enabledDays = schedules.filter((s) => s.enabled);
    if (enabledDays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana para atendimento.");
      setActiveTab("schedule");
      return;
    }

    // Valida se cada dia ativo possui ao menos um turno habilitado
    for (const d of enabledDays) {
      if (!d.morningEnabled && !d.afternoonEnabled) {
        toast.error(`Ative ao menos um turno (Manhã ou Tarde) para ${d.label}.`);
        setActiveTab("schedule");
        return;
      }
    }

    const payloadSchedules = schedules.map((s) => {
      let from = "08:00:00";
      let to = "18:00:00";

      if (s.morningEnabled && s.afternoonEnabled) {
        from = s.morningFromTime || "08:00:00";
        to = s.afternoonToTime || "18:00:00";
      } else if (s.morningEnabled) {
        from = s.morningFromTime || "08:00:00";
        to = s.morningToTime || "12:00:00";
      } else if (s.afternoonEnabled) {
        from = s.afternoonFromTime || "13:30:00";
        to = s.afternoonToTime || "18:00:00";
      }

      return {
        day: s.day,
        enabled: s.enabled,
        morningEnabled: s.morningEnabled,
        morningFromTime: s.morningFromTime,
        morningToTime: s.morningToTime,
        afternoonEnabled: s.afternoonEnabled,
        afternoonFromTime: s.afternoonFromTime,
        afternoonToTime: s.afternoonToTime,
        fromTime: from,
        toTime: to,
      };
    });

    const activePayload = payloadSchedules.filter((s) => s.enabled);
    const sortedDays = [...activePayload].sort((a, b) => a.day - b.day);
    const minDay = sortedDays[0].day;
    const maxDay = sortedDays[sortedDays.length - 1].day;
    const firstFrom = sortedDays[0].fromTime;
    const firstTo = sortedDays[0].toTime;

    upsertDoctorAction.execute({
      id: doctor?.id,
      name: values.name,
      specialty: values.specialty,
      professionalDocument: values.professionalDocument || null,
      email: values.email || null,
      phone: values.phone || null,
      bio: values.bio || null,
      createLogin: values.createLogin,
      isAccessBlocked: values.isAccessBlocked,
      appointmentDurationInMinutes: values.appointmentDurationInMinutes,
      password: values.password || null,
      availableFromWeekDay: minDay,
      availableToWeekDay: maxDay,
      availableFromTime: firstFrom,
      availableToTime: firstTo,
      schedules: payloadSchedules,
      appointmentPriceInCents: Math.round(values.appointmentPrice * 100),
    });
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
    if (errors.name) {
      toast.error(errors.name.message || "Nome é obrigatório.");
      setActiveTab("info");
      return;
    }
    if (errors.specialty) {
      toast.error(errors.specialty.message || "Selecione uma especialidade.");
      setActiveTab("info");
      return;
    }
    if (errors.appointmentPrice) {
      toast.error(errors.appointmentPrice.message || "Informe o valor da consulta.");
      setActiveTab("info");
      return;
    }
    if (errors.email) {
      toast.error(errors.email.message || "E-mail inválido.");
      setActiveTab("access");
      return;
    }
    if (errors.password) {
      toast.error(errors.password.message || "Senha de no mínimo 8 caracteres é obrigatória.");
      setActiveTab("access");
      return;
    }

    const firstMsg = Object.values(errors)[0] as any;
    toast.error(firstMsg?.message || "Por favor, revise os campos do formulário.");
  };

  return (
    <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">
              {doctor ? doctor.name : "Cadastrar Profissional"}
            </DialogTitle>
            <DialogDescription>
              {doctor
                ? "Edite os dados clínicos, acesso ao sistema e horários específicos de cada dia."
                : "Cadastre médicos, dentistas e terapeutas com login e horários por dia da semana."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1">
              <TabsTrigger value="info" className="flex items-center gap-1.5 py-2 text-xs font-semibold">
                <User className="size-3.5" />
                <span>Dados & Preço</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-1.5 py-2 text-xs font-semibold">
                <Clock className="size-3.5 text-primary" />
                <span>Dias & Horários</span>
              </TabsTrigger>
              <TabsTrigger value="access" className="flex items-center gap-1.5 py-2 text-xs font-semibold">
                <Lock className="size-3.5" />
                <span>Acesso & Login</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: Informações Gerais & Preço */}
            <TabsContent value="info" className="space-y-4 pt-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Profissional *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Dra. Mariana Costa ou Dr. Carlos Vieira"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="professionalDocument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registro Profissional (CRM / CRO / CRP / UF)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: CRM/SP 123456 ou CRO/RJ 78910"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione a especialidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {medicalSpecialties.map((specialty) => (
                            <SelectItem key={specialty.value} value={specialty.value}>
                              {specialty.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="(##) #####-####"
                          mask="_"
                          placeholder="(11) 99999-9999"
                          value={field.value || ""}
                          onValueChange={(val) => field.onChange(val.value)}
                          customInput={Input}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Consulta *</FormLabel>
                      <FormControl>
                        <NumericFormat
                          value={field.value}
                          onValueChange={(values) => field.onChange(values.floatValue || 0)}
                          decimalScale={2}
                          fixedDecimalScale
                          decimalSeparator=","
                          allowNegative={false}
                          allowLeadingZeros={false}
                          thousandSeparator="."
                          customInput={Input}
                          prefix="R$ "
                          placeholder="R$ 0,00"
                          className="font-semibold text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentDurationInMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        Tempo de Atendimento *
                      </FormLabel>
                      <Select
                        value={String(field.value || 30)}
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <FormControl>
                          <SelectTrigger className="font-medium">
                            <SelectValue placeholder="Selecione a duração..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">⏱️ 15 minutos (Encaixes / Retorno)</SelectItem>
                          <SelectItem value="20">⏱️ 20 minutos</SelectItem>
                          <SelectItem value="30">⏱️ 30 minutos (Padrão sugerido)</SelectItem>
                          <SelectItem value="40">⏱️ 40 minutos</SelectItem>
                          <SelectItem value="45">⏱️ 45 minutos</SelectItem>
                          <SelectItem value="50">⏱️ 50 minutos (Terapia / Psicologia)</SelectItem>
                          <SelectItem value="60">⏱️ 60 minutos (1 hora)</SelectItem>
                          <SelectItem value="90">⏱️ 90 minutos (1h e 30 min)</SelectItem>
                          <SelectItem value="120">⏱️ 120 minutos (2 horas)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apresentação / Mini Biografia (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Breve descrição da formação, títulos ou foco de atendimento..."
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* ABA 2: DIAS & HORÁRIOS PERSONALIZADOS COM TURNOS MANHÃ E TARDE */}
            <TabsContent value="schedule" className="space-y-4 pt-3">
              <div className="p-3 bg-muted/30 border rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="size-4 text-primary" />
                      Turnos de Atendimento (Manhã e Tarde)
                    </h4>
                    <p className="text-muted-foreground text-[11px]">
                      Configure os horários da manhã e da tarde para proteger o intervalo de almoço do profissional contra agendamentos indevidos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/50">
                  <span className="text-[11px] font-semibold text-muted-foreground mr-1">Atalhos Seg–Sex:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 bg-background hover:bg-primary/10 hover:text-primary font-medium"
                    onClick={setBusinessDaysStandardWithLunch}
                  >
                    ☀️🌙 Com Almoço (08h–12h e 13h30–18h)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 bg-background hover:bg-muted"
                    onClick={setBusinessDaysContinuous}
                  >
                    🏢 Dia Todo (08h às 18h contínuo)
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {schedules.map((item, idx) => (
                  <div
                    key={item.day}
                    className={`rounded-xl border p-3 transition-colors ${
                      item.enabled
                        ? "bg-card border-primary/30 shadow-2xs"
                        : "bg-muted/20 border-dashed opacity-60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`day-${item.day}`}
                          checked={item.enabled}
                          onChange={() => toggleDay(idx)}
                          className="size-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <Label
                          htmlFor={`day-${item.day}`}
                          className="font-bold text-sm cursor-pointer select-none"
                        >
                          {item.label}
                        </Label>
                        {item.enabled ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                            Atende neste dia
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Não atende / Folga
                          </span>
                        )}
                      </div>

                      {item.enabled && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                            onClick={() => applyDayTurnoPreset(idx, "both")}
                          >
                            ☀️🌙 Manhã & Tarde
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                            onClick={() => applyDayTurnoPreset(idx, "morningOnly")}
                          >
                            ☀️ Só Manhã
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
                            onClick={() => applyDayTurnoPreset(idx, "afternoonOnly")}
                          >
                            🌙 Só Tarde
                          </Button>
                        </div>
                      )}
                    </div>

                    {item.enabled && (
                      <div className="space-y-2.5 pt-2.5 border-t">
                        {/* TURNO MANHÃ */}
                        <div
                          className={`p-2.5 rounded-lg border transition-all ${
                            item.morningEnabled
                              ? "bg-amber-500/5 border-amber-500/30"
                              : "bg-muted/30 border-dashed opacity-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`morning-${item.day}`}
                                checked={item.morningEnabled}
                                onChange={() => toggleTurno(idx, "morning")}
                                className="size-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                              <Label
                                htmlFor={`morning-${item.day}`}
                                className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer select-none"
                              >
                                <Sun className="size-3.5 text-amber-500" />
                                Turno Manhã
                              </Label>
                            </div>
                            {!item.morningEnabled && (
                              <span className="text-[10px] text-muted-foreground italic">
                                Sem atendimento pela manhã
                              </span>
                            )}
                          </div>

                          {item.morningEnabled && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Início Manhã:</Label>
                                <Select
                                  value={item.morningFromTime}
                                  onValueChange={(val) => updateDayTurnoTime(idx, "morningFromTime", val)}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-48">
                                    {timeOptions.map((t) => (
                                      <SelectItem key={t} value={t}>{t.slice(0, 5)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Término Manhã:</Label>
                                <Select
                                  value={item.morningToTime}
                                  onValueChange={(val) => updateDayTurnoTime(idx, "morningToTime", val)}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-48">
                                    {timeOptions.map((t) => (
                                      <SelectItem key={t} value={t}>{t.slice(0, 5)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* TURNO TARDE */}
                        <div
                          className={`p-2.5 rounded-lg border transition-all ${
                            item.afternoonEnabled
                              ? "bg-blue-500/5 border-blue-500/30"
                              : "bg-muted/30 border-dashed opacity-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`afternoon-${item.day}`}
                                checked={item.afternoonEnabled}
                                onChange={() => toggleTurno(idx, "afternoon")}
                                className="size-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <Label
                                htmlFor={`afternoon-${item.day}`}
                                className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 cursor-pointer select-none"
                              >
                                <Moon className="size-3.5 text-blue-500" />
                                Turno Tarde
                              </Label>
                            </div>
                            {!item.afternoonEnabled && (
                              <span className="text-[10px] text-muted-foreground italic">
                                Sem atendimento à tarde
                              </span>
                            )}
                          </div>

                          {item.afternoonEnabled && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Início Tarde:</Label>
                                <Select
                                  value={item.afternoonFromTime}
                                  onValueChange={(val) => updateDayTurnoTime(idx, "afternoonFromTime", val)}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-48">
                                    {timeOptions.map((t) => (
                                      <SelectItem key={t} value={t}>{t.slice(0, 5)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Término Tarde:</Label>
                                <Select
                                  value={item.afternoonToTime}
                                  onValueChange={(val) => updateDayTurnoTime(idx, "afternoonToTime", val)}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-48">
                                    {timeOptions.map((t) => (
                                      <SelectItem key={t} value={t}>{t.slice(0, 5)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ABA 3: Acesso ao Sistema & Senha */}
            <TabsContent value="access" className="space-y-4 pt-3">
              <div className="rounded-xl border p-4 bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-primary" />
                      Login & Controle de Acesso do Profissional
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que este médico ou dentista acesse o sistema para ver exclusivamente a sua própria agenda e preencher os prontuários dos seus pacientes.
                    </p>
                  </div>
                </div>

                {/* CONTROLE DE BLOQUEIO DE ACESSO */}
                <div className="rounded-lg border p-3 bg-background space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Lock className="size-3.5 text-muted-foreground" />
                        Situação do Acesso
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Bloqueie ou reative o login do médico sem perder o histórico clínico de consultas e prontuários.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="isAccessBlocked"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => field.onChange(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                              !field.value
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-xs"
                                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80 opacity-60"
                            }`}
                          >
                            <Check className="size-3.5" />
                            Liberado
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                              field.value
                                ? "bg-destructive text-destructive-foreground border-destructive shadow-xs font-bold"
                                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80 opacity-60"
                            }`}
                          >
                            <ShieldAlert className="size-3.5" />
                            Bloqueado
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {watchIsAccessBlocked ? (
                    <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 mt-2">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Acesso Suspenso:</strong> Este médico está <strong>bloqueado</strong> e será impedido de logar no sistema. Os agendamentos e prontuários dele continuam guardados com segurança na clínica.
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 mt-2">
                      <Check className="size-3.5 shrink-0" />
                      <span>
                        <strong>Acesso Ativo:</strong> O profissional está autorizado a acessar o sistema com seu e-mail e senha.
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t space-y-3">
                  <FormField
                    control={form.control}
                    name="createLogin"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="createLoginCheckbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <Label htmlFor="createLoginCheckbox" className="text-xs font-semibold cursor-pointer">
                          {doctor?.userId
                            ? "Gerenciar credenciais de login (E-mail e Senha)"
                            : "Habilitar acesso ao sistema com E-mail e Senha"}
                        </Label>
                      </div>
                    )}
                  />

                  {watchCreateLogin && (
                    <div className="space-y-3 pt-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">E-mail de Login *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="medico@suaclinica.com"
                                  className="pl-9"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-xs">
                                {doctor?.userId ? "Nova Senha (deixe em branco para manter)" : "Senha de Acesso *"}
                              </FormLabel>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[11px] text-primary gap-1"
                                onClick={generateRandomPassword}
                              >
                                <Sparkles className="size-3" /> Gerar Senha
                              </Button>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder={doctor?.userId ? "Digite apenas para alterar..." : "Mínimo 8 caracteres..."}
                                  className="pl-9 pr-10"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1 size-7 text-muted-foreground"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={upsertDoctorAction.isPending}
              className="font-semibold"
            >
              {upsertDoctorAction.isPending && (
                <Loader2 className="mr-2 animate-spin size-4" />
              )}
              {doctor ? "Salvar Alterações" : "Cadastrar Profissional"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertDoctorForm;
