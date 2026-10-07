"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { protectedWithRoleActionClient } from "@/lib/next-safe-action";

import { updateClinicSlugSchema } from "./schema";

export const updateClinicSlug = protectedWithRoleActionClient(["admin"])
  .schema(updateClinicSlugSchema)
  .action(async ({ parsedInput: { slug }, ctx: { user } }) => {
    const clinicId = user.clinic.id;
    const cleanSlug = slug.toLowerCase().trim();

    // Verifica se já existe outra clínica com o mesmo slug
    const existing = await db.query.clinicsTable.findFirst({
      where: and(
        eq(clinicsTable.slug, cleanSlug),
        ne(clinicsTable.id, clinicId),
      ),
    });

    if (existing) {
      throw new Error("Este link já está em uso por outra clínica. Por favor, escolha outro.");
    }

    await db
      .update(clinicsTable)
      .set({ slug: cleanSlug, updatedAt: new Date() })
      .where(eq(clinicsTable.id, clinicId));

    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/agendar/${cleanSlug}`);

    return {
      success: true,
      slug: cleanSlug,
    };
  });
