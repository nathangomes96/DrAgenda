"use server";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";

import { z } from "zod";

import { db } from "@/db";
import { accountsTable, doctorsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

dayjs.extend(utc);

export const upsertDoctor = protectedWithClinicActionClient
  .inputSchema(upsertDoctorSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx?.user.clinic?.id;
    if (!clinicId) {
      throw new Error("Clínica não encontrada.");
    }

    const availableFromTime = parsedInput.availableFromTime;
    const availableToTime = parsedInput.availableToTime;

    const availableFromTimeUTC = dayjs()
      .set("hour", parseInt(availableFromTime.split(":")[0]))
      .set("minute", parseInt(availableFromTime.split(":")[1]))
      .set("second", parseInt(availableFromTime.split(":")[2] || "0"))
      .utc();
    const availableToTimeUTC = dayjs()
      .set("hour", parseInt(availableToTime.split(":")[0]))
      .set("minute", parseInt(availableToTime.split(":")[1]))
      .set("second", parseInt(availableToTime.split(":")[2] || "0"))
      .utc();

    let resolvedUserId: string | null = parsedInput.userId || null;
    const isBlocked = parsedInput.isAccessBlocked ?? false;

    // Se o administrador optou por criar ou atualizar login para o profissional
    if (parsedInput.createLogin && parsedInput.email && parsedInput.password) {
      const cleanEmail = parsedInput.email.toLowerCase().trim();
      const cleanName = parsedInput.name.trim();

      let targetUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, cleanEmail),
      });

      if (!targetUser) {
        // Cria novo usuário
        const newUserId = crypto.randomUUID();
        const hashedPassword = await hashPassword(parsedInput.password);

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

        // Cria credencial em accounts
        await db.insert(accountsTable).values({
          id: crypto.randomUUID(),
          accountId: newUserId,
          providerId: "credential",
          userId: newUserId,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Vincula à clínica como "doctor" com status respectivo
        await db.insert(usersToClinicsTable).values({
          userId: newUserId,
          clinicId,
          role: "doctor",
          status: isBlocked ? "blocked" : "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        resolvedUserId = newUserId;
      } else {
        resolvedUserId = targetUser.id;

        // Atualiza senha se fornecida
        if (parsedInput.password) {
          const hashedPassword = await hashPassword(parsedInput.password);
          const existingAccount = await db.query.accountsTable.findFirst({
            where: and(
              eq(accountsTable.userId, targetUser.id),
              eq(accountsTable.providerId, "credential"),
            ),
          });

          if (existingAccount) {
            await db
              .update(accountsTable)
              .set({ password: hashedPassword, updatedAt: new Date() })
              .where(eq(accountsTable.id, existingAccount.id));
          } else {
            await db.insert(accountsTable).values({
              id: crypto.randomUUID(),
              accountId: targetUser.id,
              providerId: "credential",
              userId: targetUser.id,
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Garante que o vínculo na clínica seja "doctor" e atualiza status
        const existingMembership = await db.query.usersToClinicsTable.findFirst({
          where: and(
            eq(usersToClinicsTable.userId, targetUser.id),
            eq(usersToClinicsTable.clinicId, clinicId),
          ),
        });

        if (!existingMembership) {
          await db.insert(usersToClinicsTable).values({
            userId: targetUser.id,
            clinicId,
            role: "doctor",
            status: isBlocked ? "blocked" : "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          await db
            .update(usersToClinicsTable)
            .set({
              status: isBlocked ? "blocked" : "active",
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(usersToClinicsTable.userId, targetUser.id),
                eq(usersToClinicsTable.clinicId, clinicId),
              ),
            );
        }
      }
    } else if (resolvedUserId) {
      // Se não enviou nova senha mas já possui usuário vinculado, atualiza status do vínculo
      await db
        .update(usersToClinicsTable)
        .set({
          status: isBlocked ? "blocked" : "active",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(usersToClinicsTable.userId, resolvedUserId),
            eq(usersToClinicsTable.clinicId, clinicId),
          ),
        );
    }

    // Salva ou atualiza o médico com schedules flexíveis por dia e status de bloqueio
    await db
      .insert(doctorsTable)
      .values({
        id: parsedInput.id,
        clinicId,
        userId: resolvedUserId,
        name: parsedInput.name,
        specialty: parsedInput.specialty,
        appointmentPriceInCents: parsedInput.appointmentPriceInCents,
        appointmentDurationInMinutes: parsedInput.appointmentDurationInMinutes ?? 30,
        availableFromWeekDay: parsedInput.availableFromWeekDay,
        availableToWeekDay: parsedInput.availableToWeekDay,
        availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
        availableToTime: availableToTimeUTC.format("HH:mm:ss"),
        schedules: parsedInput.schedules || null,
        email: parsedInput.email || null,
        phone: parsedInput.phone || null,
        professionalDocument: parsedInput.professionalDocument || null,
        bio: parsedInput.bio || null,
        isAccessBlocked: isBlocked,
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          name: parsedInput.name,
          specialty: parsedInput.specialty,
          appointmentPriceInCents: parsedInput.appointmentPriceInCents,
          appointmentDurationInMinutes: parsedInput.appointmentDurationInMinutes ?? 30,
          availableFromWeekDay: parsedInput.availableFromWeekDay,
          availableToWeekDay: parsedInput.availableToWeekDay,
          availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
          availableToTime: availableToTimeUTC.format("HH:mm:ss"),
          schedules: parsedInput.schedules || null,
          email: parsedInput.email || null,
          phone: parsedInput.phone || null,
          professionalDocument: parsedInput.professionalDocument || null,
          bio: parsedInput.bio || null,
          isAccessBlocked: isBlocked,
          ...(resolvedUserId ? { userId: resolvedUserId } : {}),
        },
      });

    revalidatePath("/doctors");
    revalidatePath("/users");
    revalidatePath("/appointments");
  });

export const toggleDoctorAccessAction = protectedWithClinicActionClient
  .inputSchema(
    z.object({
      doctorId: z.string().uuid(),
      isBlocked: z.boolean(),
    }),
  )
  .action(async ({ parsedInput: { doctorId, isBlocked }, ctx }) => {
    const clinicId = ctx?.user.clinic?.id;
    if (!clinicId) throw new Error("Clínica não encontrada.");

    const doctor = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.id, doctorId),
        eq(doctorsTable.clinicId, clinicId),
      ),
    });

    if (!doctor) throw new Error("Médico não encontrado.");

    await db
      .update(doctorsTable)
      .set({
        isAccessBlocked: isBlocked,
        updatedAt: new Date(),
      })
      .where(eq(doctorsTable.id, doctorId));

    if (doctor.userId) {
      await db
        .update(usersToClinicsTable)
        .set({
          status: isBlocked ? "blocked" : "active",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(usersToClinicsTable.userId, doctor.userId),
            eq(usersToClinicsTable.clinicId, clinicId),
          ),
        );
    }

    revalidatePath("/doctors");
    revalidatePath("/users");
    revalidatePath("/appointments");

    return {
      success: true,
      message: isBlocked
        ? "Acesso do médico suspenso com sucesso."
        : "Acesso do médico liberado com sucesso.",
    };
  });
