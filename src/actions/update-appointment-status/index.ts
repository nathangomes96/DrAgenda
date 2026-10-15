"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const updateAppointmentStatus = protectedWithClinicActionClient
  .inputSchema(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["confirmed", "cancelled", "pending"]).optional(),
      patientConfirmed: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const appointment = await db.query.appointmentsTable.findFirst({
      where: eq(appointmentsTable.id, parsedInput.id),
    });

    if (!appointment) {
      throw new Error("Agendamento não encontrado");
    }

    if (appointment.clinicId !== ctx.user.clinic?.id) {
      throw new Error("Acesso não autorizado a este agendamento");
    }

    const updateData: Partial<typeof appointmentsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsedInput.status) {
      updateData.status = parsedInput.status;
      if (parsedInput.status === "cancelled" || parsedInput.status === "pending") {
        updateData.patientConfirmedAt = null;
      }
    }

    if (typeof parsedInput.patientConfirmed === "boolean") {
      if (parsedInput.patientConfirmed) {
        updateData.patientConfirmedAt = new Date();
        updateData.status = "confirmed";
      } else {
        updateData.patientConfirmedAt = null;
      }
    }

    await db
      .update(appointmentsTable)
      .set(updateData)
      .where(eq(appointmentsTable.id, parsedInput.id));

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/agendamentos");

    const clinicIdentifier = ctx.user.clinic?.slug || ctx.user.clinic?.id;
    if (clinicIdentifier) {
      revalidatePath(`/agendar/${clinicIdentifier}/status/${parsedInput.id}`);
      revalidatePath(`/agendar/${clinicIdentifier}/confirmar/${parsedInput.id}`);
    }

    return {
      success: true,
      id: parsedInput.id,
      status: updateData.status || appointment.status,
      patientConfirmedAt:
        updateData.patientConfirmedAt !== undefined
          ? updateData.patientConfirmedAt
          : appointment.patientConfirmedAt,
    };
  });
