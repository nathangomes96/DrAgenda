"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Loader2,
  MoreVertical,
  Shield,
  ShieldAlert,
  Trash2,
  UserCog,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  removeUserFromClinicAction,
  toggleUserStatusAction,
  updateUserRoleAction,
} from "@/actions/users";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClinicUserItem } from "@/data/get-clinic-users";

interface UserTableActionsProps {
  member: ClinicUserItem;
  currentUserId: string;
}

export function UserTableActions({ member, currentUserId }: UserTableActionsProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role);

  const isSelf = member.userId === currentUserId;

  const { execute: executeUpdateRole, isExecuting: isUpdatingRole } = useAction(
    updateUserRoleAction,
    {
      onSuccess: ({ data }) => {
        toast.success(data?.message ?? "Cargo atualizado com sucesso!");
        setRoleDialogOpen(false);
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao atualizar cargo.");
      },
    },
  );

  const { execute: executeToggleStatus, isExecuting: isTogglingStatus } = useAction(
    toggleUserStatusAction,
    {
      onSuccess: ({ data }) => {
        toast.success(data?.message ?? "Status de acesso atualizado!");
        setBlockDialogOpen(false);
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao alterar status de acesso.");
      },
    },
  );

  const { execute: executeRemove, isExecuting: isRemoving } = useAction(
    removeUserFromClinicAction,
    {
      onSuccess: ({ data }) => {
        toast.success(data?.message ?? "Colaborador removido da clínica.");
        setDeleteDialogOpen(false);
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao remover colaborador.");
      },
    },
  );

  const handleUpdateRole = () => {
    executeUpdateRole({
      userId: member.userId,
      role: selectedRole,
    });
  };

  const handleToggleStatus = (targetStatus: "active" | "blocked") => {
    executeToggleStatus({
      userId: member.userId,
      status: targetStatus,
    });
  };

  const handleRemove = () => {
    executeRemove({
      userId: member.userId,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
            <UserCog className="mr-2 h-4 w-4 text-primary" />
            Alterar Nível de Acesso
          </DropdownMenuItem>

          {member.status === "active" ? (
            <DropdownMenuItem
              onClick={() => setBlockDialogOpen(true)}
              disabled={isSelf}
              className="text-amber-700 dark:text-amber-400 focus:text-amber-700"
            >
              <Ban className="mr-2 h-4 w-4" />
              {isSelf ? "Não pode bloquear a si mesmo" : "Bloquear Acesso"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => handleToggleStatus("active")}
              disabled={isTogglingStatus}
              className="text-emerald-600 focus:text-emerald-600 font-medium"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Reativar Acesso
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isSelf}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isSelf ? "Não pode remover a si mesmo" : "Remover da Clínica"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* MODAL DE CONFIRMAÇÃO DE BLOQUEIO */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Bloquear Acesso do Colaborador
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Tem certeza que deseja suspender o acesso de <strong>{member.name}</strong> ({member.email})?
              </span>
              <span className="block text-xs text-muted-foreground pt-1">
                O colaborador será impedido de logar imediatamente. Seus dados, consultas e prontuários históricos continuam seguros e acessíveis para a clínica.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTogglingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus("blocked")}
              disabled={isTogglingStatus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isTogglingStatus ? "Bloqueando..." : "Confirmar Bloqueio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE ALTERAÇÃO DE CARGO */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Alterar Cargo
            </DialogTitle>
            <DialogDescription>
              Modifique as permissões de acesso para <strong>{member.name}</strong> ({member.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Novo Nível de Acesso</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setSelectedRole(val as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="font-semibold text-primary">👑 Administrador</span>
                  </SelectItem>
                  <SelectItem value="doctor">
                    <span className="font-semibold text-blue-600">🩺 Médico</span>
                  </SelectItem>
                  <SelectItem value="receptionist">
                    <span className="font-semibold text-amber-600">📋 Recepção</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isSelf && selectedRole !== "admin" && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-md text-xs border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Você é o usuário atual. Você não pode remover seu próprio acesso de Administrador.
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={isUpdatingRole}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={isUpdatingRole || (isSelf && selectedRole !== "admin")}
            >
              {isUpdatingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alteração"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE REMOÇÃO */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Remover Colaborador
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{member.name}</strong> ({member.email}) da sua clínica? O usuário perderá o acesso imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removendo..." : "Confirmar Remoção"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
