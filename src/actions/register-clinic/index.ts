"use server";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  accountsTable,
  clinicsTable,
  platformSettingsTable,
  saasPlansTable,
  usersTable,
  usersToClinicsTable,
} from "@/db/schema";

const registerClinicSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().email("E-mail inválido").toLowerCase(),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  clinicName: z.string().trim().min(2, "Informe o nome da clínica ou consultório"),
  slug: z.string().optional().nullable(),
  planId: z.string().uuid().optional().nullable(),
  whatsappPhone: z.string().optional().nullable(),
});

export type RegisterClinicInput = z.infer<typeof registerClinicSchema>;

export async function registerClinicAccountAction(input: RegisterClinicInput) {
  const parsed = registerClinicSchema.parse(input);

  // 1. Verifica se já existe um usuário cadastrado com este e-mail
  const existingUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, parsed.email),
  });

  if (existingUser) {
    throw new Error(
      "Este e-mail já está cadastrado no sistema. Por favor, faça login ou use outro e-mail.",
    );
  }

  // 2. Valida ou gera o slug amigável da clínica
  let finalSlug: string;
  if (parsed.slug && parsed.slug.trim()) {
    const clean = parsed.slug
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!clean) {
      throw new Error("Link de agendamento online inválido.");
    }

    const existingSlug = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.slug, clean),
    });

    if (existingSlug) {
      throw new Error(
        `O link "/agendar/${clean}" já está em uso por outra clínica. Escolha outro link.`,
      );
    }
    finalSlug = clean;
  } else {
    const baseSlug =
      parsed.clinicName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || `clinica-${Date.now().toString(36)}`;

    finalSlug = baseSlug;
    const existingSlug = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.slug, finalSlug),
    });

    if (existingSlug) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  // 3. Consulta configurações e plano selecionado
  const [settings, defaultPlan] = await Promise.all([
    db.query.platformSettingsTable.findFirst({
      where: eq(platformSettingsTable.id, "default"),
    }),
    db.query.saasPlansTable.findFirst({
      where: eq(saasPlansTable.isActive, true),
      orderBy: (p, { desc }) => [desc(p.isPopular)],
    }),
  ]);

  let chosenPlan = defaultPlan;
  if (parsed.planId) {
    const specifiedPlan = await db.query.saasPlansTable.findFirst({
      where: eq(saasPlansTable.id, parsed.planId),
    });
    if (specifiedPlan) {
      chosenPlan = specifiedPlan;
    }
  }

  const trialDays = settings?.trialDays ?? 7;
  const planExpiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  // 4. Cria o usuário no banco de dados
  const newUserId = crypto.randomUUID();
  const hashedPassword = await hashPassword(parsed.password);

  await db.insert(usersTable).values({
    id: newUserId,
    name: parsed.name,
    email: parsed.email,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 5. Cria a credencial de login na tabela accounts do Better Auth
  await db.insert(accountsTable).values({
    id: crypto.randomUUID(),
    accountId: newUserId,
    providerId: "credential",
    userId: newUserId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 6. Cria a clínica vinculada ao plano e período de teste
  const [createdClinic] = await db
    .insert(clinicsTable)
    .values({
      name: parsed.clinicName,
      slug: finalSlug,
      planStatus: "trial",
      planExpiresAt,
      planId: chosenPlan?.id ?? null,
      whatsappConnectedPhone: parsed.whatsappPhone?.trim() || null,
      planNotes: `Cadastro público com teste de ${trialDays} dias (Plano: ${chosenPlan?.name || "Padrão"})`,
    })
    .returning();

  // 7. Vincula o usuário como administrador da clínica
  await db.insert(usersToClinicsTable).values({
    userId: newUserId,
    clinicId: createdClinic.id,
    role: "admin",
    status: "active",
  });

  return {
    success: true,
    userId: newUserId,
    clinicId: createdClinic.id,
    slug: finalSlug,
  };
}
