import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Conectado ao Supabase. Aplicando migração DDL...");

    // 1. Clinics slug
    await client.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS slug text;`);

    // Preencher slugs de clínicas existentes se estiverem nulos
    const clinics = await client.query(`SELECT id, name FROM clinics WHERE slug IS NULL`);
    for (const c of clinics.rows) {
      const generatedSlug = c.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || `clinica-${c.id.slice(0, 6)}`;
      console.log(`Definindo slug para clínica "${c.name}": ${generatedSlug}`);
      await client.query(`UPDATE clinics SET slug = $1 WHERE id = $2`, [generatedSlug, c.id]);
    }

    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS clinics_slug_unique ON clinics (slug);`);

    // 2. Users to clinics role
    await client.query(`ALTER TABLE users_to_clinics ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';`);

    // 3. Medical records table (Prontuário Eletrônico / EHR)
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
        diagnosis text,
        symptoms text,
        treatment_plan text,
        prescription text,
        notes text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now()
      );
    `);

    // 4. Índices para performance e isolamento multitenant
    await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records (clinic_id, patient_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records (clinic_id, doctor_id);`);

    // 5. Campos da Evolution API (WhatsApp)
    await client.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_instance_name text;`);
    await client.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_api_url text;`);
    await client.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_api_key text;`);
    await client.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_connected_phone text;`);
    await client.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_status text DEFAULT 'disconnected';`);

    console.log("✅ Migração de banco aplicada com sucesso no Supabase!");
  } catch (err) {
    console.error("Erro na migração:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
