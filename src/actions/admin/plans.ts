"use server";

import { count, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { clinicsTable, saasPlansTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { checkIsSuperAdmin } from "@/lib/superadmin";

const planSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  price: z.string().min(1, "Preço é obrigatório"),
  interval: z.enum(["month", "year"]).default("month"),
  maxDoctors: z.number().min(0, "Limite de médicos inválido"),
  maxPatients: z.number().min(0, "Limite de pacientes inválido"),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).default([]),
});

export type PlanInput = z.infer<typeof planSchema>;

export async function getPlansAdmin() {
  const plans = await db.query.saasPlansTable.findMany({
    orderBy: [desc(saasPlansTable.createdAt)],
    with: {
      clinics: true,
    },
  });

  return plans.map((plan) => ({
    ...plan,
    clinicsCount: plan.clinics?.length || 0,
  }));
}

export async function createOrUpdatePlan(input: PlanInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !checkIsSuperAdmin(session.user)) {
    throw new Error("Não autorizado. Apenas Super Administradores podem gerenciar planos.");
  }

  const parsed = planSchema.parse(input);

  if (parsed.id) {
    await db
      .update(saasPlansTable)
      .set({
        name: parsed.name,
        description: parsed.description || null,
        price: parsed.price,
        interval: parsed.interval,
        maxDoctors: parsed.maxDoctors,
        maxPatients: parsed.maxPatients,
        isPopular: parsed.isPopular,
        isActive: parsed.isActive,
        features: parsed.features,
        updatedAt: new Date(),
      })
      .where(eq(saasPlansTable.id, parsed.id));
  } else {
    await db.insert(saasPlansTable).values({
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      interval: parsed.interval,
      maxDoctors: parsed.maxDoctors,
      maxPatients: parsed.maxPatients,
      isPopular: parsed.isPopular,
      isActive: parsed.isActive,
      features: parsed.features,
    });
  }

  revalidatePath("/admin/planos");
  revalidatePath("/assinatura");

  return { success: true };
}

export async function togglePlanActive(id: string, currentStatus: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !checkIsSuperAdmin(session.user)) {
    throw new Error("Não autorizado.");
  }

  await db
    .update(saasPlansTable)
    .set({
      isActive: !currentStatus,
      updatedAt: new Date(),
    })
    .where(eq(saasPlansTable.id, id));

  revalidatePath("/admin/planos");
  revalidatePath("/assinatura");

  return { success: true };
}
