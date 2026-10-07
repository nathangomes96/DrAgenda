"use client";
import {
  Building2,
  CalendarDays,
  EllipsisVertical,
  Gem,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Stethoscope,
  UserCheck,
  Users2,
} from "lucide-react";
import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/providers/theme-provider";

import { ClinicLinkDialog } from "./clinic-link-dialog";

// Definição de itens por papel
const allNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: CalendarDays,
    roles: ["admin", "receptionist", "doctor"],
  },
  {
    title: "Médicos",
    url: "/doctors",
    icon: Stethoscope,
    roles: ["admin"],
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users2,
    roles: ["admin", "receptionist", "doctor"],
  },
  {
    title: "Usuários",
    url: "/users",
    icon: UserCheck,
    roles: ["admin"],
  },
];


const roleLabels: Record<string, { label: string; className: string }> = {
  admin: {
    label: "Administrador",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  doctor: {
    label: "Médico",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  receptionist: {
    label: "Recepção",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
};

const AppSidebar = () => {
  const router = useRouter();
  const session = authClient.useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const userRole = (session.data?.user?.clinic?.role ?? "admin") as
    | "admin"
    | "receptionist"
    | "doctor";
  const clinicInfo = session.data?.user?.clinic;

  const allowedNavItems = allNavItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4 space-y-3">
        <Image
          src="/logo.svg"
          alt="Doutor Agenda"
          width={136}
          height={28}
          className="dark:invert"
        />

        {clinicInfo?.id && (
          <ClinicLinkDialog
            clinicName={clinicInfo.name}
            clinicId={clinicInfo.id}
            initialSlug={clinicInfo.slug}
            userRole={userRole}
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(userRole === "admin" || userRole === "receptionist") && (
          <SidebarGroup>
            <SidebarGroupLabel>Configurações</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/settings/clinic"}
                  >
                    <Link href="/settings/clinic">
                      <Building2 className="text-primary" />
                      <span>Dados da Clínica</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/settings/whatsapp"}
                  >
                    <Link href="/settings/whatsapp">
                      <MessageCircle className="text-emerald-500" />
                      <span>WhatsApp (QR Code)</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {userRole === "admin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/subscription"}
                    >
                      <Link href="/subscription">
                        <Gem />
                        <span>Assinatura & Plano</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-auto py-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="font-semibold text-xs">
                      {session.data?.user?.name
                        ? session.data.user.name.slice(0, 2).toUpperCase()
                        : "DA"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-xs font-semibold truncate text-foreground">
                      {session.data?.user?.clinic?.name || "Clínica"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {session.data?.user?.email}
                    </span>
                    <Badge
                      variant="outline"
                      className={`mt-1 w-fit text-[10px] px-1.5 py-0 h-4 border font-medium ${
                        roleLabels[userRole]?.className || ""
                      }`}
                    >
                      {roleLabels[userRole]?.label || userRole}
                    </Badge>
                  </div>
                  <EllipsisVertical className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <Sun className="mr-2 size-4" />
                  ) : (
                    <Moon className="mr-2 size-4" />
                  )}
                  {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                >
                  <LogOut className="mr-2 size-4" />
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
