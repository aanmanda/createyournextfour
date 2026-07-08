import type { VercelRequest, VercelResponse } from "@vercel/node";
import { env } from "../env";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
  });
}
