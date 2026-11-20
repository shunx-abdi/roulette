import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEG = 16;

// GET  /api/spins?client=<uuid>  … 自分の直近履歴・自分の統計・全体の統計
// POST /api/spins  { clientId, win, hits, combo } … 1回分の結果を保存
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const client = String(req.query.client || "");
      if (!UUID_RE.test(client)) return res.status(400).json({ error: "invalid client" });

      const [recent, mine, all] = await Promise.all([
        sql`SELECT win, hits, combo, created_at FROM spins
            WHERE client_id = ${client} ORDER BY created_at DESC LIMIT 50`,
        sql`SELECT count(*)::int AS spins, count(*) FILTER (WHERE win)::int AS wins,
                   coalesce(max(combo), 0)::int AS max_combo
            FROM spins WHERE client_id = ${client}`,
        sql`SELECT count(*)::int AS spins, count(*) FILTER (WHERE win)::int AS wins,
                   count(DISTINCT client_id)::int AS players
            FROM spins`,
      ]);
      return res.status(200).json({ recent, mine: mine[0], all: all[0] });
    }

    if (req.method === "POST") {
      const { clientId, win, hits, combo } = req.body || {};
      if (
        !UUID_RE.test(String(clientId)) ||
        typeof win !== "boolean" ||
        !Number.isInteger(hits) || hits < 1 || hits > SEG / 2 ||
        !Number.isInteger(combo) || combo < 0 || combo > 100000
      ) {
        return res.status(400).json({ error: "invalid body" });
      }
      await sql`INSERT INTO spins (client_id, win, hits, combo)
                VALUES (${clientId}, ${win}, ${hits}, ${combo})`;
      return res.status(201).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
}
