// 初回のみ実行: npm run db:init
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS spins (
    id          BIGSERIAL PRIMARY KEY,
    client_id   UUID        NOT NULL,
    win         BOOLEAN     NOT NULL,
    hits        SMALLINT    NOT NULL,
    combo       INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
await sql`CREATE INDEX IF NOT EXISTS spins_client_created_idx ON spins (client_id, created_at DESC)`;

console.log("spins テーブルを作成しました");
