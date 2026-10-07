"use server";

import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { normalizeAppointmentCodeQuery } from "@/helpers/appointment-code";
import { actionClient } from "@/lib/next-safe-action";

import { confirmPatientPresenceSchema } from "./schema";

export const confirmPatientPresence = actionClient
  .schema(confirmPatientPresenceSchema)
  .action(async ({ parsedInput: { appointmentId, action } }) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
    const normalized = normalizeAppointmentCodeQuery(appointmentId);

    const conditions = [
      isUuid ? eq(appointmentsTable.id, appointmentId) : undefined,
      eq(appointmentsTable.code, normalized.upper),
      normalized.withPrefix ? eq(appointmentsTable.code, normalized.withPrefix) : undefined,
    ].filter(Boolean) as any[];

    const whereCondition = conditions.length === 1 ? conditions[0] : or(...conditions);

    const appointment = await db.query.appointmentsTable.findFirst({
      where: whereCondition,
      with: {
        clinic: true,
      },
    });

    if (!appointment) {
      throw new Error("Agendamento não encontrado.");
    }

    if (action === "confirm") {
      await db
        .update(appointmentsTable)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(appointmentsTable.id, appointment.id));
    } else if (action === "cancel_request") {
      await db
        .update(appointmentsTable)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(appointmentsTable.id, appointment.id));
    }

    revalidatePath("/appointments");
    revalidatePath(
      `/agendar/${appointment.clinic.slug || appointment.clinicId}/status/${appointmentId}`,
    );

    return {
      success: true,
      status: action === "confirm" ? "confirmed" : "cancelled",
    };
  });
