"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable, clinicsTable } from "@/db/schema";
import {
  connectEvolutionInstance,
  getEvolutionConnectionState,
  logoutEvolutionInstance,
  resolveEvolutionConfig,
  sendEvolutionTextMessage,
} from "@/lib/evolution-api";
import { protectedWithRoleActionClient } from "@/lib/next-safe-action";
import {
  build24hReminderMessage,
  buildApprovedAppointmentMessage,
  buildTodayReminderMessage,
} from "@/lib/whatsapp-templates";

import {
  connectWhatsAppSchema,
  disconnectWhatsAppSchema,
  getWhatsAppStatusSchema,
  sendWhatsAppMessageSchema,
  updateWhatsAppConfigSchema,
} from "./schema";

/**
 * Consulta o status atual de conexão do WhatsApp da clínica
 */
export const getWhatsAppStatus = protectedWithRoleActionClient([
  "admin",
  "receptionist",
  "doctor",
])
  .schema(getWhatsAppStatusSchema ?? {})
  .action(async ({ ctx: { user } }) => {
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, user.clinic.id),
    });

    if (!clinic) throw new Error("Clínica não encontrada.");

    const config = resolveEvolutionConfig(clinic);
    const connection = await getEvolutionConnectionState(config);

    const isConnected = connection.state === "open";
    const status = isConnected
      ? "connected"
      : connection.state === "connecting"
      ? "connecting"
      : "disconnected";

    // Atualiza status no banco
    await db
      .update(clinicsTable)
      .set({
        whatsappStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(clinicsTable.id, clinic.id));

    return {
      success: true,
      state: connection.state,
      isConnected,
      instanceName: config.instanceName,
      apiUrl: config.apiUrl ? "Configurada" : "Não configurada",
    };
  });

/**
 * Solicita a conexão e o QRCode do WhatsApp
 */
export const connectWhatsApp = protectedWithRoleActionClient(["admin"])
  .schema(connectWhatsAppSchema ?? {})
  .action(async ({ ctx: { user } }) => {
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, user.clinic.id),
    });

    if (!clinic) throw new Error("Clínica não encontrada.");

    const config = resolveEvolutionConfig(clinic);
    if (!config.apiUrl || !config.apiKey) {
      throw new Error(
        "Antes de conectar, preencha a URL e a Chave de API da sua Evolution API.",
      );
    }

    const qrResult = await connectEvolutionInstance(config);

    return {
      success: true,
      base64: qrResult.base64,
      code: qrResult.code,
      pairingCode: qrResult.pairingCode,
      instanceName: config.instanceName,
    };
  });

/**
 * Desconecta a sessão do WhatsApp
 */
export const disconnectWhatsApp = protectedWithRoleActionClient(["admin"])
  .schema(disconnectWhatsAppSchema ?? {})
  .action(async ({ ctx: { user } }) => {
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, user.clinic.id),
    });

    if (!clinic) throw new Error("Clínica não encontrada.");

    const config = resolveEvolutionConfig(clinic);
    await logoutEvolutionInstance(config);

    await db
      .update(clinicsTable)
      .set({
        whatsappStatus: "disconnected",
        whatsappConnectedPhone: null,
        updatedAt: new Date(),
      })
      .where(eq(clinicsTable.id, clinic.id));

    revalidatePath("/settings/whatsapp");

    return {
      success: true,
    };
  });

/**
 * Salva as configurações de URL, Chave de API ou Nome da Instância da clínica
 */
export const updateWhatsAppConfig = protectedWithRoleActionClient(["admin"])
  .schema(updateWhatsAppConfigSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    await db
      .update(clinicsTable)
      .set({
        whatsappApiUrl: parsedInput.whatsappApiUrl?.trim() || null,
        whatsappApiKey: parsedInput.whatsappApiKey?.trim() || null,
        whatsappInstanceName: parsedInput.whatsappInstanceName?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(clinicsTable.id, clinicId));

    revalidatePath("/settings/whatsapp");

    return {
      success: true,
    };
  });

/**
 * Dispara mensagem automática via Evolution API para o paciente
 */
export const sendEvolutionMessage = protectedWithRoleActionClient([
  "admin",
  "receptionist",
  "doctor",
])
  .schema(sendWhatsAppMessageSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    const appointment = await db.query.appointmentsTable.findFirst({
      where: and(
        eq(appointmentsTable.id, parsedInput.appointmentId),
        eq(appointmentsTable.clinicId, clinicId),
      ),
      with: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    if (!appointment) {
      throw new Error("Consulta não encontrada.");
    }

    const clinic = appointment.clinic;
    const config = resolveEvolutionConfig(clinic);

    if (!config.apiUrl || !config.apiKey) {
      throw new Error(
        "A Evolution API não está configurada para esta clínica. Configure a URL e a Chave no menu WhatsApp.",
      );
    }

    // Monta a mensagem pelo template
    let textToSend = parsedInput.customText;
    if (!textToSend) {
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.BETTER_AUTH_URL ||
        "http://localhost:3000";

      const data = {
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.phoneNumber,
        doctorName: appointment.doctor.name,
        doctorSpecialty: appointment.doctor.specialty,
        clinicName: clinic.name,
        clinicId: clinic.id,
        clinicSlug: clinic.slug,
        appointmentId: appointment.id,
        date: appointment.date,
        baseUrl: origin,
      };

      if (parsedInput.templateType === "reminder_24h") {
        textToSend = build24hReminderMessage(data);
      } else if (parsedInput.templateType === "reminder_today") {
        textToSend = buildTodayReminderMessage(data);
      } else {
        textToSend = buildApprovedAppointmentMessage(data);
      }
    }

    const sendResult = await sendEvolutionTextMessage(config, {
      number: appointment.patient.phoneNumber,
      text: textToSend,
    });

    if (!sendResult.success) {
      throw new Error(sendResult.error || "Falha ao enviar mensagem.");
    }

    return {
      success: true,
      messageId: sendResult.messageId,
    };
  });
