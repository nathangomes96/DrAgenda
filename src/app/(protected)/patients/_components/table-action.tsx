import { EllipsisVertical, FileText, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deletePatient } from "@/actions/delete-patient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doctorsTable, patientsTable } from "@/db/schema";
import { authClient } from "@/lib/auth-client";

import { MedicalRecordDialog } from "./medical-record-dialog";
import UpsertPatientForm from "./upsert-patient-form";

interface PatientTableActionProps {
  patient: typeof patientsTable.$inferSelect;
  doctors?: (typeof doctorsTable.$inferSelect)[];
  userRole?: string;
}

const PatientTableAction = ({
  patient,
  doctors = [],
  userRole,
}: PatientTableActionProps) => {
  const session = authClient.useSession();
  const activeRole =
    userRole ||
    (session.data?.user?.clinic?.role as string) ||
    "admin";

  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  const [medicalRecordIsOpen, setMedicalRecordIsOpen] = useState(false);

  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success(`Paciente ${patient?.name} deletado com sucesso!`);
      setDeleteDialogIsOpen(false);
    },
    onError: () => {
      toast.error("Erro ao deletar paciente.");
    },
  });

  const handleDeletePatientClick = () => {
    if (!patient) return;
    deletePatientAction.execute({ id: patient.id });
  };

  const isMedicalStaff = activeRole === "admin" || activeRole === "doctor";

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {/* Botão de Acesso Rápido ao Prontuário para Médicos e Admins */}
      {isMedicalStaff && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
          onClick={() => setMedicalRecordIsOpen(true)}
        >
          <ShieldCheck className="size-3.5" />
          <span>Prontuário</span>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{patient.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isMedicalStaff && (
            <DropdownMenuItem
              onClick={() => setMedicalRecordIsOpen(true)}
              className="text-primary font-medium"
            >
              <FileText className="h-4 w-4" /> Prontuário Médico (EHR)
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setUpsertDialogIsOpen(true)}>
            <Pencil className="h-4 w-4" /> Editar Dados
          </DropdownMenuItem>
          {activeRole === "admin" && (
            <DropdownMenuItem onClick={() => setDeleteDialogIsOpen(true)}>
              <Trash2 className="text-destructive h-4 w-4" /> Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={upsertDialogIsOpen} onOpenChange={setUpsertDialogIsOpen}>
        <UpsertPatientForm
          isOpen={upsertDialogIsOpen}
          patient={patient}
          onSuccess={() => setUpsertDialogIsOpen(false)}
        />
      </Dialog>

      <AlertDialog
        open={deleteDialogIsOpen}
        onOpenChange={setDeleteDialogIsOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente <b>{patient.name}</b>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatientClick}
              disabled={deletePatientAction.status === "executing"}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Prontuário Eletrônico Independente */}
      <MedicalRecordDialog
        isOpen={medicalRecordIsOpen}
        onOpenChange={setMedicalRecordIsOpen}
        patient={patient}
        doctors={doctors}
        userRole={activeRole}
      />
    </div>
  );
};

export default PatientTableAction;
