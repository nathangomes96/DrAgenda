"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Search, ShieldAlert, ShieldCheck, Stethoscope, UserCheck, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClinicUserItem } from "@/data/get-clinic-users";

import { UserDialog } from "./user-dialog";
import { UserTableActions } from "./user-table-actions";

interface UsersViewProps {
  users: ClinicUserItem[];
  currentUserId: string;
}

const roleBadges: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,
    className: "bg-primary/15 text-primary border-primary/30",
  },
  doctor: {
    label: "Médico",
    icon: Stethoscope,
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  receptionist: {
    label: "Recepção",
    icon: UserCheck,
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
};

export function UsersView({ users, currentUserId }: UsersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <span className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Usuários & Equipe
            </span>
          </PageTitle>
          <PageDescription>
            Gerencie os membros da sua clínica e defina os níveis de acesso (Administrador, Médico e Recepção).
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <UserDialog />
        </PageActions>
      </PageHeader>

      <PageContent>

        {/* Barra de Filtro / Busca */}
        <div className="flex items-center gap-3 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabela de Usuários */}
        <Card className="overflow-hidden border shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[300px]">Colaborador</TableHead>
                  <TableHead>Nível de Acesso (Cargo)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Entrada</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nenhum colaborador encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((member) => {
                    const badge = roleBadges[member.role] || roleBadges.admin;
                    const BadgeIcon = badge.icon;
                    const isSelf = member.userId === currentUserId;

                    return (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              {member.image && (
                                <AvatarImage
                                   src={member.image}
                                   alt={member.name}
                                />
                              )}
                              <AvatarFallback className="font-semibold text-xs bg-primary/10 text-primary">
                                {member.name
                                  ? member.name.slice(0, 2).toUpperCase()
                                  : "US"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground flex items-center gap-1.5">
                                {member.name}
                                {isSelf && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 h-4 bg-muted text-muted-foreground font-normal"
                                  >
                                    Você
                                  </Badge>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1.5 font-medium py-1 px-2.5 text-xs ${badge.className}`}
                          >
                            <BadgeIcon className="h-3.5 w-3.5" />
                            {badge.label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {member.status === "blocked" ? (
                            <Badge
                              variant="outline"
                              className="bg-destructive/15 text-destructive border-destructive/30 text-xs gap-1 font-semibold"
                            >
                              <ShieldAlert className="h-3 w-3" /> Bloqueado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1 font-medium"
                            >
                              <CheckCircle className="h-3 w-3" /> Ativo
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(member.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>

                        <TableCell className="text-right">
                          <UserTableActions
                            member={member}
                            currentUserId={currentUserId}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}
