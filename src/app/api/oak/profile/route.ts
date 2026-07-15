import { fetchNkProfile, isPlausibleOak, normalizeOak } from "@/lib/ninjakiwi";

/** Peek at public profile for an OAK without writing progress. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const oak =
    body && typeof body === "object" && "oak" in body
      ? normalizeOak(String((body as { oak: unknown }).oak ?? ""))
      : "";

  if (!isPlausibleOak(oak)) {
    return Response.json({ error: "Invalid OAK token" }, { status: 400 });
  }

  try {
    const profile = await fetchNkProfile(oak);
    return Response.json({
      ok: true,
      displayName: profile.displayName ?? null,
      rank: profile.rank ?? null,
      veteranRank: profile.veteranRank ?? null,
      highestRound: profile.highestRound ?? null,
      medalsSinglePlayer: profile._medalsSinglePlayer ?? null,
      avatarURL: profile.avatarURL ?? null,
      bannerURL: profile.bannerURL ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
