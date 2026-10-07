import { z } from "zod";

export const confirmPatientPresenceSchema = z.object({
  appointmentId: z.string().min(1, "ID ou código de consulta inválido"),
  action: z.enum(["confirm", "cancel_request"]),
});

export type ConfirmPatientPresenceSchema = z.infer<
  typeof confirmPatientPresenceSchema
>;
