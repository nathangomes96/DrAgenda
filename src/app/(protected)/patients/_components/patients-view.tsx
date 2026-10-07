"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import { doctorsTable, patientsTable } from "@/db/schema";

import { getPatientsTableColumns } from "./table-columns";

interface PatientsViewProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  userRole?: string;
}

export function PatientsView({
  patients,
  doctors,
  userRole = "admin",
}: PatientsViewProps) {
  const columns = useMemo(
    () => getPatientsTableColumns(doctors, userRole),
    [doctors, userRole],
  );

  return <DataTable data={patients} columns={columns} />;
}
