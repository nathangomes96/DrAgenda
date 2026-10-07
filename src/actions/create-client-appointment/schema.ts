import { z } from "zod";

export const clientAppointmentSchema = z.object({
  clinicId: z.string().uuid({ message: "Clínica inválida" }),
  doctorId: z.string().uuid({ message: "Médico inválido" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" }),
  time: z.string().min(1, { message: "Horário é obrigatório" }),
  patientName: z
    .string()
    .trim()
    .min(2, { message: "Nome completo é obrigatório (mínimo 2 caracteres)" })
    .max(120, { message: "Nome muito longo" }),
  patientEmail: z
    .string()
    .trim()
    .email({ message: "E-mail inválido" })
    .toLowerCase(),
  patientPhone: z
    .string()
    .trim()
    .min(10, { message: "Telefone/WhatsApp inválido (mínimo 10 dígitos)" })
    .max(20, { message: "Telefone inválido" }),
  patientSex: z.enum(["male", "female"], { message: "Sexo é obrigatório" }),
  patientBirthDate: z.string().trim().optional().nullable(),
});

export type ClientAppointmentSchema = z.infer<typeof clientAppointmentSchema>;
