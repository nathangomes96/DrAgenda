import { headers } from "next/headers";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "./auth";

export const actionClient = createSafeActionClient();

export const protectedActionClient = createSafeActionClient().use(
  async ({ next }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    return next({ ctx: { user: session.user } });
  },
);

export const protectedWithClinicActionClient = protectedActionClient.use(
  async ({ next, ctx }) => {
    if (!ctx.user.clinic?.id) {
      throw new Error("Clinic not found");
    }
    if ((ctx.user.clinic as any).status === "blocked") {
      throw new Error("Seu acesso a esta clínica foi temporariamente suspenso pelo administrador.");
    }
    return next({
      ctx: {
        user: {
          ...ctx.user,
          clinic: ctx.user.clinic!,
        },
      },
    });
  },
);

export const protectedWithRoleActionClient = (
  allowedRoles: Array<"admin" | "receptionist" | "doctor">,
) =>
  protectedWithClinicActionClient.use(async ({ next, ctx }) => {
    const userRole = (ctx.user.clinic.role ?? "admin") as
      | "admin"
      | "receptionist"
      | "doctor";
    if (!allowedRoles.includes(userRole)) {
      throw new Error("Você não possui permissão para executar esta ação.");
    }
    return next({ ctx });
  });

