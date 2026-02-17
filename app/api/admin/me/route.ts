import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return Response.json({ error: "Invalid or missing admin key" }, { status: 401 });
  }
  return Response.json({ ok: true });
}
