"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import { generateTimeSlots } from "@/helpers/time";
import { actionClient } from "@/lib/next-safe-action";

export const getPublicAvailableTimes = actionClient
  .inputSchema(
    z.object({
      doctorId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  )
  .action(async ({ parsedInput }) => {
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.doctorId),
    });

    if (!doctor) {
      throw new Error("Médico não encontrado");
    }

    // Calcula o dia da semana no fuso local sem desvio de meia-noite UTC
    const [year, month, day] = parsedInput.date.split("-").map(Number);
    const selectedDayOfWeek = new Date(year, month - 1, day).getDay();

    let doctorIsAvailable = false;
    let fromTime = doctor.availableFromTime;
    let toTime = doctor.availableToTime;
    let activeDaySchedule: any = null;

    // Se o médico possui horários personalizados por dia da semana
    const schedules = doctor.schedules as any[] | null;
    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      const daySchedule = schedules.find((s) => s.day === selectedDayOfWeek);
      if (daySchedule && daySchedule.enabled) {
        doctorIsAvailable = true;
        activeDaySchedule = daySchedule;
        fromTime = daySchedule.fromTime;
        toTime = daySchedule.toTime;
      }
    } else {
      // Modo clássico retrocompatível
      doctorIsAvailable =
        selectedDayOfWeek >= doctor.availableFromWeekDay &&
        selectedDayOfWeek <= doctor.availableToWeekDay;
    }

    if (!doctorIsAvailable) {
      return [];
    }

    // Busca consultas agendadas do médico
    const appointments = await db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.doctorId, parsedInput.doctorId),
    });

    // Filtra agendamentos ativos na data selecionada
    const bookedTimesOnSelectedDate = appointments
      .filter((appointment) => {
        return (
          appointment.status !== "cancelled" &&
          dayjs(appointment.date).format("YYYY-MM-DD") === parsedInput.date
        );
      })
      .map((appointment) => dayjs(appointment.date).format("HH:mm:ss"));

    // Gera todos os horários possíveis com a duração personalizada do médico
    const slotInterval = doctor.appointmentDurationInMinutes || 30;
    const timeSlots = generateTimeSlots(slotInterval);

    // Filtra horários que estejam dentro dos turnos do médico naquele dia
    const doctorTimeSlots = timeSlots.filter((time) => {
      if (activeDaySchedule) {
        const hasTurnos =
          activeDaySchedule.morningEnabled !== undefined ||
          activeDaySchedule.afternoonEnabled !== undefined;

        if (hasTurnos) {
          const inMorning =
            activeDaySchedule.morningEnabled !== false &&
            activeDaySchedule.morningFromTime &&
            activeDaySchedule.morningToTime &&
            time >= activeDaySchedule.morningFromTime &&
            time <= activeDaySchedule.morningToTime;

          const inAfternoon =
            activeDaySchedule.afternoonEnabled &&
            activeDaySchedule.afternoonFromTime &&
            activeDaySchedule.afternoonToTime &&
            time >= activeDaySchedule.afternoonFromTime &&
            time <= activeDaySchedule.afternoonToTime;

          return inMorning || inAfternoon;
        }
      }

      return time >= fromTime && time <= toTime;
    });

    const isToday = parsedInput.date === dayjs().format("YYYY-MM-DD");
    const currentTime = dayjs().format("HH:mm:ss");

    // Retorna horários com disponibilidade real
    return doctorTimeSlots.map((time) => {
      const isPastTime = isToday && time <= currentTime;
      const isBooked = bookedTimesOnSelectedDate.includes(time);

      return {
        value: time,
        available: !isPastTime && !isBooked,
        label: time.substring(0, 5),
      };
    });
  });
