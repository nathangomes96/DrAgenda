"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  medicalRecordsTable,
  patientsTable,
} from "@/db/schema";
import { protectedWithRoleActionClient } from "@/lib/next-safe-action";

import {
  createMedicalRecordSchema,
  deleteMedicalRecordSchema,
  getMedicalRecordsSchema,
  updatePatientClinicalSummarySchema,
} from "./schema";

// Criação de evolução clínica no prontuário (Médicos, Dentistas e Admins)
export const createMedicalRecord = protectedWithRoleActionClient([
  "admin",
  "doctor",
])
  .schema(createMedicalRecordSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    // Garante que o paciente pertence à mesma clínica
    const patient = await db.query.patientsTable.findFirst({
      where: and(
        eq(patientsTable.id, parsedInput.patientId),
        eq(patientsTable.clinicId, clinicId),
      ),
    });

    if (!patient) {
      throw new Error("Paciente não encontrado ou não pertence a esta clínica.");
    }

    // Garante que o médico/profissional pertence à mesma clínica
    const doctor = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.id, parsedInput.doctorId),
        eq(doctorsTable.clinicId, clinicId),
      ),
    });

    if (!doctor) {
      throw new Error("Profissional não encontrado ou não pertence a esta clínica.");
    }

    // Insere o registro de prontuário com auditoria
    const [record] = await db
      .insert(medicalRecordsTable)
      .values({
        clinicId,
        patientId: parsedInput.patientId,
        doctorId: parsedInput.doctorId,
        appointmentId: parsedInput.appointmentId || null,
        recordType: parsedInput.recordType || "medical",
        // Sinais Vitais
        bloodPressure: parsedInput.bloodPressure || null,
        heartRate: parsedInput.heartRate || null,
        temperature: parsedInput.temperature || null,
        weight: parsedInput.weight || null,
        height: parsedInput.height || null,
        // Procedimentos Odontológicos
        teeth: parsedInput.teeth || null,
        procedureName: parsedInput.procedureName || null,
        materialsUsed: parsedInput.materialsUsed || null,
        postOpInstructions: parsedInput.postOpInstructions || null,
        // Queixa, Diagnóstico e Conduta
        symptoms: parsedInput.symptoms || null,
        diagnosis: parsedInput.diagnosis || null,
        treatmentPlan: parsedInput.treatmentPlan || null,
        prescription: parsedInput.prescription || null,
        notes: parsedInput.notes,
      })
      .returning();

    revalidatePath("/patients");

    // Busca o registro completo com médico e dados vinculados para resposta imediata na UI
    const fullRecord = await db.query.medicalRecordsTable.findFirst({
      where: eq(medicalRecordsTable.id, record.id),
      with: {
        doctor: true,
        appointment: true,
      },
    });

    return {
      success: true,
      record: fullRecord || record,
    };
  });

// Atualização rápida de resumo clínico do paciente (Alergias, Comorbidades e Remédios)
export const updatePatientClinicalSummary = protectedWithRoleActionClient([
  "admin",
  "doctor",
])
  .schema(updatePatientClinicalSummarySchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    const [updatedPatient] = await db
      .update(patientsTable)
      .set({
        allergies: parsedInput.allergies ?? null,
        medicalHistory: parsedInput.medicalHistory ?? null,
        currentMedications: parsedInput.currentMedications ?? null,
        bloodType: parsedInput.bloodType ?? null,
        emergencyContactName: parsedInput.emergencyContactName ?? null,
        emergencyContactPhone: parsedInput.emergencyContactPhone ?? null,
      })
      .where(
        and(
          eq(patientsTable.id, parsedInput.patientId),
          eq(patientsTable.clinicId, clinicId),
        ),
      )
      .returning();

    revalidatePath("/patients");

    return {
      success: true,
      patient: updatedPatient,
    };
  });

// Busca histórico do prontuário do paciente (LGPD: Sigilo estrito)
export const getPatientMedicalRecords = protectedWithRoleActionClient([
  "admin",
  "doctor",
])
  .schema(getMedicalRecordsSchema)
  .action(async ({ parsedInput: { patientId }, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    const [records, patient, appointments] = await Promise.all([
      db.query.medicalRecordsTable.findMany({
        where: and(
          eq(medicalRecordsTable.patientId, patientId),
          eq(medicalRecordsTable.clinicId, clinicId),
        ),
        orderBy: [desc(medicalRecordsTable.createdAt)],
        with: {
          doctor: true,
          appointment: true,
        },
      }),
      db.query.patientsTable.findFirst({
        where: and(
          eq(patientsTable.id, patientId),
          eq(patientsTable.clinicId, clinicId),
        ),
      }),
      db.query.appointmentsTable.findMany({
        where: and(
          eq(appointmentsTable.patientId, patientId),
          eq(appointmentsTable.clinicId, clinicId),
        ),
        orderBy: [desc(appointmentsTable.date)],
        with: {
          doctor: true,
        },
      }),
    ]);

    return {
      success: true,
      records,
      patient,
      appointments,
    };
  });

// Exclusão de registro (Auditável por Admin)
export const deleteMedicalRecord = protectedWithRoleActionClient(["admin"])
  .schema(deleteMedicalRecordSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    await db
      .delete(medicalRecordsTable)
      .where(
        and(
          eq(medicalRecordsTable.id, id),
          eq(medicalRecordsTable.clinicId, clinicId),
        ),
      );

    revalidatePath("/patients");

    return {
      success: true,
    };
  });
