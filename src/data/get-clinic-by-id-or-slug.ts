import { eq, or } from "drizzle-orm";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getClinicByIdOrSlug(idOrSlug: string) {
  if (!idOrSlug) return null;

  const isUuid = UUID_REGEX.test(idOrSlug);

  if (isUuid) {
    return await db.query.clinicsTable.findFirst({
      where: or(eq(clinicsTable.id, idOrSlug), eq(clinicsTable.slug, idOrSlug)),
    });
  }

  return await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.slug, idOrSlug),
  });
}
