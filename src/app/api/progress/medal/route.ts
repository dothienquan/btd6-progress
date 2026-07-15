import { authorize, unauthorized } from "@/lib/auth";
import { MEDAL_IDS, type MedalId } from "@/data/medals";
import { isValidMapId, summarizeProgress } from "@/lib/progress";
import { setMedal } from "@/lib/store";

/**
 * Auto-update a single medal — convenient for scripts / overlays.
 * POST { mapId, medalId, earned?: boolean }
 */
export async function POST(request: Request) {
  if (!authorize(request)) return unauthorized();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const { mapId, medalId, earned = true } = body as {
    mapId?: string;
    medalId?: string;
    earned?: boolean;
  };

  if (!mapId || !isValidMapId(mapId)) {
    return Response.json({ error: "Invalid or missing mapId" }, { status: 400 });
  }
  if (!medalId || !MEDAL_IDS.includes(medalId as MedalId)) {
    return Response.json(
      { error: `Invalid medalId. Valid: ${MEDAL_IDS.join(", ")}` },
      { status: 400 },
    );
  }
  if (typeof earned !== "boolean") {
    return Response.json({ error: "earned must be boolean" }, { status: 400 });
  }

  const progress = await setMedal(mapId, medalId as MedalId, earned);
  if (!progress) {
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }

  return Response.json({
    ok: true,
    mapId,
    medalId,
    earned,
    medals: progress.maps[mapId],
    summary: summarizeProgress(progress),
  });
}
