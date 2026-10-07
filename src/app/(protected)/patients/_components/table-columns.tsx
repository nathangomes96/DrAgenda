import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { doctorsTable, patientsTable } from "@/db/schema";

import PatientTableAction from "./table-action";

type Patient = typeof patientsTable.$inferSelect;
type Doctor = typeof doctorsTable.$inferSelect;

export const getPatientsTableColumns = (
  doctors: Doctor[] = [],
  userRole?: string,
): ColumnDef<Patient>[] => [
  {
    id: "name",
    accessorKey: "name",
    header: "Paciente",
    cell: ({ row }) => {
      const patient = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">
            {patient.name}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {patient.cpf ? <span>CPF: {patient.cpf}</span> : <span>{patient.email}</span>}
            {patient.healthInsurance && (
              <span className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-medium">
                {patient.healthInsurance}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "clinicalAlerts",
    header: "Alertas Clínicos",
    cell: ({ row }) => {
      const patient = row.original;
      if (patient.allergies) {
        return (
          <Badge
            variant="destructive"
            className="gap-1 text-[11px] font-semibold py-0.5 px-2 bg-rose-600 hover:bg-rose-700 max-w-[200px] truncate"
            title={`Alergias: ${patient.allergies}`}
          >
            <AlertTriangle className="size-3 shrink-0" />
            <span className="truncate">Alergia: {patient.allergies}</span>
          </Badge>
        );
      }
      return (
        <span className="text-xs text-muted-foreground/70 italic">
          Sem alergias relatadas
        </span>
      );
    },
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: (params) => {
      const phone = params.row.original.phoneNumber;
      if (!phone) return "";
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    },
  },
  {
    id: "sex",
    accessorKey: "sex",
    header: "Sexo",
    cell: (params) => {
      const patient = params.row.original;
      return (
        <span className="text-xs">
          {patient.sex === "male" ? "Masculino" : "Feminino"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Ações & Prontuário",
    cell: (params) => {
      const patient = params.row.original;
      return (
        <PatientTableAction
          patient={patient}
          doctors={doctors}
          userRole={userRole}
        />
      );
    },
  },
];

export const patientsTableColumns: ColumnDef<Patient>[] = getPatientsTableColumns();
