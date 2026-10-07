import { z } from "zod";

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phoneNumber: z.string().trim().min(1, {
    message: "Número de telefone é obrigatório.",
  }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),
  cpf: z.string().trim().optional().nullable(),
  birthDate: z.string().trim().optional().nullable(),
  allergies: z.string().trim().optional().nullable(),
  medicalHistory: z.string().trim().optional().nullable(),
  currentMedications: z.string().trim().optional().nullable(),
  bloodType: z.string().trim().optional().nullable(),
  emergencyContactName: z.string().trim().optional().nullable(),
  emergencyContactPhone: z.string().trim().optional().nullable(),
  emergencyContactRelationship: z.string().trim().optional().nullable(),
  healthInsurance: z.string().trim().optional().nullable(),
  healthInsuranceNumber: z.string().trim().optional().nullable(),
  addressZipCode: z.string().trim().optional().nullable(),
  addressStreet: z.string().trim().optional().nullable(),
  addressNumber: z.string().trim().optional().nullable(),
  addressComplement: z.string().trim().optional().nullable(),
  addressNeighborhood: z.string().trim().optional().nullable(),
  addressCity: z.string().trim().optional().nullable(),
  addressState: z.string().trim().optional().nullable(),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
