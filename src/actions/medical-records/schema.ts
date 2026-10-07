import { z } from "zod";

export const createMedicalRecordSchema = z.object({
  patientId: z.string().uuid("ID do paciente inválido"),
  doctorId: z.string().uuid("Selecione o profissional responsável"),
  appointmentId: z.string().uuid().optional().nullable(),
  recordType: z.enum(["medical", "dental", "general"]).default("medical"),
  // Sinais Vitais (Médico / Geral)
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.string().optional().nullable(),
  temperature: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  height: z.string().optional().nullable(),
  // Procedimentos Odontológicos (Dentista)
  teeth: z.string().optional().nullable(),
  procedureName: z.string().optional().nullable(),
  materialsUsed: z.string().optional().nullable(),
  postOpInstructions: z.string().optional().nullable(),
  // Queixa, Diagnóstico e Conduta
  symptoms: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatmentPlan: z.string().optional().nullable(),
  prescription: z.string().optional().nullable(),
  notes: z.string().min(1, "Anotações clínicas da evolução são obrigatórias"),
});

export const getMedicalRecordsSchema = z.object({
  patientId: z.string().uuid("ID do paciente inválido"),
});

export const deleteMedicalRecordSchema = z.object({
  id: z.string().uuid("ID do registro inválido"),
});

export const updatePatientClinicalSummarySchema = z.object({
  patientId: z.string().uuid("ID do paciente inválido"),
  allergies: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  currentMedications: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
});

export type CreateMedicalRecordSchema = z.infer<typeof createMedicalRecordSchema>;
export type GetMedicalRecordsSchema = z.infer<typeof getMedicalRecordsSchema>;
export type DeleteMedicalRecordSchema = z.infer<typeof deleteMedicalRecordSchema>;
export type UpdatePatientClinicalSummarySchema = z.infer<typeof updatePatientClinicalSummarySchema>;
