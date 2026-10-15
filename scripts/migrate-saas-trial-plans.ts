import "dotenv/config";
import { Pool } from "pg";

function getConnectionString() {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return raw;
  }
}

async function runMigration() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error("ERRO: DATABASE_URL ou POSTGRES_URL não informada no .env");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log("Conectado ao banco de dados com sucesso!");

  try {
    await client.query("BEGIN");

    console.log("1. Criando tabela saas_plans se não existir...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        price text NOT NULL,
        interval text NOT NULL DEFAULT 'month',
        max_doctors integer NOT NULL DEFAULT 3,
        max_patients integer NOT NULL DEFAULT 0,
        is_popular boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,
        features jsonb DEFAULT '[]'::jsonb,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("2. Criando tabela platform_settings se não existir...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id text PRIMARY KEY DEFAULT 'default',
        trial_days integer NOT NULL DEFAULT 7,
        pix_enabled boolean NOT NULL DEFAULT true,
        pix_key text,
        pix_key_type text,
        pix_receiver_name text,
        pix_whatsapp_number text,
        mercadopago_enabled boolean NOT NULL DEFAULT false,
        mercadopago_url text,
        stripe_enabled boolean NOT NULL DEFAULT false,
        stripe_url text,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("3. Adicionando colunas de plano em clinics...");
    await client.query(`
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'trial';
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_expires_at timestamp;
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES saas_plans(id) ON DELETE SET NULL;
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS custom_max_doctors integer;
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_notes text;
    `);

    console.log("4. Adicionando coluna is_super_admin em users...");
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;
    `);

    console.log("5. Inserindo dados padrão em platform_settings...");
    await client.query(`
      INSERT INTO platform_settings (id, trial_days, pix_enabled)
      VALUES ('default', 7, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("6. Inserindo planos padrão do SaaS...");
    const plansCheck = await client.query(`SELECT COUNT(*) FROM saas_plans;`);
    let professionalPlanId: string | null = null;

    if (parseInt(plansCheck.rows[0].count) === 0) {
      const basicRes = await client.query(`
        INSERT INTO saas_plans (name, description, price, max_doctors, max_patients, is_popular, is_active, features)
        VALUES (
          'Plano Básico',
          'Ideal para profissionais autônomos ou consultórios individuais',
          '39,90',
          1,
          0,
          false,
          true,
          $1::jsonb
        ) RETURNING id;
      `, [JSON.stringify([
        "1 Médico incluso",
        "Agendamentos online ilimitados",
        "Lembretes e confirmações no WhatsApp",
        "Prontuário eletrônico completo",
        "Suporte por e-mail"
      ])]);

      const proRes = await client.query(`
        INSERT INTO saas_plans (name, description, price, max_doctors, max_patients, is_popular, is_active, features)
        VALUES (
          'Plano Profissional',
          'O plano mais escolhido para clínicas em crescimento',
          '59,90',
          3,
          0,
          true,
          true,
          $1::jsonb
        ) RETURNING id;
      `, [JSON.stringify([
        "Até 3 Médicos inclusos",
        "Agendamentos online ilimitados",
        "Lembretes e confirmações no WhatsApp",
        "Prontuário médico e odontológico",
        "Painel financeiro e métricas",
        "Suporte prioritário"
      ])]);

      professionalPlanId = proRes.rows[0].id;

      await client.query(`
        INSERT INTO saas_plans (name, description, price, max_doctors, max_patients, is_popular, is_active, features)
        VALUES (
          'Plano Clínica Total',
          'Perfeito para policlínicas e centros médicos completos',
          '129,90',
          10,
          0,
          false,
          true,
          $1::jsonb
        );
      `, [JSON.stringify([
        "Até 10 Médicos inclusos",
        "Agendamentos ilimitados",
        "WhatsApp automático conectado",
        "Múltiplas recepcionistas",
        "Prontuário completo e histórico",
        "Gestor de conta dedicado"
      ])]);
      console.log("3 planos padrão inseridos com sucesso!");
    } else {
      const proPlan = await client.query(`SELECT id FROM saas_plans WHERE name ILIKE '%Profissional%' LIMIT 1;`);
      if (proPlan.rows.length > 0) {
        professionalPlanId = proPlan.rows[0].id;
      }
    }

    console.log("7. Atualizando clínicas existentes para 'active' com 1 ano de validade para não bloquear...");
    if (professionalPlanId) {
      await client.query(`
        UPDATE clinics
        SET 
          plan_status = 'active',
          plan_expires_at = NOW() + INTERVAL '1 year',
          plan_id = $1,
          plan_notes = 'Clínica inicial de desenvolvimento - ativa por 1 ano'
        WHERE plan_expires_at IS NULL;
      `, [professionalPlanId]);
    } else {
      await client.query(`
        UPDATE clinics
        SET 
          plan_status = 'active',
          plan_expires_at = NOW() + INTERVAL '1 year',
          plan_notes = 'Clínica inicial de desenvolvimento - ativa por 1 ano'
        WHERE plan_expires_at IS NULL;
      `);
    }

    console.log("8. Definindo usuários existentes como Super Admin...");
    await client.query(`
      UPDATE users SET is_super_admin = true;
    `);

    await client.query("COMMIT");
    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Erro durante a migração:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error("Falha ao executar script:", err);
  process.exit(1);
});
