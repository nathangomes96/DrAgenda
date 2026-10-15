"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicsTable, patientsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = protectedWithClinicActionClient
  .inputSchema(upsertPatientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx?.user.clinic?.id;
    if (!clinicId) {
      throw new Error("Clínica não encontrada.");
    }

    if (!parsedInput.id) {
      const [patientCountResult, clinicData] = await Promise.all([
        db
          .select({ total: count() })
          .from(patientsTable)
          .where(eq(patientsTable.clinicId, clinicId)),
        db.query.clinicsTable.findFirst({
          where: eq(clinicsTable.id, clinicId),
          with: { plan: true },
        }),
      ]);

      const maxPatients = clinicData?.plan?.maxPatients ?? 0;
      const currentPatientsCount = Number(patientCountResult[0]?.total || 0);

      if (maxPatients > 0 && currentPatientsCount >= maxPatients) {
        throw new Error(
          `Limite de pacientes cadastrados atingido para o plano atual (${maxPatients} pacientes). Faça upgrade para adicionar mais pacientes.`,
        );
      }
    }

    await db
      .insert(patientsTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId,
      })
      .onConflictDoUpdate({
        target: [patientsTable.id],
        set: {
          ...parsedInput,
        },
      });

    revalidatePath("/patients");
  });
