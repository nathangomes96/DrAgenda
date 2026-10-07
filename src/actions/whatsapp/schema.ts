import { z } from "zod";

export const getWhatsAppStatusSchema = z.object({}).optional();

export const connectWhatsAppSchema = z.object({}).optional();

export const disconnectWhatsAppSchema = z.object({}).optional();

export const updateWhatsAppConfigSchema = z.object({
  whatsappApiUrl: z.string().optional().or(z.literal("")),
  whatsappApiKey: z.string().optional().or(z.literal("")),
  whatsappInstanceName: z.string().optional().or(z.literal("")),
});

export const sendWhatsAppMessageSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
  templateType: z.enum(["reminder_24h", "reminder_today", "approved"]),
  customText: z.string().optional(),
});

export type UpdateWhatsAppConfigSchema = z.infer<
  typeof updateWhatsAppConfigSchema
>;
export type SendWhatsAppMessageSchema = z.infer<
  typeof sendWhatsAppMessageSchema
>;
