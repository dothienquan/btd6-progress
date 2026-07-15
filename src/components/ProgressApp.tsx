"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  MAP_VERSION,
  MAPS,
  getMapImagePath,
  type MapDef,
  type MapDifficulty,
} from "@/data/maps";
import { MEDALS, type MedalId } from "@/data/medals";
import {
  countMedals,
  emptyProgress,
  formatRelativeTime,
  getBorder,
  isMapEdited,
  mapsForFilter,
  missingMedals,
  summarizeProgress,
  wikiUrlForMap,
  type CompletionFilter,
  type ProgressStore,
} from "@/lib/progress";

const BORDER_STYLES: Record<string, string> = {
  none: "border-[color:var(--line)]",
  bronze: "border-[#b87333]",
  silver: "border-[#9aa4b2]",
  gold: "border-[#d4a017]",
  black: "border-[#1a1a1a]",
};

type OakProfile = {
  displayName: string | null;
  rank: number | null;
  veteranRank: number | null;
  xp: number | null;
  veteranXp: number | null;
  avatarURL: string | null;
  bannerURL: string | null;
};

type ThemeMode = "day" | "night";

const LS = {
  oak: "btd6_oak",
  profile: "btd6_oak_profile",
  lastSync: "btd6_last_sync",
  baseline: "btd6_oak_baseline",
  theme: "btd6_theme",
} as const;

const AUTO_SYNC_MS = 15 * 60 * 1000;

async function fetchProgress(): Promise<ProgressStore> {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) return emptyProgress();
  const data = await res.json();
  return data.progress ?? emptyProgress();
}

async function saveMapMedals(mapId: string, medals: Record<string, boolean>) {
  const res = await fetch(`/api/progress/${mapId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(medals),
  });
  if (!res.ok) throw new Error("SAVE_FAILED");
  return res.json();
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ProgressApp() {
  const [progress, setProgress] = useState<ProgressStore>(emptyProgress);
  const [baseline, setBaseline] = useState<ProgressStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<"all" | MapDifficulty>("all");
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MapDef | null>(null);
  const [oak, setOak] = useState("");
  const [showOakSettings, setShowOakSettings] = useState(false);
  const [profile, setProfile] = useState<OakProfile | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("day");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const autoSynced = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncOak = useCallback(
    async (token?: string, opts?: { silent?: boolean }) => {
      const oakToken = (token ?? oak).trim();
      if (!oakToken) {
        if (!opts?.silent) setToast("Paste your in-game OAK token first.");
        setShowOakSettings(true);
        return false;
      }
      setSyncing(true);
      try {
        const res = await fetch("/api/oak/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oak: oakToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sync failed");

        setProgress(data.progress);
        setBaseline(data.progress);
        const syncedAt = new Date().toISOString();
        setLastSync(syncedAt);

        const nextProfile: OakProfile = {
          displayName: data.profile?.displayName ?? null,
          rank: data.profile?.rank ?? null,
          veteranRank: data.profile?.veteranRank ?? null,
          xp: data.profile?.xp ?? null,
          veteranXp: data.profile?.veteranXp ?? null,
          avatarURL: data.profile?.avatarURL ?? null,
          bannerURL: data.profile?.bannerURL ?? null,
        };
        setProfile(nextProfile);
        localStorage.setItem(LS.profile, JSON.stringify(nextProfile));
        localStorage.setItem(LS.oak, oakToken);
        localStorage.setItem(LS.lastSync, syncedAt);
        localStorage.setItem(LS.baseline, JSON.stringify(data.progress));
        setOak(oakToken);
        if (nextProfile.displayName) setShowOakSettings(false);

        if (!opts?.silent) {
          const name = nextProfile.displayName
            ? ` for ${nextProfile.displayName}`
            : "";
          const unmatched = Array.isArray(data.unmatchedNkMaps)
            ? data.unmatchedNkMaps
            : [];
          const warn =
            unmatched.length > 0
              ? ` Unmatched NK maps: ${unmatched.slice(0, 5).join(", ")}${unmatched.length > 5 ? "…" : ""}`
              : "";
          setToast(
            `Synced${name} — ${data.summary.medals} medals from Ninja Kiwi.${warn}`,
          );
        }
        return true;
      } catch (err) {
        if (!opts?.silent) {
          setToast(err instanceof Error ? err.message : "OAK sync failed");
        }
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [oak],
  );

  useEffect(() => {
    const storedOak = localStorage.getItem(LS.oak) ?? "";
    setOak(storedOak);

    const storedTheme = (localStorage.getItem(LS.theme) as ThemeMode) || "day";
    setTheme(storedTheme);
    applyTheme(storedTheme);

    let hasStoredUser = false;
    const storedProfile = localStorage.getItem(LS.profile);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as Partial<OakProfile>;
        const nextProfile: OakProfile = {
          displayName: parsed.displayName ?? null,
          rank: parsed.rank ?? null,
          veteranRank: parsed.veteranRank ?? null,
          xp: parsed.xp ?? null,
          veteranXp: parsed.veteranXp ?? null,
          avatarURL: parsed.avatarURL ?? null,
          bannerURL: parsed.bannerURL ?? null,
        };
        setProfile(nextProfile);
        hasStoredUser = Boolean(nextProfile.displayName);
      } catch {
        /* ignore */
      }
    }
    setShowOakSettings(!hasStoredUser);

    const storedSync = localStorage.getItem(LS.lastSync);
    if (storedSync) setLastSync(storedSync);

    const storedBaseline = localStorage.getItem(LS.baseline);
    if (storedBaseline) {
      try {
        setBaseline(JSON.parse(storedBaseline) as ProgressStore);
      } catch {
        /* ignore */
      }
    }

    let cancelled = false;
    fetchProgress()
      .then(async (p) => {
        if (cancelled) return;
        setProgress(p);
        setLoading(false);
        if (!storedOak || autoSynced.current) return;
        autoSynced.current = true;
        const last = storedSync ? new Date(storedSync).getTime() : 0;
        if (!last || Date.now() - last > AUTO_SYNC_MS) {
          await syncOak(storedOak, { silent: true });
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Mount-only bootstrap (OAK auto-sync uses stored token once).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const summary = useMemo(() => summarizeProgress(progress), [progress]);
  const editedCount = useMemo(() => {
    if (!baseline) return 0;
    return MAPS.filter((m) => isMapEdited(m.id, progress, baseline)).length;
  }, [progress, baseline]);

  const filtered = useMemo(
    () =>
      mapsForFilter(MAPS, {
        difficulty,
        query,
        showSpecial: false,
        completionFilter,
        progress,
        baseline,
      }),
    [difficulty, query, completionFilter, progress, baseline],
  );

  const grouped = useMemo(() => {
    return DIFFICULTY_ORDER.map((d) => ({
      difficulty: d,
      maps: filtered.filter((m) => m.difficulty === d),
    })).filter((g) => g.maps.length > 0);
  }, [filtered]);

  const persistOak = useCallback((value: string) => {
    setOak(value);
    localStorage.setItem(LS.oak, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === "day" ? "night" : "day";
      localStorage.setItem(LS.theme, next);
      applyTheme(next);
      return next;
    });
  }, []);

  const toggleMedal = useCallback(
    async (mapId: string, medalId: MedalId) => {
      const current = progress.maps[mapId] ?? {};
      const nextVal = !current[medalId];
      const nextMedals = { ...current, [medalId]: nextVal };

      setProgress((prev) => ({
        ...prev,
        maps: { ...prev.maps, [mapId]: nextMedals },
        updatedAt: new Date().toISOString(),
      }));
      setSaving(true);
      try {
        const data = await saveMapMedals(mapId, { [medalId]: nextVal });
        if (data.progress) setProgress(data.progress);
      } catch {
        setToast("Could not save medal change.");
        setProgress((prev) => ({
          ...prev,
          maps: { ...prev.maps, [mapId]: current },
        }));
      } finally {
        setSaving(false);
      }
    },
    [progress],
  );

  const markTier = useCallback(
    async (mapId: string, upTo: "easy" | "medium" | "hard" | "all") => {
      const ids =
        upTo === "easy"
          ? MEDALS.filter((m) => m.difficulty === "easy").map((m) => m.id)
          : upTo === "medium"
            ? MEDALS.filter(
                (m) => m.difficulty === "easy" || m.difficulty === "medium",
              ).map((m) => m.id)
            : upTo === "hard"
              ? MEDALS.filter((m) => m.id !== "chimpsBlack").map((m) => m.id)
              : MEDALS.map((m) => m.id);

      const patch = Object.fromEntries(ids.map((id) => [id, true])) as Record<
        MedalId,
        boolean
      >;
      const current = progress.maps[mapId] ?? {};
      const merged = { ...current, ...patch };

      setProgress((prev) => ({
        ...prev,
        maps: { ...prev.maps, [mapId]: merged },
        updatedAt: new Date().toISOString(),
      }));
      setSaving(true);
      try {
        const data = await saveMapMedals(mapId, patch);
        if (data.progress) setProgress(data.progress);
      } catch {
        setToast("Could not save batch update.");
        setProgress((prev) => ({
          ...prev,
          maps: { ...prev.maps, [mapId]: current },
        }));
      } finally {
        setSaving(false);
      }
    },
    [progress],
  );

  const exportProgress = useCallback(() => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `btd6-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [progress]);

  const importProgress = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as ProgressStore;
        if (!parsed.maps || typeof parsed.maps !== "object") {
          throw new Error("Invalid progress file");
        }
        const res = await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ maps: parsed.maps }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Import failed");
        setProgress(data.progress);
        setToast("Progress imported.");
      } catch (err) {
        setToast(err instanceof Error ? err.message : "Import failed");
      }
    },
    [],
  );

  const selectedMissing = selected
    ? missingMedals(progress.maps[selected.id])
    : [];
  const selectedBorder = selected
    ? getBorder(progress.maps[selected.id])
    : "none";
  const selectedEdited = selected
    ? isMapEdited(selected.id, progress, baseline)
    : false;
  const hasUser = Boolean(profile?.displayName);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <p className="brand">BTD 6 PROGRESS TRACKER</p>
          <span className="brand-meta">v{MAP_VERSION} maps</span>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className={`btn compact toggle${theme === "night" ? " active" : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            aria-pressed={theme === "night"}
          >
            {theme === "day" ? "Night" : "Day"}
          </button>
          {hasUser && (
            <button
              type="button"
              className={`btn compact toggle${showOakSettings ? " active" : ""}`}
              onClick={() => setShowOakSettings((v) => !v)}
              aria-pressed={showOakSettings}
            >
              OAK
            </button>
          )}
          {hasUser && (
            <button
              type="button"
              className="btn primary compact sticky-sync"
              onClick={() => syncOak()}
              disabled={syncing}
            >
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          )}
        </div>
      </header>

      {hasUser && (
      <section
        className={`dashboard${profile?.bannerURL ? " has-banner" : ""}`}
        aria-label="Progress dashboard"
        style={
          profile?.bannerURL
            ? { backgroundImage: `url(${profile.bannerURL})` }
            : undefined
        }
      >
        <div className="dash-identity">
          <div className="dash-avatar" aria-hidden={!profile?.avatarURL}>
            {profile?.avatarURL ? (
              <img src={profile.avatarURL} alt="" width={88} height={88} />
            ) : (
              <span className="dash-avatar-placeholder">
                {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div className="dash-main">
            <p className="dash-kicker">Player</p>
            <h1 className="dash-title">{profile?.displayName}</h1>
            <p className="dash-sub">
              {[
                profile?.rank != null ? `Rank ${profile.rank}` : null,
                profile?.veteranRank != null
                  ? `Veteran ${profile.veteranRank}`
                  : null,
                `Last sync: ${formatRelativeTime(lastSync)}`,
                editedCount > 0 ? `${editedCount} manual edits` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="dash-stats">
          <div className="dash-stat">
            <span>Completion</span>
            <strong>{loading ? "…" : `${summary.percent}%`}</strong>
            <em>
              {summary.medals}/{summary.totalPossible}
            </em>
          </div>
        </div>
      </section>
      )}

      {(showOakSettings || !hasUser) && (
        <section className="api-panel" id="oak">
          <h2>Ninja Kiwi OAK</h2>
          <p>
            {hasUser
              ? "Profile → Open Data API in BTD6. Tokens expire after ~90 days. Auto sync runs on load if the last sync was over 15 minutes ago."
              : "First-time setup: paste your Open Access Key from BTD6 → Profile → Open Data API, then sync."}
          </p>
          <label className="field">
            <span>Open Access Key</span>
            <input
              type="password"
              value={oak}
              onChange={(e) => persistOak(e.target.value)}
              placeholder="Paste your OAK token"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <div className="panel-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => syncOak()}
              disabled={syncing}
            >
              {syncing ? "Syncing…" : "Sync from game"}
            </button>
            {hasUser && (
              <>
                <button
                  type="button"
                  className="btn soft"
                  onClick={exportProgress}
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  className="btn soft"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import JSON
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importProgress(file);
                e.target.value = "";
              }}
            />
          </div>
        </section>
      )}

      {hasUser && (
      <section className="toolbar">
        <input
          className="search"
          placeholder="Search maps…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="tabs" role="tablist" aria-label="Difficulty">
          <button
            type="button"
            className={difficulty === "all" ? "active" : ""}
            onClick={() => setDifficulty("all")}
          >
            All
          </button>
          {DIFFICULTY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              className={difficulty === d ? "active" : ""}
              onClick={() => setDifficulty(d)}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
        <div className="checks">
          <div
            className="chips completion-toggle"
            role="group"
            aria-label="Completion"
          >
            {(
              [
                ["all", "All"],
                ["incomplete", "Incomplete"],
                ["finished", "Finished"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={completionFilter === id ? "active" : ""}
                onClick={() => setCompletionFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {saving && <span className="saving">Saving…</span>}
        </div>
      </section>
      )}

      {hasUser && (
      <main className="map-sections">
        {loading ? (
          <p className="muted">Loading maps…</p>
        ) : grouped.length === 0 ? (
          <p className="muted">No maps match your filters.</p>
        ) : (
          grouped.map((group) => (
            <section key={group.difficulty} className="difficulty-block">
              <h2>
                {DIFFICULTY_LABELS[group.difficulty]}
                <span>{group.maps.length}</span>
              </h2>
              <div className="map-grid">
                {group.maps.map((map) => {
                  const p = progress.maps[map.id];
                  const border = getBorder(p);
                  const earned = countMedals(p);
                  return (
                    <button
                      key={map.id}
                      type="button"
                      className={`map-card ${BORDER_STYLES[border]}${border === "black" ? " is-black-border" : ""}`}
                      style={{
                        backgroundImage: `url(${getMapImagePath(map.id)})`,
                      }}
                      onClick={() => setSelected(map)}
                    >
                      <span className="map-card-scrim" aria-hidden />
                      <span className="map-name">{map.name}</span>
                      <span className="map-progress">
                        {earned}/{MEDALS.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
      )}

      {selected && (
        <div
          className="drawer-backdrop"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <aside
            className="drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} medals`}
          >
            <header>
              <div>
                <p className="drawer-kicker">
                  {DIFFICULTY_LABELS[selected.difficulty]}
                  {selected.special ? " · Special" : ""} · v
                  {selected.introduced}
                  {selectedEdited ? " · edited since sync" : ""}
                </p>
                <h3>{selected.name}</h3>
              </div>
              <button
                type="button"
                className="btn soft compact"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </header>

            <div className={`border-preview border-${selectedBorder}`}>
              <span className="border-preview-ring" aria-hidden />
              <div>
                <strong>{selectedBorder} border</strong>
                <p>
                  {countMedals(progress.maps[selected.id])}/{MEDALS.length}{" "}
                  medals
                </p>
              </div>
            </div>

            {selectedMissing.length > 0 ? (
              <p className="missing-line">
                Missing:{" "}
                {selectedMissing.map((m) => m.short).join(", ")}
              </p>
            ) : (
              <p className="missing-line done">All medals earned</p>
            )}

            <div className="drawer-links">
              <a
                href={wikiUrlForMap(selected)}
                target="_blank"
                rel="noreferrer"
              >
                Open on Bloons wiki
              </a>
            </div>

            <div className="quick-marks">
              <button type="button" onClick={() => markTier(selected.id, "easy")}>
                All Easy
              </button>
              <button
                type="button"
                onClick={() => markTier(selected.id, "medium")}
              >
                Through Medium
              </button>
              <button
                type="button"
                onClick={() => markTier(selected.id, "hard")}
              >
                Gold (no BB)
              </button>
              <button type="button" onClick={() => markTier(selected.id, "all")}>
                Black Border
              </button>
            </div>

            {(["easy", "medium", "hard"] as const).map((diff) => (
              <div key={diff} className="medal-group">
                <h4>{diff}</h4>
                <ul className="medal-list">
                  {MEDALS.filter((m) => m.difficulty === diff).map((medal) => {
                    const on = Boolean(
                      progress.maps[selected.id]?.[medal.id],
                    );
                    return (
                      <li key={medal.id}>
                        <button
                          type="button"
                          className={on ? "earned" : ""}
                          onClick={() => toggleMedal(selected.id, medal.id)}
                        >
                          <img
                            className="medal-icon"
                            src={medal.icon}
                            alt=""
                            width={40}
                            height={48}
                            draggable={false}
                          />
                          <span className="medal-label">{medal.label}</span>
                          <span className="check">{on ? "✓" : ""}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </aside>
        </div>
      )}

      {hasUser && (
      <div className="mobile-sync-bar">
        <button
          type="button"
          className="btn primary"
          onClick={() => syncOak()}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <footer className="site-footer">
        Map data through BTD6 v{MAP_VERSION} ·{" "}
        <a href="https://data.ninjakiwi.com/" target="_blank" rel="noreferrer">
          Ninja Kiwi Open Data API
        </a>
      </footer>
    </div>
  );
}
