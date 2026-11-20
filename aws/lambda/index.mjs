// AWS Lambda（関数URL / CloudFront 経由）版の /api/spins
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEG = 16;

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  body: JSON.stringify(body),
});

// GET  /api/spins?client=<uuid>  … 自分の直近履歴・自分の統計・全体の統計
// POST /api/spins  { clientId, win, hits, combo } … 1回分の結果を保存
export const handler = async (event) => {
  try {
    const method = event.requestContext?.http?.method;

    if (method === "GET") {
      const client = String(event.queryStringParameters?.client || "");
      if (!UUID_RE.test(client)) return json(400, { error: "invalid client" });

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
      return json(200, { recent, mine: mine[0], all: all[0] });
    }

    if (method === "POST") {
      let body = {};
      try {
        const raw = event.isBase64Encoded
          ? Buffer.from(event.body || "", "base64").toString("utf8")
          : event.body || "";
        body = JSON.parse(raw);
      } catch {
        return json(400, { error: "invalid json" });
      }
      const { clientId, win, hits, combo } = body;
      if (
        !UUID_RE.test(String(clientId)) ||
        typeof win !== "boolean" ||
        !Number.isInteger(hits) || hits < 1 || hits > SEG / 2 ||
        !Number.isInteger(combo) || combo < 0 || combo > 100000
      ) {
        return json(400, { error: "invalid body" });
      }
      await sql`INSERT INTO spins (client_id, win, hits, combo)
                VALUES (${clientId}, ${win}, ${hits}, ${combo})`;
      return json(201, { ok: true });
    }

    return json(405, { error: "method not allowed" }, { Allow: "GET, POST" });
  } catch (e) {
    console.error(e);
    return json(500, { error: "server error" });
  }
};
