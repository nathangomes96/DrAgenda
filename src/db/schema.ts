import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Tabela "users" representa os usuários do sistema
// Relação: 1:N com users_to_clinics
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Relação entre usuários e clínicas
// Relação: N:N com users_to_clinics
export const usersTablesRelation = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

// Tabela "clinics" representa as clínicas
// Relação: N:N com users_to_clinics
export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  whatsappInstanceName: text("whatsapp_instance_name"),
  whatsappApiUrl: text("whatsapp_api_url"),
  whatsappApiKey: text("whatsapp_api_key"),
  whatsappConnectedPhone: text("whatsapp_connected_phone"),
  whatsappStatus: text("whatsapp_status", {
    enum: ["connected", "disconnected", "connecting"],
  }).default("disconnected"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Tabela intermediária entre usuários e clínicas
// Relação: N:N com users e clinics
export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "receptionist", "doctor"] })
    .default("admin")
    .notNull(),
  status: text("status", { enum: ["active", "blocked"] })
    .default("active")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relação entre usuários e clínicas na tabela intermediária
// Relação: 1:1 com users e clinics
export const usersToClinicsTablesRelation = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// Relação entre clínicas e outras entidades
// Relação: 1:N com doctors, patients, appointments e medicalRecords
export const clinicsTablesRelation = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable),
  patients: many(patientsTable),
  appointments: many(appointmentsTable),
  usersToClinics: many(usersToClinicsTable),
  medicalRecords: many(medicalRecordsTable),
}));

// Tabela "doctors" representa os médicos
// Relação: 1:N com clinics
export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  professionalDocument: text("professional_document"),
  bio: text("bio"),
  avatarImageUrl: text("avatar_image_url"),
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  schedules: jsonb("schedules"),
  specialty: text("specialty").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  appointmentDurationInMinutes: integer("appointment_duration_in_minutes").default(30).notNull(),
  isAccessBlocked: boolean("is_access_blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relação entre médicos e clínicas
// Relação: 1:N com appointments e 1:1 com clinics
export const doctorsTablesRelation = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    user: one(usersTable, {
      fields: [doctorsTable.userId],
      references: [usersTable.id],
    }),
    appointments: many(appointmentsTable),
    medicalRecords: many(medicalRecordsTable),
  }),
);

// Enumeração para sexo do paciente
export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

// Tabela "patients" representa os pacientes
// Relação: 1:N com clinics
export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  sex: patientSexEnum("sex").notNull(),
  cpf: text("cpf"),
  birthDate: text("birth_date"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  currentMedications: text("current_medications"),
  bloodType: text("blood_type"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  healthInsurance: text("health_insurance"),
  healthInsuranceNumber: text("health_insurance_number"),
  addressZipCode: text("address_zip_code"),
  addressStreet: text("address_street"),
  addressNumber: text("address_number"),
  addressComplement: text("address_complement"),
  addressNeighborhood: text("address_neighborhood"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relação entre pacientes e clínicas
// Relação: 1:N com appointments e 1:1 com clinics
export const patientsTablesRelation = relations(
  patientsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
    medicalRecords: many(medicalRecordsTable),
  }),
);

// Tabela "appointments" representa as consultas
// Relação: 1:N com patients, doctors e clinics
export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").unique(),
  date: timestamp("date").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "cancelled"] })
    .default("pending")
    .notNull(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relação entre consultas e outras entidades
// Relação: 1:1 com patients, doctors e clinics
export const appointmentsTablesRelation = relations(
  appointmentsTable,
  ({ one }) => ({
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// Tabela "medical_records" representa o Prontuário Eletrônico do Paciente (EHR)
// Dados sensíveis protegidos sob sigilo médico e LGPD (Art. 5º, II e Art. 7º)
export const medicalRecordsTable = pgTable("medical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(
    () => appointmentsTable.id,
    { onDelete: "set null" },
  ),
  recordType: text("record_type", {
    enum: ["medical", "dental", "general"],
  })
    .default("medical")
    .notNull(),
  // Sinais Vitais (Médico / Geral)
  bloodPressure: text("blood_pressure"),
  heartRate: text("heart_rate"),
  temperature: text("temperature"),
  weight: text("weight"),
  height: text("height"),
  // Procedimentos Odontológicos (Dentista)
  teeth: text("teeth"),
  procedureName: text("procedure_name"),
  materialsUsed: text("materials_used"),
  postOpInstructions: text("post_op_instructions"),
  // Evolução / Diagnóstico
  diagnosis: text("diagnosis"), // Diagnóstico ou CID-10
  symptoms: text("symptoms"), // Queixa Principal / Anamnese
  treatmentPlan: text("treatment_plan"), // Conduta / Plano de Tratamento
  prescription: text("prescription"), // Prescrição / Medicamentos
  notes: text("notes").notNull(), // Anotações Clínicas Confidenciais
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relação entre Prontuários e Entidades
export const medicalRecordsTablesRelation = relations(
  medicalRecordsTable,
  ({ one }) => ({
    patient: one(patientsTable, {
      fields: [medicalRecordsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [medicalRecordsTable.doctorId],
      references: [doctorsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [medicalRecordsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointment: one(appointmentsTable, {
      fields: [medicalRecordsTable.appointmentId],
      references: [appointmentsTable.id],
    }),
  }),
);
