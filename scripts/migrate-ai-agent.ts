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

    console.log("Adicionando colunas da Secretária IA em clinics...");
    await client.query(`
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ai_agent_enabled boolean NOT NULL DEFAULT false;
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ai_agent_active boolean NOT NULL DEFAULT false;
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ai_assistant_name text DEFAULT 'Sofia';
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ai_custom_instructions text;
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ai_allow_booking boolean NOT NULL DEFAULT true;
      ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ai_allow_cancel_or_confirm boolean NOT NULL DEFAULT true;
    `);

    await client.query("COMMIT");
    console.log("✅ Migração das colunas da Secretária IA concluída com sucesso!");
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
