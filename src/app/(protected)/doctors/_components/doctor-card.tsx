"use client";

import {
  Ban,
  BanknoteIcon,
  CalendarIcon,
  ClockIcon,
  KeyRound,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Trash2Icon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteDoctor } from "@/actions/delete-doctor";
import { toggleDoctorAccessAction } from "@/actions/upsert-doctor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { doctorsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

import { getAvailability } from "../_helpers/avaliability";
import UpsertDoctorForm from "./upsert-doctor-form";

interface DoctorCardProps {
  doctor: typeof doctorsTable.$inferSelect;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const [isUpsertDoctorDialogOpen, setIsUpsertDoctorDialogOpen] =
    useState(false);

  const deleteDoctorAction = useAction(deleteDoctor, {
    onSuccess: () => {
      toast.success(`Profissional ${doctor?.name} deletado com sucesso!`);
    },
    onError: () => {
      toast.error("Erro ao deletar profissional.");
    },
  });

  const toggleAccessAction = useAction(toggleDoctorAccessAction, {
    onSuccess: ({ data }) => {
      toast.success(data?.message || "Status de acesso atualizado com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao alterar status de acesso.");
    },
  });

  const handleDeleteDoctorClick = () => {
    if (!doctor) return;
    deleteDoctorAction.execute({ id: doctor.id });
  };

  const handleToggleAccess = (isBlocked: boolean) => {
    toggleAccessAction.execute({
      doctorId: doctor.id,
      isBlocked,
    });
  };

  const doctorInitials = doctor.name
    .split(" ")
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  const availability = getAvailability(doctor);

  return (
    <Card className={`transition-all shadow-xs ${doctor.isAccessBlocked ? "border-destructive/40 bg-destructive/5" : "hover:border-primary/40"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className={`h-11 w-11 border-2 ${doctor.isAccessBlocked ? "border-destructive/30" : "border-primary/20"}`}>
              <AvatarFallback className={`font-bold ${doctor.isAccessBlocked ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10"}`}>
                {doctorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">
                {doctor.name}
              </h3>
              <p className="text-xs text-primary font-medium mt-0.5">
                {doctor.specialty}
              </p>
              {doctor.professionalDocument && (
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {doctor.professionalDocument}
                </p>
              )}
            </div>
          </div>

          {doctor.isAccessBlocked ? (
            <Badge
              variant="outline"
              className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1 shrink-0 font-semibold"
              title="Acesso suspenso pelo administrador"
            >
              <ShieldAlert className="size-3" /> Acesso Bloqueado
            </Badge>
          ) : doctor.userId ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] gap-1 shrink-0 font-medium"
              title="Acesso com login e senha ativado"
            >
              <KeyRound className="size-3" /> Login Ativo
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-muted text-muted-foreground text-[10px] shrink-0"
            >
              Sem Login
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-2 py-3 text-xs overflow-hidden">
        {(() => {
          const rawSchedules = doctor.schedules as any[] | null;
          const activeSchedules = rawSchedules?.filter((s) => s.enabled);

          if (activeSchedules && activeSchedules.length > 0) {
            const dayNames: Record<number, string> = {
              0: "Dom",
              1: "Seg",
              2: "Ter",
              3: "Qua",
              4: "Qui",
              5: "Sex",
              6: "Sáb",
            };

            const formatDayTimeLabel = (s: any) => {
              if (s.morningEnabled && s.afternoonEnabled) {
                return `${s.morningFromTime?.slice(0, 5)}–${s.morningToTime?.slice(0, 5)} e ${s.afternoonFromTime?.slice(0, 5)}–${s.afternoonToTime?.slice(0, 5)}`;
              }
              if (s.morningEnabled) {
                return `${s.morningFromTime?.slice(0, 5)}–${s.morningToTime?.slice(0, 5)} (Manhã)`;
              }
              if (s.afternoonEnabled) {
                return `${s.afternoonFromTime?.slice(0, 5)}–${s.afternoonToTime?.slice(0, 5)} (Tarde)`;
              }
              return `${s.fromTime?.slice(0, 5)} às ${s.toTime?.slice(0, 5)}`;
            };

            // Verifica se todos os dias ativos têm a mesma formatação de horários
            const firstTime = formatDayTimeLabel(activeSchedules[0]);
            const allSameTime = activeSchedules.every(
              (s) => formatDayTimeLabel(s) === firstTime,
            );

            // Verifica se são exatamente dias úteis (Seg a Sex: 1, 2, 3, 4, 5)
            const activeDays = activeSchedules.map((s) => s.day).sort();
            const isSegASex =
              activeDays.length === 5 &&
              activeDays.every((d, i) => d === i + 1);

            const isTodosOsDias = activeDays.length === 7;

            // Se todos os dias têm o mesmo horário e formam um bloco clássico
            if (allSameTime && (isSegASex || isTodosOsDias)) {
              return (
                <>
                  <Badge
                    variant="outline"
                    className="justify-start py-1 font-normal w-fit max-w-full"
                  >
                    <CalendarIcon className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                    <span>
                      {isSegASex ? "Segunda a Sexta" : "Todos os dias"}
                    </span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="justify-start py-1 font-normal w-fit max-w-full text-foreground/90"
                  >
                    <ClockIcon className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                    <span>{firstTime}</span>
                  </Badge>
                </>
              );
            }

            // Se forem dias com horários específicos ou intercalados
            return (
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <CalendarIcon className="size-3" /> Dias de Atendimento:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSchedules.map((s) => (
                    <Badge
                      key={s.day}
                      variant="outline"
                      className="text-[11px] font-normal py-0.5 px-2 bg-muted/30"
                    >
                      <strong className="mr-1">
                        {dayNames[s.day] || s.day}:
                      </strong>
                      <span>{formatDayTimeLabel(s)}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <>
              <Badge
                variant="outline"
                className="justify-start py-1 font-normal w-fit max-w-full"
              >
                <CalendarIcon className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <span>
                  {availability.from.format("dddd")} a{" "}
                  {availability.to.format("dddd")}
                </span>
              </Badge>
              <Badge
                variant="outline"
                className="justify-start py-1 font-normal w-fit max-w-full"
              >
                <ClockIcon className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <span>
                  {availability.from.format("HH:mm")} às{" "}
                  {availability.to.format("HH:mm")}
                </span>
              </Badge>
            </>
          );
        })()}

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Badge
            variant="outline"
            className="justify-start py-1 font-normal text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 w-fit max-w-full"
          >
            <BanknoteIcon className="size-3.5 mr-1.5 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              {formatCurrencyInCents(doctor.appointmentPriceInCents)}
            </span>
          </Badge>

          <Badge
            variant="outline"
            className="justify-start py-1 font-normal text-primary bg-primary/10 border-primary/20 w-fit max-w-full"
            title="Duração estimada de cada atendimento"
          >
            <ClockIcon className="size-3.5 mr-1.5 text-primary shrink-0" />
            <span className="font-medium">
              {doctor.appointmentDurationInMinutes || 30} min / consulta
            </span>
          </Badge>
        </div>

        {doctor.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
            <Phone className="size-3 text-muted-foreground" />
            <span>{doctor.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</span>
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col gap-2 pt-3">
        {doctor.isAccessBlocked ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5"
            disabled={toggleAccessAction.isExecuting}
            onClick={() => handleToggleAccess(false)}
          >
            <ShieldCheck className="size-3.5" /> Desbloquear / Reativar Acesso
          </Button>
        ) : doctor.userId ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-destructive border-destructive/20 hover:bg-destructive/10 gap-1.5"
            disabled={toggleAccessAction.isExecuting}
            onClick={() => handleToggleAccess(true)}
          >
            <Ban className="size-3.5" /> Bloquear Acesso do Médico
          </Button>
        ) : null}

        <Dialog
          open={isUpsertDoctorDialogOpen}
          onOpenChange={setIsUpsertDoctorDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full font-semibold" size="sm">
              Editar Dados & Acesso
            </Button>
          </DialogTrigger>
          <UpsertDoctorForm
            doctor={{
              ...doctor,
              availableFromTime: availability.from.format("HH:mm:ss"),
              availableToTime: availability.to.format("HH:mm:ss"),
            }}
            onSuccess={() => setIsUpsertDoctorDialogOpen(false)}
          />
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-destructive">
              <Trash2Icon className="size-3.5 mr-1" /> Deletar Profissional
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Tem certeza que deseja deletar este profissional?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser revertida. Isso irá deletar o cadastro do profissional e suas consultas associadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDoctorClick}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default DoctorCard;
