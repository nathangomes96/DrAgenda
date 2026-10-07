import dayjs from "dayjs";
import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  clinicsTable,
  doctorsTable,
  patientsTable,
} from "@/db/schema";

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      clinic: {
        id: string;
      };
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
  const chartStartDate = dayjs().subtract(10, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();

  const [
    [totalRevenue],
    [totalAppointments],
    [totalPatients],
    [totalDoctors],
    topDoctors,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
    clinicInfo,
    monthConfirmed,
    pending30d,
    statusBreakdown,
  ] = await Promise.all([
    db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(eq(patientsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        total: count(),
      })
      .from(doctorsTable)
      .where(eq(doctorsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        id: doctorsTable.id,
        name: doctorsTable.name,
        avatarImageUrl: doctorsTable.avatarImageUrl,
        specialty: doctorsTable.specialty,
        appointments: count(appointmentsTable.id),
      })
      .from(doctorsTable)
      .leftJoin(
        appointmentsTable,
        and(
          eq(appointmentsTable.doctorId, doctorsTable.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      )
      .where(eq(doctorsTable.clinicId, session.user.clinic.id))
      .groupBy(doctorsTable.id)
      .orderBy(desc(count(appointmentsTable.id)))
      .limit(10),
    db
      .select({
        specialty: doctorsTable.specialty,
        appointments: count(appointmentsTable.id),
      })
      .from(appointmentsTable)
      .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      )
      .groupBy(doctorsTable.specialty)
      .orderBy(desc(count(appointmentsTable.id))),
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        gte(appointmentsTable.date, dayjs().startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs().endOf("day").toDate()),
      ),
      with: {
        patient: true,
        doctor: true,
      },
    }),
    db
      .select({
        date: sql<string>`DATE(${appointmentsTable.date})`.as("date"),
        appointments: count(appointmentsTable.id),
        revenue:
          sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
            "revenue",
          ),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, chartStartDate),
          lte(appointmentsTable.date, chartEndDate),
        ),
      )
      .groupBy(sql`DATE(${appointmentsTable.date})`)
      .orderBy(sql`DATE(${appointmentsTable.date})`),
    db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, session.user.clinic.id),
    }),
    db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
        count: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, dayjs().startOf("month").toDate()),
          lte(appointmentsTable.date, dayjs().endOf("month").toDate()),
          eq(appointmentsTable.status, "confirmed"),
        ),
      ),
    db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
        count: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, dayjs().startOf("day").toDate()),
          lte(appointmentsTable.date, dayjs().add(30, "days").endOf("day").toDate()),
          eq(appointmentsTable.status, "pending"),
        ),
      ),
    db
      .select({
        status: appointmentsTable.status,
        total: sum(appointmentsTable.appointmentPriceInCents),
        count: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      )
      .groupBy(appointmentsTable.status),
  ]);

  const [monthConfirmedRow] = monthConfirmed;
  const [pending30dRow] = pending30d;

  const todayConfirmedCount = todayAppointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const todayPendingCount = todayAppointments.filter(
    (a) => a.status === "pending",
  ).length;
  const todayExpectedRevenue = todayAppointments.reduce(
    (acc, a) => acc + (a.appointmentPriceInCents || 0),
    0,
  );
  const todayConfirmedRevenue = todayAppointments
    .filter((a) => a.status === "confirmed")
    .reduce((acc, a) => acc + (a.appointmentPriceInCents || 0), 0);

  const confirmedBreakdown = statusBreakdown.find((s) => s.status === "confirmed");
  const cancelledBreakdown = statusBreakdown.find((s) => s.status === "cancelled");
  const pendingBreakdown = statusBreakdown.find((s) => s.status === "pending");

  const expectedRevenueInCents = Number(totalRevenue.total || 0);
  const confirmedRevenueInCents = Number(confirmedBreakdown?.total || 0);
  const cancelledRevenueInCents = Number(cancelledBreakdown?.total || 0);
  const totalAppointmentsCount = Number(totalAppointments.total || 0);
  const averageTicketInCents =
    totalAppointmentsCount > 0
      ? Math.round(expectedRevenueInCents / totalAppointmentsCount)
      : 0;

  return {
    clinicInfo,
    todayStats: {
      total: todayAppointments.length,
      confirmed: todayConfirmedCount,
      pending: todayPendingCount,
      expectedRevenueInCents: todayExpectedRevenue,
      confirmedRevenueInCents: todayConfirmedRevenue,
      confirmationRate:
        todayAppointments.length > 0
          ? Math.round((todayConfirmedCount / todayAppointments.length) * 100)
          : 100,
    },
    monthStats: {
      confirmedRevenueInCents: Number(monthConfirmedRow?.total || 0),
      appointmentsCount: Number(monthConfirmedRow?.count || 0),
    },
    pending30dStats: {
      revenueInCents: Number(pending30dRow?.total || 0),
      count: Number(pending30dRow?.count || 0),
    },
    cashflowSummary: {
      expectedRevenueInCents,
      confirmedRevenueInCents,
      cancelledRevenueInCents,
      averageTicketInCents,
    },
    pressurePoints: {
      pendingAppointmentsCount: Number(pending30dRow?.count || 0),
      pendingAppointmentsToday: todayPendingCount,
      whatsappStatus: clinicInfo?.whatsappStatus || "disconnected",
      whatsappPhone: clinicInfo?.whatsappConnectedPhone || null,
    },
    totalRevenue,
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
  };
};
