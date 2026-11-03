"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import dayjs, { BRAZIL_TIMEZONE } from "@/lib/dayjs";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { getAvailableTimes } from "../get-available-times";
import { addAppointmentSchema } from "./schema";

export const addAppointment = protectedWithClinicActionClient
  .inputSchema(addAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const dateFormatted = dayjs(parsedInput.date).tz(BRAZIL_TIMEZONE).format("YYYY-MM-DD");
    const availableTimes = await getAvailableTimes({
      doctorId: parsedInput.doctorId,
      date: dateFormatted,
    });
    if (!availableTimes?.data) {
      throw new Error("No available times");
    }
    const isTimeAvailable = availableTimes.data?.some(
      (time) => time.value === parsedInput.time && time.available,
    );
    if (!isTimeAvailable) {
      throw new Error("Time not available");
    }
    const cleanTime = parsedInput.time.trim();
    const normalizedTime = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
    const appointmentDateTime = dayjs
      .tz(`${dateFormatted} ${normalizedTime}`, BRAZIL_TIMEZONE)
      .toDate();

    await db.insert(appointmentsTable).values({
      ...parsedInput,
      clinicId: ctx.user.clinic?.id,
      date: appointmentDateTime,
      status: "confirmed",
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
  });
