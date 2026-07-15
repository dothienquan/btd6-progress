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
  loadClientBaseline,
  loadClientProgress,
  patchClientMap,
  saveClientBaseline,
  saveClientProgress,
  type PlayStyle,
} from "@/lib/clientProgress";
import {
  countMedals,
  emptyProgress,
  formatRelativeTime,
  getBorder,
  isMapEdited,
  mapsForFilter,
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

const LS = {
  oak: "btd6_oak",
  profile: "btd6_oak_profile",
  lastSync: "btd6_last_sync",
  playStyle: "btd6_play_style",
} as const;

const AUTO_SYNC_MS = 15 * 60 * 1000;

export function ProgressApp() {
  const [soloProgress, setSoloProgress] =
    useState<ProgressStore>(emptyProgress);
  const [coopProgress, setCoopProgress] =
    useState<ProgressStore>(emptyProgress);
  const [soloBaseline, setSoloBaseline] = useState<ProgressStore | null>(null);
  const [coopBaseline, setCoopBaseline] = useState<ProgressStore | null>(null);
  const [playStyle, setPlayStyle] = useState<PlayStyle>("solo");
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
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const autoSynced = useRef(false);

  const progress = playStyle === "solo" ? soloProgress : coopProgress;
  const baseline = playStyle === "solo" ? soloBaseline : coopBaseline;

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

        const nextSolo = data.progress ?? emptyProgress();
        const nextCoop = data.coopProgress ?? emptyProgress();
        setSoloProgress(nextSolo);
        setCoopProgress(nextCoop);
        setSoloBaseline(nextSolo);
        setCoopBaseline(nextCoop);
        saveClientProgress(nextSolo, "solo");
        saveClientProgress(nextCoop, "coop");
        saveClientBaseline(nextSolo, "solo");
        saveClientBaseline(nextCoop, "coop");
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
          const soloMedals = data.summary?.medals ?? 0;
          const coopMedals = data.coopSummary?.medals ?? 0;
          setToast(
            `Synced${name} — Solo ${soloMedals} · Co-op ${coopMedals} medals.${warn}`,
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
    document.documentElement.dataset.theme = "day";

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

    const storedStyle = localStorage.getItem(LS.playStyle);
    if (storedStyle === "solo" || storedStyle === "coop") {
      setPlayStyle(storedStyle);
    }

    setSoloBaseline(loadClientBaseline("solo"));
    setCoopBaseline(loadClientBaseline("coop"));

    let cancelled = false;
    setSoloProgress(loadClientProgress("solo"));
    setCoopProgress(loadClientProgress("coop"));
    setLoading(false);
    if (storedOak && !autoSynced.current) {
      autoSynced.current = true;
      const last = storedSync ? new Date(storedSync).getTime() : 0;
      if (!last || Date.now() - last > AUTO_SYNC_MS) {
        void syncOak(storedOak, { silent: true }).finally(() => {
          if (cancelled) return;
        });
      }
    }

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

  const toggleMedal = useCallback(
    (mapId: string, medalId: MedalId) => {
      const apply = (prev: ProgressStore) => {
        const current = prev.maps[mapId] ?? {};
        const nextVal = !current[medalId];
        return patchClientMap(prev, mapId, { [medalId]: nextVal }, playStyle);
      };
      if (playStyle === "solo") setSoloProgress(apply);
      else setCoopProgress(apply);
    },
    [playStyle],
  );

  const markTier = useCallback(
    (mapId: string, upTo: "easy" | "medium" | "hard" | "all") => {
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
      const apply = (prev: ProgressStore) =>
        patchClientMap(prev, mapId, patch, playStyle);
      if (playStyle === "solo") setSoloProgress(apply);
      else setCoopProgress(apply);
    },
    [playStyle],
  );

  const selectPlayStyle = useCallback((next: PlayStyle) => {
    setPlayStyle(next);
    localStorage.setItem(LS.playStyle, next);
    setSelected(null);
  }, []);

  const selectedEdited = selected
    ? isMapEdited(selected.id, progress, baseline)
    : false;
  const hasUser = Boolean(profile?.displayName);

  return (
    <div className="app-shell">
      <header className="title-bar">
        <p className="brand">BTD 6 PROGRESS TRACKER</p>
        {hasUser && (
          <button
            type="button"
            className={`btn compact toggle title-oak${showOakSettings ? " active" : ""}`}
            onClick={() => setShowOakSettings((v) => !v)}
            aria-pressed={showOakSettings}
          >
            OAK
          </button>
        )}
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
              <span>
                {playStyle === "solo" ? "Solo" : "Co-op"} Completion
              </span>
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
          </div>
        </section>
      )}

      {hasUser && (
      <section className="toolbar">
        <div className="chips play-style-toggle" role="tablist" aria-label="Play style">
          <button
            type="button"
            role="tab"
            aria-selected={playStyle === "solo"}
            className={playStyle === "solo" ? "active" : ""}
            onClick={() => selectPlayStyle("solo")}
          >
            Solo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={playStyle === "coop"}
            className={playStyle === "coop" ? "active" : ""}
            onClick={() => selectPlayStyle("coop")}
          >
            Co-op
          </button>
        </div>
        <div className="search-row">
          <input
            className="search"
            placeholder="Search maps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn primary compact toolbar-sync"
            onClick={() => syncOak()}
            disabled={syncing}
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
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
                ["finished", "Completed"],
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
                  {playStyle === "solo" ? "Solo" : "Co-op"} ·{" "}
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
