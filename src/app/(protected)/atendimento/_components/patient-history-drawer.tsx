"use client";

import { Clock, History, X } from "lucide-react";

import { PatientTimeline } from "@/app/(protected)/patients/_components/patient-timeline";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { appointmentsTable, doctorsTable, medicalRecordsTable, patientsTable } from "@/db/schema";

type MedicalRecordItem = typeof medicalRecordsTable.$inferSelect & {
  doctor?: typeof doctorsTable.$inferSelect | null;
  appointment?: typeof appointmentsTable.$inferSelect | null;
};

interface PatientHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: typeof patientsTable.$inferSelect;
  records: MedicalRecordItem[];
  appointments?: (typeof appointmentsTable.$inferSelect & {
    doctor?: typeof doctorsTable.$inferSelect | null;
  })[];
  userRole?: string;
}

export function PatientHistoryDrawer({
  open,
  onOpenChange,
  patient,
  records,
  appointments = [],
  userRole = "doctor",
}: PatientHistoryDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl p-0 flex flex-col bg-background h-full shadow-2xl border-l"
      >
        <SheetHeader className="p-5 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <History className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                Prontuário e Histórico de Atendimentos
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {patient.name} • {records.length} evolução(ões) clínica(s) registrada(s)
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PatientTimeline
            patient={patient}
            records={records}
            appointments={appointments}
            userRole={userRole}
            onOpenNewTab={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
