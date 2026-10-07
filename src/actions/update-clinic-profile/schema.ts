import { z } from "zod";

export const updateClinicProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome da clínica deve ter pelo menos 2 caracteres")
    .max(100, "O nome da clínica deve ter no máximo 100 caracteres"),
  slug: z
    .string()
    .min(3, "O link deve ter pelo menos 3 caracteres")
    .max(50, "O link deve ter no máximo 50 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "O link amigável deve conter apenas letras minúsculas, números e hífens",
    )
    .optional()
    .or(z.literal("")),
});

export type UpdateClinicProfileSchema = z.infer<
  typeof updateClinicProfileSchema
>;
