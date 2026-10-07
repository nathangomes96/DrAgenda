import { NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
    const hasPostgresUrl = Boolean(process.env.POSTGRES_URL);
    const hasBetterAuthSecret = Boolean(process.env.BETTER_AUTH_SECRET);
    const hasBetterAuthUrl = Boolean(process.env.BETTER_AUTH_URL);

    const clinic = await db.query.clinicsTable.findFirst();

    return NextResponse.json({
      status: "ok",
      hasDatabaseUrl,
      hasPostgresUrl,
      hasBetterAuthSecret,
      hasBetterAuthUrl,
      dbConnected: true,
      clinicName: clinic?.name ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error?.message ?? String(error),
        code: error?.code ?? null,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
      },
      { status: 500 }
    );
  }
}
