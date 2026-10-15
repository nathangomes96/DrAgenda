"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  clinicsTable,
  platformSettingsTable,
  saasPlansTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export interface CreateClinicInput {
  name: string;
  slug?: string | null;
  planId?: string | null;
  whatsappPhone?: string | null;
}

// Função para criar uma clínica (usada no onboarding / clinic-form)
export const createClinic = async (input: string | CreateClinicInput) => {
  // Verifica se o usuário está logado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Você precisa estar logado para criar uma clínica");
  }

  const params: CreateClinicInput =
    typeof input === "string" ? { name: input } : input;

  const clinicName = params.name.trim();
  if (!clinicName) {
    throw new Error("O nome da clínica é obrigatório");
  }

  // Gera ou valida o slug
  let finalSlug: string;
  if (params.slug && params.slug.trim()) {
    const cleanSlug = params.slug
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!cleanSlug) {
      throw new Error("Link de agendamento inválido.");
    }

    const existingWithSlug = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.slug, cleanSlug),
    });

    if (existingWithSlug) {
      throw new Error(
        `O link "/agendar/${cleanSlug}" já está em uso por outra clínica. Por favor, escolha outro link.`,
      );
    }
    finalSlug = cleanSlug;
  } else {
    const baseSlug =
      clinicName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || `clinica-${Date.now().toString(36)}`;

    finalSlug = baseSlug;
    const existingWithSlug = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.slug, finalSlug),
    });
    if (existingWithSlug) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  // Consulta configurações da plataforma para o período de teste padrão (ex: 7 dias)
  const [settings, defaultPlan] = await Promise.all([
    db.query.platformSettingsTable.findFirst({
      where: eq(platformSettingsTable.id, "default"),
    }),
    db.query.saasPlansTable.findFirst({
      where: eq(saasPlansTable.isActive, true),
      orderBy: (plans, { desc }) => [desc(plans.isPopular)],
    }),
  ]);

  // Se o usuário selecionou um plano específico, busca suas informações
  let chosenPlan = defaultPlan;
  if (params.planId) {
    const specifiedPlan = await db.query.saasPlansTable.findFirst({
      where: eq(saasPlansTable.id, params.planId),
    });
    if (specifiedPlan) {
      chosenPlan = specifiedPlan;
    }
  }

  const trialDays = settings?.trialDays ?? 7;
  const planExpiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  // Cria uma nova clínica no banco de dados com slug, período de teste e plano
  const [clinic] = await db
    .insert(clinicsTable)
    .values({
      name: clinicName,
      slug: finalSlug,
      planStatus: "trial",
      planExpiresAt,
      planId: chosenPlan?.id ?? null,
      whatsappConnectedPhone: params.whatsappPhone?.trim() || null,
      planNotes: `Período de teste inicial de ${trialDays} dias (Plano: ${chosenPlan?.name || "Padrão"})`,
    })
    .returning();

  // Associa o usuário criador como admin da clínica
  await db.insert(usersToClinicsTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
    role: "admin",
    status: "active",
  });

  revalidatePath("/dashboard");
  revalidatePath("/clinic-form");

  return {
    success: true,
    clinicId: clinic.id,
    slug: finalSlug,
  };
};
