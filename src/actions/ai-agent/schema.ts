import { z } from "zod";

export const updateClinicAiAgentSchema = z.object({
  aiAgentActive: z.boolean(),
  aiAssistantName: z
    .string()
    .trim()
    .min(1, "Nome da secretária virtual é obrigatório")
    .max(50, "Nome muito longo (máximo 50 caracteres)"),
  aiCustomInstructions: z.string().optional().nullable(),
  aiAllowBooking: z.boolean(),
  aiAllowCancelOrConfirm: z.boolean(),
});

export type UpdateClinicAiAgentInput = z.infer<typeof updateClinicAiAgentSchema>;

