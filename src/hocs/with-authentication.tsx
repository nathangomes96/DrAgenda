import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const validateAuthentication = async ({
  mustHavePlan = false,
  mustHaveClinic = false,
  allowedRoles,
}: {
  mustHavePlan?: boolean;
  mustHaveClinic?: boolean;
  allowedRoles?: Array<"admin" | "doctor" | "receptionist">;
} = {}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
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
    redirect("/appointments");
  }
  return session;
};

const WithAuthentication = async ({
  children,
  mustHavePlan = false,
  mustHaveClinic = false,
  allowedRoles,
}: {
  children: React.ReactNode;
  mustHavePlan?: boolean;
  mustHaveClinic?: boolean;
  allowedRoles?: Array<"admin" | "doctor" | "receptionist">;
}) => {
  await validateAuthentication({ mustHavePlan, mustHaveClinic, allowedRoles });
  return children;
};

export default WithAuthentication;
