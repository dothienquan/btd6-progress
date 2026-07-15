import {
  emptyProgress,
  isValidMapId,
  mergeMapProgress,
  normalizeMapProgress,
  type MapProgress,
  type ProgressStore,
} from "@/lib/progress";
import type { MedalId } from "@/data/medals";

export type PlayStyle = "solo" | "coop";

const LS_PROGRESS: Record<PlayStyle, string> = {
  solo: "btd6_progress",
  coop: "btd6_progress_coop",
};

const LS_BASELINE: Record<PlayStyle, string> = {
  solo: "btd6_oak_baseline",
  coop: "btd6_oak_baseline_coop",
};

export function loadClientProgress(
  playStyle: PlayStyle = "solo",
): ProgressStore {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = localStorage.getItem(LS_PROGRESS[playStyle]);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressStore;
    if (!parsed.maps || typeof parsed.maps !== "object") return emptyProgress();
    return {
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      maps: parsed.maps,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveClientProgress(
  store: ProgressStore,
  playStyle: PlayStyle = "solo",
): ProgressStore {
  const next: ProgressStore = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_PROGRESS[playStyle], JSON.stringify(next));
  }
  return next;
}

export function loadClientBaseline(
  playStyle: PlayStyle = "solo",
): ProgressStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_BASELINE[playStyle]);
    if (!raw) return null;
    return JSON.parse(raw) as ProgressStore;
  } catch {
    return null;
  }
}

export function saveClientBaseline(
  store: ProgressStore,
  playStyle: PlayStyle = "solo",
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_BASELINE[playStyle], JSON.stringify(store));
}

export function patchClientMap(
  store: ProgressStore,
  mapId: string,
  patch: MapProgress,
  playStyle: PlayStyle = "solo",
): ProgressStore {
  if (!isValidMapId(mapId)) return store;
  const normalized = normalizeMapProgress(patch);
  if (!normalized) return store;
  return saveClientProgress(
    {
      ...store,
      maps: {
        ...store.maps,
        [mapId]: mergeMapProgress(store.maps[mapId], normalized),
      },
    },
    playStyle,
  );
}

export function setClientMedal(
  store: ProgressStore,
  mapId: string,
  medalId: MedalId,
  earned: boolean,
  playStyle: PlayStyle = "solo",
): ProgressStore {
  return patchClientMap(store, mapId, { [medalId]: earned }, playStyle);
}
