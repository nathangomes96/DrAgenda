import { z } from "zod";

export const createClinicUserSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  role: z.enum(["admin", "doctor", "receptionist"], {
    errorMap: () => ({ message: "Selecione um cargo válido." }),
  }),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório."),
  role: z.enum(["admin", "doctor", "receptionist"], {
    errorMap: () => ({ message: "Selecione um cargo válido." }),
  }),
});

export const toggleUserStatusSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório."),
  status: z.enum(["active", "blocked"]),
});

export const removeUserFromClinicSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório."),
});
