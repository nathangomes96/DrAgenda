"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";

import { db } from "@/db";
import { accountsTable, doctorsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { protectedWithRoleActionClient } from "@/lib/next-safe-action";

import {
  createClinicUserSchema,
  removeUserFromClinicSchema,
  toggleUserStatusSchema,
  updateUserRoleSchema,
} from "./schema";

export const createClinicUserAction = protectedWithRoleActionClient(["admin"])
  .schema(createClinicUserSchema)
  .action(async ({ parsedInput: { name, email, password, role }, ctx: { user } }) => {
    const clinicId = user.clinic.id;
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // 1. Verifica se já existe um usuário com esse e-mail na base geral
    let targetUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, cleanEmail),
    });

    if (!targetUser) {
      // Cria o novo usuário
      const newUserId = crypto.randomUUID();
      const hashedPassword = await hashPassword(password);

      const [createdUser] = await db
        .insert(usersTable)
        .values({
          id: newUserId,
          name: cleanName,
          email: cleanEmail,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Cria a credencial de login na tabela accounts
      await db.insert(accountsTable).values({
        id: crypto.randomUUID(),
        accountId: newUserId,
        providerId: "credential",
        userId: newUserId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      targetUser = createdUser;
    }

    // 2. Verifica se o usuário já faz parte desta clínica
    const existingMembership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, targetUser.id),
        eq(usersToClinicsTable.clinicId, clinicId),
      ),
    });

    if (existingMembership) {
      throw new Error("Este usuário já faz parte da equipe desta clínica.");
    }

    // 3. Vincula o usuário à clínica com o cargo especificado
    await db.insert(usersToClinicsTable).values({
      userId: targetUser.id,
      clinicId,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/users");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Usuário cadastrado e vinculado com sucesso.",
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role,
      },
    };
  });

export const updateUserRoleAction = protectedWithRoleActionClient(["admin"])
  .schema(updateUserRoleSchema)
  .action(async ({ parsedInput: { userId, role }, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    // Se o usuário logado estiver tentando mudar o próprio cargo de admin para outro, impede para não perder acesso de admin
    if (userId === user.id && role !== "admin") {
      throw new Error("Você não pode remover seu próprio acesso de Administrador.");
    }

    await db
      .update(usersToClinicsTable)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usersToClinicsTable.userId, userId),
          eq(usersToClinicsTable.clinicId, clinicId),
        ),
      );

    revalidatePath("/users");
    return {
      success: true,
      message: "Cargo atualizado com sucesso.",
    };
  });

export const removeUserFromClinicAction = protectedWithRoleActionClient(["admin"])
  .schema(removeUserFromClinicSchema)
  .action(async ({ parsedInput: { userId }, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    // Trava de segurança: impede autoexclusão
    if (userId === user.id) {
      throw new Error("Você não pode remover a si mesmo da clínica.");
    }

    await db
      .delete(usersToClinicsTable)
      .where(
        and(
          eq(usersToClinicsTable.userId, userId),
          eq(usersToClinicsTable.clinicId, clinicId),
        ),
      );

    revalidatePath("/users");
    return {
      success: true,
      message: "Colaborador removido da clínica com sucesso.",
    };
  });

export const toggleUserStatusAction = protectedWithRoleActionClient(["admin"])
  .schema(toggleUserStatusSchema)
  .action(async ({ parsedInput: { userId, status }, ctx: { user } }) => {
    const clinicId = user.clinic.id;

    if (userId === user.id) {
      throw new Error("Você não pode bloquear o seu próprio acesso.");
    }

    // 1. Atualiza o status do vínculo na clínica
    await db
      .update(usersToClinicsTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usersToClinicsTable.userId, userId),
          eq(usersToClinicsTable.clinicId, clinicId),
        ),
      );

    // 2. Se for um médico, sincroniza isAccessBlocked
    await db
      .update(doctorsTable)
      .set({
        isAccessBlocked: status === "blocked",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(doctorsTable.userId, userId),
          eq(doctorsTable.clinicId, clinicId),
        ),
      );

    revalidatePath("/users");
    revalidatePath("/doctors");
    revalidatePath("/appointments");

    return {
      success: true,
      message:
        status === "blocked"
          ? "Acesso bloqueado com sucesso. O colaborador não poderá mais acessar a clínica."
          : "Acesso reativado com sucesso. O colaborador pode voltar a acessar o sistema.",
    };
  });
