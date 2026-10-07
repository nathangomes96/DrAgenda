import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";

export interface ClinicUserItem {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "doctor" | "receptionist";
  status: "active" | "blocked";
  createdAt: Date;
}

export async function getClinicUsers(clinicId: string): Promise<ClinicUserItem[]> {
  const memberships = await db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.clinicId, clinicId),
    with: {
      user: true,
    },
    orderBy: [desc(usersToClinicsTable.createdAt)],
  });

  return memberships.map((m) => ({
    userId: m.userId,
    name: m.user?.name ?? "Sem nome",
    email: m.user?.email ?? "",
    image: m.user?.image ?? null,
    role: (m.role ?? "admin") as "admin" | "doctor" | "receptionist",
    status: (m.status ?? "active") as "active" | "blocked",
    createdAt: m.createdAt,
  }));
}
