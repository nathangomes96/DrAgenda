"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { resolveEvolutionConfig, setEvolutionSettings, setEvolutionWebhook } from "@/lib/evolution-api";
import { protectedWithRoleActionClient } from "@/lib/next-safe-action";

import { updateClinicAiAgentSchema } from "./schema";

export const updateClinicAiAgentAction = protectedWithRoleActionClient(["admin"])
  .schema(updateClinicAiAgentSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    // Busca a clínica atualizada
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, clinicId),
    });

    if (!clinic) {
      throw new Error("Clínica não encontrada.");
    }

    // Validação do módulo pago
    if (!clinic.aiAgentEnabled) {
      throw new Error(
        "O módulo Secretária IA não está habilitado para a sua clínica. Entre em contato com o suporte para contratar.",
      );
    }

    // Atualiza configurações no banco de dados
    await db
      .update(clinicsTable)
      .set({
        aiAgentActive: parsedInput.aiAgentActive,
        aiAssistantName: parsedInput.aiAssistantName.trim() || "Sofia",
        aiCustomInstructions: parsedInput.aiCustomInstructions?.trim() || null,
        aiAllowBooking: parsedInput.aiAllowBooking,
        aiAllowCancelOrConfirm: parsedInput.aiAllowCancelOrConfirm,
        updatedAt: new Date(),
      })
      .where(eq(clinicsTable.id, clinicId));

    // Sincroniza Webhook na Evolution API
    try {
      const evolutionConfig = resolveEvolutionConfig(clinic);
      if (evolutionConfig.apiUrl && evolutionConfig.apiKey) {
        // Garante que grupos do WhatsApp fiquem 100% ignorados na instância
        await setEvolutionSettings(evolutionConfig, { groupsIgnore: true });
        if (parsedInput.aiAgentActive) {
          const webhookUrl = process.env.AGENTES_WEBHOOK_URL;
          await setEvolutionWebhook(evolutionConfig, {
            enabled: true,
            url: webhookUrl,
            events: ["MESSAGES_UPSERT"],
            webhookByEvents: false,
          });
        } else {
          await setEvolutionWebhook(evolutionConfig, {
            enabled: false,
          });
        }
      }
    } catch (webhookErr) {
      console.error(
        "Aviso: Não foi possível atualizar o webhook na Evolution API:",
        webhookErr,
      );
      // Não bloqueia a gravação local caso a Evolution API esteja indisponível momentaneamente
    }

    revalidatePath("/settings/ai-agent");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: parsedInput.aiAgentActive
        ? "Secretária IA ativada e configurada com sucesso!"
        : "Configurações salvas (Atendimento IA pausado).",
    };
  });

