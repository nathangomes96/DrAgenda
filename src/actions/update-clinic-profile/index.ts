"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { protectedWithRoleActionClient } from "@/lib/next-safe-action";

import { updateClinicProfileSchema } from "./schema";

export const updateClinicProfile = protectedWithRoleActionClient(["admin"])
  .schema(updateClinicProfileSchema)
  .action(async ({ parsedInput: { name, slug }, ctx: { user } }) => {
    const clinicId = user.clinic.id;
    const cleanName = name.trim();

    const updateData: {
      name: string;
      slug?: string;
      updatedAt: Date;
    } = {
      name: cleanName,
      updatedAt: new Date(),
    };

    if (slug && slug.trim()) {
      const cleanSlug = slug.toLowerCase().trim();

      // Verifica se já existe outra clínica com este slug
      const existingWithSlug = await db.query.clinicsTable.findFirst({
        where: and(
          eq(clinicsTable.slug, cleanSlug),
          ne(clinicsTable.id, clinicId),
        ),
      });

      if (existingWithSlug) {
        throw new Error(
          "Este link personalizado (slug) já está sendo utilizado por outra clínica. Escolha outro.",
        );
      }

      updateData.slug = cleanSlug;
    }

    const [updatedClinic] = await db
      .update(clinicsTable)
      .set(updateData)
      .where(eq(clinicsTable.id, clinicId))
      .returning();

    revalidatePath("/settings/clinic");
    revalidatePath("/settings/whatsapp");
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath("/patients");

    if (updatedClinic.slug) {
      revalidatePath(`/agendar/${updatedClinic.slug}`);
    }

    return {
      success: true,
      clinic: updatedClinic,
    };
  });
