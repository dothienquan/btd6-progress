import { syncFromOak } from "@/lib/ninjakiwi";
import { summarizeProgress } from "@/lib/progress";

/**
 * Sync map medals from an in-game Ninja Kiwi Open Access Key (OAK).
 * Generate one in BTD6 → Profile → Open Data API.
 * Progress is returned to the client (browser storage) — no server disk write.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const oak =
    body && typeof body === "object" && "oak" in body
      ? String((body as { oak: unknown }).oak ?? "")
      : "";

  if (!oak.trim()) {
    return Response.json(
      {
        error:
          "Provide { oak: \"<your Open Access Key>\" }. Create one in BTD6 → Profile → Open Data API.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await syncFromOak(oak);
    const now = new Date().toISOString();
    const progress = { ...result.progress, updatedAt: now };
    const coopProgress = { ...result.coopProgress, updatedAt: now };
    return Response.json({
      ok: true,
      source: "ninjakiwi-oak",
      profile: {
        displayName: result.profile.displayName ?? null,
        rank: result.profile.rank ?? result.save.rank ?? null,
        veteranRank:
          result.profile.veteranRank ?? result.save.veteranRank ?? null,
        xp: result.save.xp ?? null,
        veteranXp: result.save.veteranXp ?? null,
        highestRound: result.profile.highestRound ?? null,
        medalsSinglePlayer: result.profile._medalsSinglePlayer ?? null,
        avatarURL: result.profile.avatarURL ?? null,
        bannerURL: result.profile.bannerURL ?? null,
      },
      progress,
      coopProgress,
      summary: summarizeProgress(progress),
      coopSummary: summarizeProgress(coopProgress),
      unmatchedNkMaps: result.unmatchedNkMaps,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    const status = /invalid|expired|look like/i.test(message) ? 400 : 502;
    return Response.json({ error: message }, { status });
  }
}
