import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const validateAuthentication = async ({
  mustHavePlan = false,
  mustHaveClinic = false,
  mustBeSuperAdmin = false,
  checkPlanExpiration = false,
  allowedRoles,
}: {
  mustHavePlan?: boolean;
  mustHaveClinic?: boolean;
  mustBeSuperAdmin?: boolean;
  checkPlanExpiration?: boolean;
  allowedRoles?: Array<"admin" | "doctor" | "receptionist">;
} = {}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (mustBeSuperAdmin && !(session.user as any)?.isSuperAdmin) {
    redirect("/dashboard");
  }
  if (mustHavePlan && !session.user.plan) {
    // redirect("/new-subscription");
  }
  if (mustHaveClinic && !session.user.clinic) {
    redirect("/clinic-form");
  }
  if ((session.user.clinic as any)?.status === "blocked") {
    redirect("/access-blocked");
  }
  if (
    allowedRoles &&
    session.user.clinic?.role &&
    !allowedRoles.includes(session.user.clinic.role)
  ) {
    redirect("/agendamentos");
  }
  if (checkPlanExpiration && !(session.user as any)?.isSuperAdmin) {
    const clinic = session.user.clinic as any;
    if (clinic) {
      const isExpired =
        clinic.planStatus === "expired" ||
        (clinic.planStatus !== "lifetime" &&
          clinic.planExpiresAt &&
          new Date() > new Date(clinic.planExpiresAt));
      if (isExpired) {
        redirect("/assinatura?expirado=true");
      }
    }
  }
  return session;
};

const WithAuthentication = async ({
  children,
  mustHavePlan = false,
  mustHaveClinic = false,
  mustBeSuperAdmin = false,
  checkPlanExpiration = false,
  allowedRoles,
}: {
  children: React.ReactNode;
  mustHavePlan?: boolean;
  mustHaveClinic?: boolean;
  mustBeSuperAdmin?: boolean;
  checkPlanExpiration?: boolean;
  allowedRoles?: Array<"admin" | "doctor" | "receptionist">;
}) => {
  await validateAuthentication({
    mustHavePlan,
    mustHaveClinic,
    mustBeSuperAdmin,
    checkPlanExpiration,
    allowedRoles,
  });
  return children;
};

export default WithAuthentication;
