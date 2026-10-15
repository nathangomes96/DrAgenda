"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { platformSettingsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { checkIsSuperAdmin } from "@/lib/superadmin";

const updatePlatformSettingsSchema = z.object({
  trialDays: z.number().min(1).max(90),
  pixEnabled: z.boolean(),
  pixKey: z.string().optional().nullable(),
  pixKeyType: z.string().optional().nullable(),
  pixReceiverName: z.string().optional().nullable(),
  pixWhatsappNumber: z.string().optional().nullable(),
  mercadopagoEnabled: z.boolean(),
  mercadopagoUrl: z.string().optional().nullable(),
  stripeEnabled: z.boolean(),
  stripeUrl: z.string().optional().nullable(),
});

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;

export async function getPlatformSettings() {
  const settings = await db.query.platformSettingsTable.findFirst({
    where: eq(platformSettingsTable.id, "default"),
  });

  return (
    settings ?? {
      id: "default",
      trialDays: 7,
      pixEnabled: true,
      pixKey: null,
      pixKeyType: "CNPJ",
      pixReceiverName: null,
      pixWhatsappNumber: null,
      mercadopagoEnabled: false,
      mercadopagoUrl: null,
      stripeEnabled: false,
      stripeUrl: null,
    }
  );
}

export async function updatePlatformSettings(data: UpdatePlatformSettingsInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !checkIsSuperAdmin(session.user)) {
    throw new Error(
      "Não autorizado. Apenas Super Administradores podem alterar as configurações do SaaS.",
    );
  }

  const parsed = updatePlatformSettingsSchema.parse(data);

  await db
    .insert(platformSettingsTable)
    .values({
      id: "default",
      ...parsed,
    })
    .onConflictDoUpdate({
      target: [platformSettingsTable.id],
      set: {
        ...parsed,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/assinatura");

  return { success: true };
}
