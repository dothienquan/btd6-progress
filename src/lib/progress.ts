import {
  EASY_MEDALS,
  HARD_CORE_MEDALS,
  MEDALS,
  MEDIUM_MEDALS,
  type BorderTier,
  type MedalDef,
  type MedalId,
} from "@/data/medals";
import { MAPS, type MapDef } from "@/data/maps";

export type MapProgress = Partial<Record<MedalId, boolean>>;

export type ProgressStore = {
  updatedAt: string;
  maps: Record<string, MapProgress>;
};

export type BorderFilter =
  | "all"
  | "incomplete"
  | "none"
  | "bronze"
  | "silver"
  | "gold"
  | "black"
  | "edited";

export type CompletionFilter = "all" | "incomplete" | "finished";

export function emptyProgress(): ProgressStore {
  return { updatedAt: new Date().toISOString(), maps: {} };
}

export function hasMedal(
  progress: MapProgress | undefined,
  id: MedalId,
): boolean {
  return Boolean(progress?.[id]);
}

export function allEarned(
  progress: MapProgress | undefined,
  ids: MedalId[],
): boolean {
  return ids.every((id) => hasMedal(progress, id));
}

/** Map border from earned medals (bronze → silver → gold → black). */
export function getBorder(progress: MapProgress | undefined): BorderTier {
  if (!progress) return "none";
  const easy = allEarned(progress, EASY_MEDALS);
  if (!easy) return "none";
  const medium = allEarned(progress, MEDIUM_MEDALS);
  if (!medium) return "bronze";
  const hardCore = allEarned(progress, HARD_CORE_MEDALS);
  if (!hardCore) return "silver";
  if (!hasMedal(progress, "chimpsBlack")) return "gold";
  return "black";
}

export function countMedals(progress: MapProgress | undefined): number {
  if (!progress) return 0;
  return MEDALS.reduce((n, m) => n + (progress[m.id] ? 1 : 0), 0);
}

export function missingMedals(
  progress: MapProgress | undefined,
): MedalDef[] {
  return MEDALS.filter((m) => !hasMedal(progress, m.id));
}

export function mapProgressEqual(
  a: MapProgress | undefined,
  b: MapProgress | undefined,
): boolean {
  for (const medal of MEDALS) {
    if (Boolean(a?.[medal.id]) !== Boolean(b?.[medal.id])) return false;
  }
  return true;
}

export function isMapEdited(
  mapId: string,
  current: ProgressStore,
  baseline: ProgressStore | null,
): boolean {
  if (!baseline) return false;
  return !mapProgressEqual(current.maps[mapId], baseline.maps[mapId]);
}

export function summarizeProgress(store: ProgressStore) {
  let medals = 0;
  let black = 0;
  let gold = 0;
  let silver = 0;
  let bronze = 0;
  let touched = 0;

  for (const map of MAPS) {
    if (map.special) continue;
    const p = store.maps[map.id];
    const c = countMedals(p);
    if (c > 0) touched += 1;
    medals += c;
    const border = getBorder(p);
    if (border === "black") black += 1;
    else if (border === "gold") gold += 1;
    else if (border === "silver") silver += 1;
    else if (border === "bronze") bronze += 1;
  }

  const standardCount = MAPS.filter((m) => !m.special).length;
  const totalPossible = standardCount * MEDALS.length;

  return {
    medals,
    totalPossible,
    percent:
      totalPossible ? Math.round((medals / totalPossible) * 1000) / 10 : 0,
    mapsTouched: touched,
    mapsTotal: standardCount,
    borders: { black, gold, silver, bronze },
  };
}

export function normalizeMapProgress(input: unknown): MapProgress | null {
  if (!input || typeof input !== "object") return null;
  const out: MapProgress = {};
  for (const medal of MEDALS) {
    const v = (input as Record<string, unknown>)[medal.id];
    if (typeof v === "boolean") out[medal.id] = v;
  }
  return out;
}

export function mergeMapProgress(
  current: MapProgress | undefined,
  patch: MapProgress,
): MapProgress {
  return { ...current, ...patch };
}

export function isValidMapId(id: string): boolean {
  return MAPS.some((m) => m.id === id);
}

export function wikiUrlForMap(map: MapDef): string {
  const slug = map.name.replace(/ /g, "_");
  return `https://www.bloonswiki.com/${encodeURIComponent(slug)}`;
}

export function mapsForFilter(
  maps: MapDef[],
  opts: {
    difficulty?: string | "all";
    query?: string;
    showSpecial?: boolean;
    borderFilter?: BorderFilter;
    completionFilter?: CompletionFilter;
    progress?: ProgressStore;
    baseline?: ProgressStore | null;
  },
): MapDef[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  const borderFilter = opts.borderFilter ?? "all";
  const completionFilter = opts.completionFilter ?? "all";

  return maps.filter((m) => {
    if (!opts.showSpecial && m.special) return false;
    if (
      opts.difficulty &&
      opts.difficulty !== "all" &&
      m.difficulty !== opts.difficulty
    )
      return false;
    if (q && !m.name.toLowerCase().includes(q) && !m.id.includes(q))
      return false;

    if (opts.progress) {
      const border = getBorder(opts.progress.maps[m.id]);

      if (completionFilter === "finished" && border !== "black") return false;
      if (completionFilter === "incomplete" && border === "black") return false;

      if (borderFilter !== "all") {
        if (borderFilter === "incomplete") {
          if (border === "black" || border === "gold") return false;
        } else if (borderFilter === "edited") {
          if (!isMapEdited(m.id, opts.progress, opts.baseline ?? null))
            return false;
        } else if (border !== borderFilter) {
          return false;
        }
      }
    }
    return true;
  });
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never synced";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never synced";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
