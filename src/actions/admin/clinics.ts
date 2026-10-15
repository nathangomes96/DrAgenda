"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import {
  clinicsTable,
  saasPlansTable,
  usersTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { checkIsSuperAdmin } from "@/lib/superadmin";

export async function getClinicsAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !checkIsSuperAdmin(session.user)) {
    throw new Error("Não autorizado.");
  }

  const clinics = await db.query.clinicsTable.findMany({
    orderBy: [desc(clinicsTable.createdAt)],
    with: {
      plan: true,
      usersToClinics: {
        with: {
          user: true,
        },
      },
      doctors: true,
    },
  });

  return clinics.map((c) => {
    // Busca o usuário admin/criador da clínica
    const adminLink =
      c.usersToClinics.find((utc) => utc.role === "admin") ||
      c.usersToClinics[0];

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      planStatus: c.planStatus,
      planExpiresAt: c.planExpiresAt,
      planNotes: c.planNotes,
      customMaxDoctors: c.customMaxDoctors,
      plan: c.plan
        ? {
            id: c.plan.id,
            name: c.plan.name,
            price: c.plan.price,
            maxDoctors: c.plan.maxDoctors,
          }
        : null,
      owner: adminLink?.user
        ? {
            id: adminLink.user.id,
            name: adminLink.user.name,
            email: adminLink.user.email,
          }
        : null,
      doctorsCount: c.doctors?.length || 0,
      createdAt: c.createdAt,
    };
  });
}

const renewClinicPlanSchema = z.object({
  clinicId: z.string().uuid(),
  actionType: z.enum([
    "+30d",
    "+90d",
    "+1y",
    "+7d_trial",
    "lifetime",
    "expire",
    "custom_date",
  ]),
  customDate: z.string().optional().nullable(),
  planId: z.string().uuid().optional().nullable(),
  customMaxDoctors: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type RenewClinicPlanInput = z.infer<typeof renewClinicPlanSchema>;

export async function renewClinicPlan(input: RenewClinicPlanInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !checkIsSuperAdmin(session.user)) {
    throw new Error(
      "Não autorizado. Apenas Super Administradores podem renovar ou alterar planos de empresas.",
    );
  }

  const parsed = renewClinicPlanSchema.parse(input);

  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, parsed.clinicId),
  });

  if (!clinic) {
    throw new Error("Clínica não encontrada.");
  }

  const now = new Date();
  // Se o plano ainda estiver ativo no futuro, adiciona a partir da data futura
  const currentExpires = clinic.planExpiresAt
    ? new Date(clinic.planExpiresAt)
    : null;
  const baseDate =
    currentExpires && currentExpires > now && clinic.planStatus === "active"
      ? currentExpires
      : now;

  let newExpiresAt: Date | null = null;
  let newStatus: "trial" | "active" | "expired" | "lifetime" = "active";

  switch (parsed.actionType) {
    case "+30d":
      newExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      newStatus = "active";
      break;
    case "+90d":
      newExpiresAt = new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      newStatus = "active";
      break;
    case "+1y":
      newExpiresAt = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      newStatus = "active";
      break;
    case "+7d_trial":
      newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      newStatus = "trial";
      break;
    case "lifetime":
      newExpiresAt = null;
      newStatus = "lifetime";
      break;
    case "expire":
      newExpiresAt = new Date(now.getTime() - 1000);
      newStatus = "expired";
      break;
    case "custom_date":
      if (!parsed.customDate) {
        throw new Error("Data personalizada não informada.");
      }
      newExpiresAt = new Date(parsed.customDate);
      newStatus = newExpiresAt > now ? "active" : "expired";
      break;
  }

  await db
    .update(clinicsTable)
    .set({
      planStatus: newStatus,
      planExpiresAt: newExpiresAt,
      ...(parsed.planId !== undefined ? { planId: parsed.planId } : {}),
      ...(parsed.customMaxDoctors !== undefined
        ? { customMaxDoctors: parsed.customMaxDoctors }
        : {}),
      ...(parsed.notes !== undefined ? { planNotes: parsed.notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(clinicsTable.id, parsed.clinicId));

  revalidatePath("/admin/empresas");
  revalidatePath("/dashboard");
  revalidatePath("/assinatura");

  return { success: true };
}

const updateClinicInfoSchema = z.object({
  clinicId: z.string().uuid(),
  name: z.string().min(2, "Nome da empresa é obrigatório"),
  slug: z.string().min(2, "Link/slug é obrigatório"),
  ownerName: z.string().min(2, "Nome do responsável é obrigatório"),
  ownerEmail: z.string().email("E-mail do responsável inválido"),
});

export type UpdateClinicInfoInput = z.infer<typeof updateClinicInfoSchema>;

export async function updateClinicInfoAdmin(input: UpdateClinicInfoInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !checkIsSuperAdmin(session.user)) {
    throw new Error(
      "Não autorizado. Apenas Super Administradores podem editar empresas.",
    );
  }

  const parsed = updateClinicInfoSchema.parse(input);

  // Normaliza slug (letras minúsculas, números e traços)
  const cleanSlug = parsed.slug
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!cleanSlug) {
    throw new Error("Link/slug inválido.");
  }

  // Verifica se o slug já existe em outra clínica
  const existingClinicWithSlug = await db.query.clinicsTable.findFirst({
    where: and(
      eq(clinicsTable.slug, cleanSlug),
      ne(clinicsTable.id, parsed.clinicId),
    ),
  });

  if (existingClinicWithSlug) {
    throw new Error(
      `O link "/agendar/${cleanSlug}" já está em uso por outra empresa. Escolha outro link.`,
    );
  }

  // Atualiza nome e slug da clínica
  await db
    .update(clinicsTable)
    .set({
      name: parsed.name.trim(),
      slug: cleanSlug,
      updatedAt: new Date(),
    })
    .where(eq(clinicsTable.id, parsed.clinicId));

  // Busca o usuário admin responsável pela clínica
  const adminLink = await db.query.usersToClinicsTable.findFirst({
    where: and(
      eq(usersToClinicsTable.clinicId, parsed.clinicId),
      eq(usersToClinicsTable.role, "admin"),
    ),
    with: { user: true },
  });

  if (adminLink?.userId) {
    const cleanEmail = parsed.ownerEmail.toLowerCase().trim();

    // Verifica se outro usuário já usa esse e-mail
    const existingUserWithEmail = await db.query.usersTable.findFirst({
      where: and(
        eq(usersTable.email, cleanEmail),
        ne(usersTable.id, adminLink.userId),
      ),
    });

    if (existingUserWithEmail) {
      throw new Error(
        `O e-mail "${cleanEmail}" já está cadastrado para outro usuário no sistema.`,
      );
    }

    await db
      .update(usersTable)
      .set({
        name: parsed.ownerName.trim(),
        email: cleanEmail,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, adminLink.userId));
  }

  revalidatePath("/admin/empresas");
  revalidatePath("/dashboard");
  revalidatePath("/settings/clinic");

  return { success: true, slug: cleanSlug };
}

