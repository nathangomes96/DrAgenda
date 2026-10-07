import { z } from "zod";

export const updateClinicSlugSchema = z.object({
  slug: z
    .string()
    .min(3, "O link deve ter pelo menos 3 caracteres")
    .max(50, "O link deve ter no máximo 50 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens (ex: clinica-saude-total)",
    ),
});

export type UpdateClinicSlugSchema = z.infer<typeof updateClinicSlugSchema>;
