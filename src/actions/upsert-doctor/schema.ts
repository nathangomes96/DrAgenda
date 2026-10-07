import { z } from "zod";

export const dayScheduleSchema = z.object({
  day: z.number().min(0).max(6),
  enabled: z.boolean(),
  morningEnabled: z.boolean().optional(),
  morningFromTime: z.string().optional(),
  morningToTime: z.string().optional(),
  afternoonEnabled: z.boolean().optional(),
  afternoonFromTime: z.string().optional(),
  afternoonToTime: z.string().optional(),
  fromTime: z.string(),
  toTime: z.string(),
});

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    userId: z.string().optional().nullable(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    specialty: z.string().trim().min(1, {
      message: "Especialidade é obrigatória.",
    }),
    professionalDocument: z.string().trim().optional().nullable(),
    email: z
      .string()
      .email({ message: "E-mail inválido." })
      .optional()
      .or(z.literal(""))
      .nullable(),
    phone: z.string().trim().optional().nullable(),
    bio: z.string().trim().optional().nullable(),
    createLogin: z.boolean().optional(),
    password: z
      .string()
      .min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
      .optional()
      .or(z.literal(""))
      .nullable(),
    isAccessBlocked: z.boolean().optional().default(false),
    appointmentDurationInMinutes: z.number().min(5).max(480).default(30),
    appointmentPriceInCents: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    availableFromWeekDay: z.number().min(0).max(6),
    availableToWeekDay: z.number().min(0).max(6),
    availableFromTime: z.string().min(1, {
      message: "Hora de início é obrigatória.",
    }),
    availableToTime: z.string().min(1, {
      message: "Hora de término é obrigatória.",
    }),
    schedules: z.array(dayScheduleSchema).optional().nullable(),
  })
  .refine((data) => data.availableFromTime < data.availableToTime, {
    message: "O horário de início deve ser antes do horário de término.",
    path: ["availableToTime"],
  });

export type DaySchedule = z.infer<typeof dayScheduleSchema>;
export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
