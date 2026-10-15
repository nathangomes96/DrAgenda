"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  clinicsTable,
  platformSettingsTable,
  saasPlansTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

// Função para criar uma clínica
export const createClinic = async (name: string) => {
  // Verifica se o usuário está logado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Se o usuário não estiver logado, lança um erro
  if (!session?.user) {
    throw new Error("Você precisa estar logado para criar uma clínica");
  }

  // Gera slug amigável a partir do nome
  const baseSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `clinica-${Date.now().toString(36)}`;

  // Verifica se já existe clínica com este slug e adiciona sufixo se necessário
  let finalSlug = baseSlug;
  const existingWithSlug = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.slug, finalSlug),
  });
  if (existingWithSlug) {
    finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
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

  const trialDays = settings?.trialDays ?? 7;
  const planExpiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  // Cria uma nova clínica no banco de dados com slug, período de teste e plano
  const [clinic] = await db
    .insert(clinicsTable)
    .values({
      name,
      slug: finalSlug,
      planStatus: "trial",
      planExpiresAt,
      planId: defaultPlan?.id ?? null,
      planNotes: `Período de teste inicial de ${trialDays} dias`,
    })
    .returning();

  // Associa o usuário criador como admin da clínica
  await db.insert(usersToClinicsTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
    role: "admin",
  });

  redirect("/dashboard");
};
