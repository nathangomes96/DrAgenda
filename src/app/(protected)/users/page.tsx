import { Metadata } from "next";

import { getClinicUsers } from "@/data/get-clinic-users";
import { validateAuthentication } from "@/hocs/with-authentication";

import { UsersView } from "./_components/users-view";

export const metadata: Metadata = {
  title: "Usuários & Equipe | Doutor Agenda",
  description: "Gerenciamento de membros da clínica e níveis de acesso (RBAC)",
};

export default async function UsersPage() {
  const session = await validateAuthentication({
    mustHaveClinic: true,
    mustHavePlan: false,
    allowedRoles: ["admin"],
  });

  const clinicId = session!.user.clinic!.id;
  const users = await getClinicUsers(clinicId);

  return <UsersView users={users} currentUserId={session!.user.id} />;
}
