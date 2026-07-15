import { authorize, unauthorized } from "@/lib/auth";
import { summarizeProgress } from "@/lib/progress";
import { readProgress, replaceProgress } from "@/lib/store";

export async function GET() {
  const progress = await readProgress();
  return Response.json({
    progress,
    summary: summarizeProgress(progress),
  });
}

export async function PUT(request: Request) {
  if (!authorize(request)) return unauthorized();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const maps =
    body &&
    typeof body === "object" &&
    "maps" in body &&
    (body as { maps: unknown }).maps &&
    typeof (body as { maps: unknown }).maps === "object"
      ? ((body as { maps: Record<string, unknown> }).maps as Record<
          string,
          unknown
        >)
      : body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : null;

  if (!maps) {
    return Response.json(
      { error: "Body must be { maps: { [mapId]: { medalId: boolean } } }" },
      { status: 400 },
    );
  }

  const progress = await replaceProgress(
    maps as Parameters<typeof replaceProgress>[0],
  );
  return Response.json({
    ok: true,
    progress,
    summary: summarizeProgress(progress),
  });
}
