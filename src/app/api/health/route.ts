// GET /api/health — reports whether the app can reach its Supabase project.
import { connection } from "next/server";
import { checkSupabase } from "@/lib/supabase/health";

export async function GET() {
  // Always run at request time, never prerendered at build.
  await connection();
  const result = await checkSupabase();
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
