import {
  emptyProgress,
  isValidMapId,
  mergeMapProgress,
  normalizeMapProgress,
  type MapProgress,
  type ProgressStore,
} from "@/lib/progress";
import type { MedalId } from "@/data/medals";

const LS_PROGRESS = "btd6_progress";

export function loadClientProgress(): ProgressStore {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = localStorage.getItem(LS_PROGRESS);
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

export function saveClientProgress(store: ProgressStore): ProgressStore {
  const next: ProgressStore = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_PROGRESS, JSON.stringify(next));
  }
  return next;
}

export function patchClientMap(
  store: ProgressStore,
  mapId: string,
  patch: MapProgress,
): ProgressStore {
  if (!isValidMapId(mapId)) return store;
  const normalized = normalizeMapProgress(patch);
  if (!normalized) return store;
  return saveClientProgress({
    ...store,
    maps: {
      ...store.maps,
      [mapId]: mergeMapProgress(store.maps[mapId], normalized),
    },
  });
}

export function setClientMedal(
  store: ProgressStore,
  mapId: string,
  medalId: MedalId,
  earned: boolean,
): ProgressStore {
  return patchClientMap(store, mapId, { [medalId]: earned });
}
