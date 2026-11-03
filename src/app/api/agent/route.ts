import { NextRequest, NextResponse } from "next/server";
import dayjs, { BRAZIL_TIMEZONE } from "@/lib/dayjs";
import { and, asc, eq, ne, or } from "drizzle-orm";

import { getPublicAvailableTimes } from "@/actions/get-public-available-times";
import { db } from "@/db";
import {
  appointmentsTable,
  clinicsTable,
  doctorsTable,
  patientsTable,
} from "@/db/schema";
import { generateAppointmentCode } from "@/helpers/appointment-code";

/**
 * Função utilitária para normalizar números de telefone e comparar
 * últimos 8 ou 9 dígitos (compatível com ou sem DDI 55 e 9º dígito móvel)
 */

function isGroupJid(phone?: string | null): boolean {
  if (!phone) return false;
  return (
    phone.includes("@g.us") ||
    phone.includes("-") ||
    phone.toLowerCase().includes("group")
  );
}

function matchPhone(phoneA: string, phoneB: string): boolean {
  if (isGroupJid(phoneA) || isGroupJid(phoneB)) return false;
  const digitsA = (phoneA || "").replace(/\D/g, "");
  const digitsB = (phoneB || "").replace(/\D/g, "");

  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;

  const minLen = Math.min(digitsA.length, digitsB.length);
  if (minLen >= 8) {
    const endA8 = digitsA.slice(-8);
    const endB8 = digitsB.slice(-8);
    if (endA8 === endB8) return true;
  }

  if (minLen >= 9) {
    const endA9 = digitsA.slice(-9);
    const endB9 = digitsB.slice(-9);
    if (endA9 === endB9) return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validação de Segurança do Header x-dragenda-key
    const authKeyHeader = req.headers.get("x-dragenda-key");
    const configuredApiKey = process.env.DRAGENDA_API_KEY;

    if (
      !configuredApiKey ||
      !authKeyHeader ||
      authKeyHeader !== configuredApiKey
    ) {
      return NextResponse.json(
        { ok: false, error: "Não autorizado: Chave de API inválida ou ausente." },
        { status: 401 },
      );
    }

    // 2. Leitura do corpo JSON
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Corpo da requisição inválido (JSON esperado)." },
        { status: 400 },
      );
    }

    const { action, instance } = body;

    if (!instance || typeof instance !== "string") {
      return NextResponse.json(
        { ok: false, error: "Identificador da instância não informado." },
        { status: 400 },
      );
    }

    // 3. Busca da clínica por whatsappInstanceName ou slug
    const cleanInstance = instance.trim();
    const clinic = await db.query.clinicsTable.findFirst({
      where: or(
        eq(clinicsTable.whatsappInstanceName, cleanInstance),
        eq(clinicsTable.slug, cleanInstance),
      ),
    });

    if (!clinic) {
      return NextResponse.json(
        { ok: false, error: "Clínica não encontrada para esta instância." },
        { status: 404 },
      );
    }

    // =========================================================================
    // AÇÃO A: get_clinic_context
    // =========================================================================
    if (action === "get_clinic_context") {
      // Se módulo não contratado, desligado ou plano expirado
      const isExpired =
        clinic.planStatus === "expired" ||
        (clinic.planStatus !== "lifetime" &&
          clinic.planExpiresAt &&
          new Date() > new Date(clinic.planExpiresAt));

      if (!clinic.aiAgentEnabled || !clinic.aiAgentActive || isExpired) {
        return NextResponse.json(
          {
            ok: true,
            clinic: {
              id: clinic.id,
              name: clinic.name,
              aiAgentEnabled: false,
            },
          },
          { status: 200 },
        );
      }

      // 1. Busca médicos ativos da clínica
      const rawDoctors = await db.query.doctorsTable.findMany({
        where: and(
          eq(doctorsTable.clinicId, clinic.id),
          eq(doctorsTable.isAccessBlocked, false),
        ),
        orderBy: [asc(doctorsTable.name)],
      });

      const doctors = rawDoctors.map((doc) => ({
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty,
        appointmentPriceInCents: doc.appointmentPriceInCents,
        appointmentDurationInMinutes: doc.appointmentDurationInMinutes || 30,
      }));

      // 2. Busca paciente pelo telefone
      const patientPhone = String(body.patientPhone || "").trim();
      if (isGroupJid(patientPhone)) {
        return NextResponse.json(
          { ok: false, error: "Interações em grupos do WhatsApp são ignoradas por segurança." },
          { status: 400 },
        );
      }
      let patientAppointments: any[] = [];
      let matchedPatientData: any = null;

      if (patientPhone) {
        const allClinicPatients = await db.query.patientsTable.findMany({
          where: eq(patientsTable.clinicId, clinic.id),
        });

        const matchedPatient = allClinicPatients.find((p) =>
          matchPhone(p.phoneNumber, patientPhone),
        );

        if (matchedPatient) {
          matchedPatientData = {
            id: matchedPatient.id,
            name: matchedPatient.name,
            sex: matchedPatient.sex,
            email: matchedPatient.email,
            phoneNumber: matchedPatient.phoneNumber,
          };

          const rawAppointments = await db.query.appointmentsTable.findMany({
            where: and(
              eq(appointmentsTable.clinicId, clinic.id),
              eq(appointmentsTable.patientId, matchedPatient.id),
            ),
            orderBy: [asc(appointmentsTable.date)],
            with: {
              doctor: true,
            },
          });

          patientAppointments = rawAppointments.map((ap) => ({
            id: ap.id,
            code: ap.code || `AG-${ap.id.slice(0, 4).toUpperCase()}`,
            date: ap.date.toISOString(),
            status: ap.status,
            doctorName: ap.doctor?.name || "Médico",
            specialty: ap.doctor?.specialty || "",
          }));
        }
      }

      return NextResponse.json(
        {
          ok: true,
          clinic: {
            id: clinic.id,
            name: clinic.name,
            aiAgentEnabled: true,
            assistantName: clinic.aiAssistantName || "Sofia",
            customInstructions: clinic.aiCustomInstructions || "",
            allowBooking: clinic.aiAllowBooking,
            allowCancelOrConfirm: clinic.aiAllowCancelOrConfirm,
          },
          doctors,
          patient: matchedPatientData,
          patientAppointments,
        },
        { status: 200 },
      );
    }

    // =========================================================================
    // AÇÃO B: get_available_times
    // =========================================================================
    if (action === "get_available_times") {
      const { doctorId, date } = body;

      if (!doctorId || !date) {
        return NextResponse.json(
          { ok: false, error: "doctorId e date são obrigatórios." },
          { status: 400 },
        );
      }

      // Valida que o médico pertence a esta clínica
      const doctor = await db.query.doctorsTable.findFirst({
        where: and(
          eq(doctorsTable.id, doctorId),
          eq(doctorsTable.clinicId, clinic.id),
        ),
      });

      if (!doctor) {
        return NextResponse.json(
          { ok: false, error: "Médico não encontrado nesta clínica." },
          { status: 404 },
        );
      }

      const timesRes = await getPublicAvailableTimes({
        doctorId,
        date,
      });

      const availableSlots = (timesRes?.data || [])
        .filter((slot) => slot.available)
        .map((slot) => slot.value.substring(0, 5));

      return NextResponse.json(
        {
          ok: true,
          date,
          availableSlots,
        },
        { status: 200 },
      );
    }

    // =========================================================================
    // AÇÃO C: create_appointment
    // =========================================================================
    if (action === "create_appointment") {
      // Valida permissão de agendamento por IA
      if (
        !clinic.aiAgentEnabled ||
        !clinic.aiAgentActive ||
        !clinic.aiAllowBooking
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Agendamento por IA desabilitado para esta clínica.",
          },
          { status: 403 },
        );
      }

      const {
        doctorId,
        date,
        time,
        patientName,
        patientPhone,
        patientSex,
        patientEmail,
      } = body;

      if (isGroupJid(patientPhone)) {
        return NextResponse.json(
          { ok: false, error: "Agendamento em grupos do WhatsApp não é permitido." },
          { status: 400 },
        );
      }
      if (!doctorId || !date || !time || !patientName || !patientPhone) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Campos obrigatórios ausentes: doctorId, date, time, patientName e patientPhone.",
          },
          { status: 400 },
        );
      }

      // Valida médico
      const doctor = await db.query.doctorsTable.findFirst({
        where: and(
          eq(doctorsTable.id, doctorId),
          eq(doctorsTable.clinicId, clinic.id),
        ),
      });

      if (!doctor || doctor.isAccessBlocked) {
        return NextResponse.json(
          { ok: false, error: "Médico não disponível nesta clínica." },
          { status: 404 },
        );
      }

      // Monta data/hora da consulta com fuso horário oficial de Brasília (America/Sao_Paulo)
      const cleanTime = String(time).trim();
      const timeParts = cleanTime.split(":");
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1] || "0", 10);
      const normalizedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
      const appointmentDateTime = dayjs
        .tz(`${date} ${normalizedTime}`, BRAZIL_TIMEZONE)
        .toDate();

      // Checagem de colisão
      const existingConflict = await db.query.appointmentsTable.findFirst({
        where: and(
          eq(appointmentsTable.doctorId, doctorId),
          eq(appointmentsTable.date, appointmentDateTime),
          ne(appointmentsTable.status, "cancelled"),
        ),
      });

      if (existingConflict) {
        return NextResponse.json(
          { ok: false, error: "Este horário acabou de ser reservado." },
          { status: 409 },
        );
      }

      // Valida se o horário está disponível na escala
      const availableTimesRes = await getPublicAvailableTimes({
        doctorId,
        date,
      });

      const formattedSlot = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      const isAvailable = (availableTimesRes?.data || []).some(
        (slot) =>
          slot.value.substring(0, 5) === formattedSlot && slot.available,
      );

      if (!isAvailable) {
        return NextResponse.json(
          {
            ok: false,
            error: "Horário indisponível na escala de trabalho do médico.",
          },
          { status: 400 },
        );
      }

      // Localização ou criação do paciente na clínica
      const sanitizedName = String(patientName).trim();
      const sanitizedPhone = String(patientPhone).trim();
      const sanitizedEmail = patientEmail
        ? String(patientEmail).trim().toLowerCase()
        : `${sanitizedPhone.replace(/\D/g, "")}@paciente.dragenda.com.br`;

      const allClinicPatients = await db.query.patientsTable.findMany({
        where: eq(patientsTable.clinicId, clinic.id),
      });

      let patient = allClinicPatients.find((p) =>
        matchPhone(p.phoneNumber, sanitizedPhone),
      );

      if (!patient) {
        const [newPatient] = await db
          .insert(patientsTable)
          .values({
            clinicId: clinic.id,
            name: sanitizedName,
            email: sanitizedEmail,
            phoneNumber: sanitizedPhone,
            sex: patientSex === "male" ? "male" : "female",
          })
          .returning();
        patient = newPatient;
      }

      // Gera código amigável AG-XXXX único
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

      // Cria agendamento
      const [appointment] = await db
        .insert(appointmentsTable)
        .values({
          clinicId: clinic.id,
          doctorId: doctor.id,
          patientId: patient.id,
          date: appointmentDateTime,
          appointmentPriceInCents: doctor.appointmentPriceInCents,
          status: "pending",
          code: appointmentCode,
        })
        .returning();

      return NextResponse.json(
        {
          ok: true,
          appointmentId: appointment.id,
          appointmentCode: appointment.code || appointmentCode,
          clinicName: clinic.name,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty,
          date,
          time: normalizedTime,
          priceInCents: doctor.appointmentPriceInCents,
        },
        { status: 200 },
      );
    }

    // =========================================================================
    // AÇÃO D: update_appointment_status
    // =========================================================================
    if (action === "update_appointment_status") {
      // Valida permissão de cancelamento/confirmação por IA
      if (
        !clinic.aiAgentEnabled ||
        !clinic.aiAgentActive ||
        !clinic.aiAllowCancelOrConfirm
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Confirmação ou cancelamento por IA desabilitado para esta clínica.",
          },
          { status: 403 },
        );
      }

      const { patientPhone, appointmentCode, status } = body;

      if (isGroupJid(patientPhone)) {
        return NextResponse.json(
          { ok: false, error: "Alteração de status em grupos do WhatsApp não é permitida." },
          { status: 400 },
        );
      }
      if (!patientPhone || !appointmentCode || !status) {
        return NextResponse.json(
          {
            ok: false,
            error: "patientPhone, appointmentCode e status são obrigatórios.",
          },
          { status: 400 },
        );
      }

      if (status !== "confirmed" && status !== "cancelled") {
        return NextResponse.json(
          {
            ok: false,
            error: 'Status deve ser "confirmed" ou "cancelled".',
          },
          { status: 400 },
        );
      }

      // Localiza a consulta pelo código ou id naquela clínica
      const cleanCode = String(appointmentCode).trim();
      const appointment = await db.query.appointmentsTable.findFirst({
        where: and(
          eq(appointmentsTable.clinicId, clinic.id),
          or(
            eq(appointmentsTable.code, cleanCode),
            eq(appointmentsTable.id, cleanCode),
          ),
        ),
        with: {
          patient: true,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { ok: false, error: "Consulta não encontrada nesta clínica." },
          { status: 404 },
        );
      }

      // Valida se a consulta pertence ao paciente pelo telefone
      if (
        !appointment.patient ||
        !matchPhone(appointment.patient.phoneNumber, String(patientPhone))
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "O telefone do paciente não confere com o agendamento informado.",
          },
          { status: 400 },
        );
      }

      // Atualiza status
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === "confirmed") {
        updateData.patientConfirmedAt = new Date();
      }

      await db
        .update(appointmentsTable)
        .set(updateData)
        .where(eq(appointmentsTable.id, appointment.id));

      return NextResponse.json(
        {
          ok: true,
          appointmentCode: appointment.code || appointment.id,
          status,
        },
        { status: 200 },
      );
    }

    // Ação desconhecida
    return NextResponse.json(
      {
        ok: false,
        error: `Ação desconhecida: "${action}". As ações válidas são: get_clinic_context, get_available_times, create_appointment, update_appointment_status.`,
      },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Erro na rota /api/agent:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro interno do servidor." },
      { status: 500 },
    );
  }
}

