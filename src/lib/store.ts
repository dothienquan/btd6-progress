import { promises as fs } from "fs";
import path from "path";
import {
  emptyProgress,
  isValidMapId,
  mergeMapProgress,
  normalizeMapProgress,
  type MapProgress,
  type ProgressStore,
} from "@/lib/progress";
import { MEDAL_IDS, type MedalId } from "@/data/medals";

const DATA_DIR = path.join(process.cwd(), "data");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PROGRESS_FILE);
  } catch {
    await fs.writeFile(
      PROGRESS_FILE,
      JSON.stringify(emptyProgress(), null, 2),
      "utf8",
    );
  }
}

export async function readProgress(): Promise<ProgressStore> {
  await ensureStore();
  const raw = await fs.readFile(PROGRESS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as ProgressStore;
    if (!parsed.maps || typeof parsed.maps !== "object") {
      return emptyProgress();
    }
    return {
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      maps: parsed.maps,
    };
  } catch {
    return emptyProgress();
  }
}

export async function writeProgress(store: ProgressStore): Promise<ProgressStore> {
  await ensureStore();
  const next: ProgressStore = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function replaceProgress(
  maps: Record<string, MapProgress>,
): Promise<ProgressStore> {
  const cleaned: Record<string, MapProgress> = {};
  for (const [mapId, progress] of Object.entries(maps)) {
    if (!isValidMapId(mapId)) continue;
    const normalized = normalizeMapProgress(progress);
    if (normalized) cleaned[mapId] = normalized;
  }
  return writeProgress({ updatedAt: new Date().toISOString(), maps: cleaned });
}

export async function patchMap(
  mapId: string,
  patch: MapProgress,
): Promise<ProgressStore | null> {
  if (!isValidMapId(mapId)) return null;
  const store = await readProgress();
  const normalized = normalizeMapProgress(patch);
  if (!normalized) return null;
  store.maps[mapId] = mergeMapProgress(store.maps[mapId], normalized);
  return writeProgress(store);
}

export async function setMedal(
  mapId: string,
  medalId: MedalId,
  earned: boolean,
): Promise<ProgressStore | null> {
  if (!isValidMapId(mapId) || !MEDAL_IDS.includes(medalId)) return null;
  return patchMap(mapId, { [medalId]: earned });
}
