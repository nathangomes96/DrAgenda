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
      status: z.enum(["confirmed", "cancelled", "pending"]),
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
      status: parsedInput.status,
      updatedAt: new Date(),
    };

    if (parsedInput.status === "cancelled" || parsedInput.status === "pending") {
      updateData.patientConfirmedAt = null;
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
      status: parsedInput.status,
    };
  });
