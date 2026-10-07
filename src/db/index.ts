import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const db = drizzle(databaseUrl!, { schema });
