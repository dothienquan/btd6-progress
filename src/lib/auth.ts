import { timingSafeEqual } from "crypto";

/** Dev default — set BTD6_API_KEY in .env.local for production. */
const DEFAULT_KEY = "btd6-dev-key-change-me";

export function getApiKey(): string {
  return process.env.BTD6_API_KEY?.trim() || DEFAULT_KEY;
}

export function requireAuth(): boolean {
  return process.env.BTD6_REQUIRE_AUTH === "true";
}

export function authorize(request: Request): boolean {
  if (!requireAuth()) return true;

  const expected = getApiKey();
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const alt = request.headers.get("x-api-key")?.trim();
  const provided = bearer || alt;
  if (!provided) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json(
    {
      error:
        "Unauthorized. Provide Authorization: Bearer <API_KEY> or X-Api-Key. Set BTD6_REQUIRE_AUTH=true to enforce.",
    },
    { status: 401 },
  );
}
