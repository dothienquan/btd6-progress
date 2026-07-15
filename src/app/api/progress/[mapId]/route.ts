import { authorize, unauthorized } from "@/lib/auth";
import { summarizeProgress } from "@/lib/progress";
import { patchMap, readProgress } from "@/lib/store";
import { normalizeMapProgress } from "@/lib/progress";

type Ctx = { params: Promise<{ mapId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { mapId } = await ctx.params;
  const progress = await readProgress();
  return Response.json({
    mapId,
    medals: progress.maps[mapId] ?? {},
    updatedAt: progress.updatedAt,
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  if (!authorize(request)) return unauthorized();
  const { mapId } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch =
    body &&
    typeof body === "object" &&
    "medals" in body
      ? normalizeMapProgress((body as { medals: unknown }).medals)
      : normalizeMapProgress(body);

  if (!patch || Object.keys(patch).length === 0) {
    return Response.json(
      { error: "Provide medal flags, e.g. { chimps: true }" },
      { status: 400 },
    );
  }

  const progress = await patchMap(mapId, patch);
  if (!progress) {
    return Response.json({ error: `Unknown map: ${mapId}` }, { status: 404 });
  }

  return Response.json({
    ok: true,
    mapId,
    medals: progress.maps[mapId],
    progress,
    summary: summarizeProgress(progress),
  });
}
