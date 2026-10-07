"use server";

import dayjs from "dayjs";
import { and, eq, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  appointmentsTable,
  clinicsTable,
  doctorsTable,
  patientsTable,
} from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

import { generateAppointmentCode } from "@/helpers/appointment-code";
import { getPublicAvailableTimes } from "../get-public-available-times";
import { clientAppointmentSchema } from "./schema";

export const createClientAppointment = actionClient
  .inputSchema(clientAppointmentSchema)
  .action(async ({ parsedInput }) => {
    // 1. Validação de existência da clínica
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, parsedInput.clinicId),
    });

    if (!clinic) {
      throw new Error("Clínica não encontrada ou link inativo.");
    }

    // 2. Validação do médico vinculado à clínica
    const doctor = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.id, parsedInput.doctorId),
        eq(doctorsTable.clinicId, parsedInput.clinicId),
      ),
    });

    if (!doctor) {
      throw new Error("Médico não encontrado ou não pertence a esta clínica.");
    }

    // 3. Monta data e hora do agendamento
    const [hours, minutes] = parsedInput.time.split(":").map(Number);
    const appointmentDateTime = dayjs(parsedInput.date)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .toDate();

    // 4. Verificação de segurança contra concorrência (Race Condition Prevention)
    const existingConflict = await db.query.appointmentsTable.findFirst({
      where: and(
        eq(appointmentsTable.doctorId, parsedInput.doctorId),
        eq(appointmentsTable.date, appointmentDateTime),
        ne(appointmentsTable.status, "cancelled"),
      ),
    });

    if (existingConflict) {
      throw new Error(
        "Este horário acabou de ser agendado por outro paciente. Por favor, selecione outro horário.",
      );
    }

    // 5. Validação de horários livres no médico
    const availableTimes = await getPublicAvailableTimes({
      doctorId: parsedInput.doctorId,
      date: parsedInput.date,
    });

    const isAvailable = availableTimes?.data?.some(
      (slot) => slot.value === parsedInput.time && slot.available,
    );

    if (!isAvailable) {
      throw new Error("Este horário não está disponível na escala de atendimento do profissional.");
    }

    // 6. Localização ou cadastro seguro do paciente no escopo da clínica
    const sanitizedName = parsedInput.patientName.trim();
    const sanitizedEmail = parsedInput.patientEmail.trim().toLowerCase();
    const sanitizedPhone = parsedInput.patientPhone.trim();

    let patient = await db.query.patientsTable.findFirst({
      where: and(
        eq(patientsTable.clinicId, parsedInput.clinicId),
        or(
          eq(patientsTable.email, sanitizedEmail),
          eq(patientsTable.phoneNumber, sanitizedPhone),
        ),
      ),
    });

    if (!patient) {
      const [newPatient] = await db
        .insert(patientsTable)
        .values({
          clinicId: parsedInput.clinicId,
          name: sanitizedName,
          email: sanitizedEmail,
          phoneNumber: sanitizedPhone,
          sex: parsedInput.patientSex,
          birthDate: parsedInput.patientBirthDate || null,
        })
        .returning();
      patient = newPatient;
    } else if (parsedInput.patientBirthDate && !patient.birthDate) {
      await db
        .update(patientsTable)
        .set({
          birthDate: parsedInput.patientBirthDate,
          sex: parsedInput.patientSex,
        })
        .where(eq(patientsTable.id, patient.id));
    }

    // 7. Geração de código curto amigável e inserção com status "pending"
    let appointmentCode = generateAppointmentCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const existing = await db.query.appointmentsTable.findFirst({
        where: eq(appointmentsTable.code, appointmentCode),
      });
      if (!existing) {
        isUnique = true;
      } else {
        appointmentCode = generateAppointmentCode();
        attempts++;
      }
    }

    const [appointment] = await db
      .insert(appointmentsTable)
      .values({
        clinicId: parsedInput.clinicId,
        doctorId: parsedInput.doctorId,
        patientId: patient.id,
        date: appointmentDateTime,
        appointmentPriceInCents: doctor.appointmentPriceInCents,
        status: "pending",
        code: appointmentCode,
      })
      .returning();

    // 8. Revalidação de cache das páginas administrativas
    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return {
      success: true,
      appointmentId: appointment.id,
      appointmentCode: appointment.code || appointment.id,
      clinicName: clinic.name,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      date: parsedInput.date,
      time: parsedInput.time,
      patientName: patient.name,
      priceInCents: doctor.appointmentPriceInCents,
    };
  });
