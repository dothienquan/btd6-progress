import type { MedalId } from "@/data/medals";
import { MAPS } from "@/data/maps";
import type { MapProgress, ProgressStore } from "@/lib/progress";

const NK_BASE = "https://data.ninjakiwi.com/btd6";

/** NK API mode string → our medal id (CHIMPS handled separately). */
const MODE_TO_MEDAL: Record<string, MedalId> = {
  Standard: "easy", // remapped by difficulty below
  PrimaryOnly: "primaryOnly",
  Deflation: "deflation",
  MilitaryOnly: "militaryOnly",
  Apopalypse: "apopalypse",
  Reverse: "reverse",
  MagicOnly: "magicOnly",
  DoubleMoabHealth: "doubleHpMoabs",
  HalfCash: "halfCash",
  AlternateBloonsRounds: "abr",
  Impoppable: "impoppable",
  Clicks: "chimps", // NK's internal name for CHIMPS
};

const STANDARD_BY_DIFFICULTY: Record<string, MedalId> = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
};

type NkModeData = {
  completed?: boolean;
  completedWithoutLoadingSave?: boolean;
  bestRound?: number;
  timesCompleted?: number;
};

type NkMapEntry = {
  complete?: boolean;
  difficulty?: Record<
    string,
    {
      single?: Record<string, NkModeData>;
      coop?: Record<string, NkModeData>;
    }
  >;
};

type NkApiEnvelope<T> = {
  success?: boolean;
  error?: string | null;
  body?: T;
};

export type NkProfile = {
  displayName?: string;
  rank?: number;
  veteranRank?: number;
  highestRound?: number;
  avatar?: string;
  banner?: string;
  avatarURL?: string;
  bannerURL?: string;
  _medalsSinglePlayer?: Record<string, number>;
};

export type NkSave = {
  latestGameVersion?: string;
  rank?: number;
  xp?: number;
  veteranRank?: number;
  veteranXp?: number;
  mapProgress?: Record<string, NkMapEntry>;
};

/** Known NK save keys that don't match naive name stripping. */
const NK_KEY_OVERRIDES: Record<string, string[]> = {
  "monkey-meadow": ["MonkeyMeadow", "Tutorial"],
  "town-center": ["TownCentre", "TownCenter"],
  "middle-of-the-road": ["MiddleOfTheRoad"],
  "end-of-the-road": ["EndOfTheRoad"],
  "one-two-tree": ["OneTwoTree"],
  kartsndarts: ["KartsNDarts"],
  "pats-pond": ["PatsPond"],
  "adoras-temple": ["AdorasTemple"],
  ouch: ["#ouch", "#Ouch", "Ouch"],
  "three-mines-round": [
    "ThreeMinesRound",
    "ThreeMines'Round",
    "ThreeMines‘Round",
    "ThreeMines’Round",
    "ThreeMinesAround",
  ],
  "x-factor": ["XFactor"],
  "off-the-coast": ["OffTheCoast"],
  "another-brick": ["AnotherBrick"],
  "high-finance": ["HighFinance"],
  "bloody-puddles": ["BloodyPuddles"],
  "muddy-puddles": ["MuddyPuddles"],
  "dark-castle": ["DarkCastle"],
  "dark-dungeons": ["DarkDungeons"],
  "flooded-valley": ["FloodedValley"],
  "glacial-trail": ["GlacialTrail"],
  "tricky-tracks": ["TrickyTracks"],
  "mushroom-grotto": ["MushroomGrotto"],
  "party-parade": ["PartyParade"],
  "sunset-gulch": ["SunsetGulch"],
  "enchanted-glade": ["EnchantedGlade"],
  "last-resort": ["LastResort"],
  "castle-revenge": ["CastleRevenge"],
  "dark-path": ["DarkPath"],
  "midnight-mansion": ["MidnightMansion"],
  "sunken-columns": ["SunkenColumns"],
  "covered-garden": ["CoveredGarden"],
  "quiet-street": ["QuietStreet"],
  "bloonarius-prime": ["BloonariusPrime"],
  "spice-islands": ["SpiceIslands"],
  "spring-spring": ["SpringSpring"],
  "moon-landing": ["MoonLanding"],
  "firing-range": ["FiringRange"],
  "lost-crevasse": ["LostCrevasse"],
  "luminous-cove": ["LuminousCove"],
  "ancient-portal": ["AncientPortal"],
  "sulfur-springs": ["SulfurSprings"],
  "water-park": ["WaterPark"],
  "spa-pits": ["SpaPits"],
  "skull-peak": ["SkullPeak", "SkullTweak"],
  "lotus-island": ["LotusIsland"],
  "candy-falls": ["CandyFalls"],
  "winter-park": ["WinterPark"],
  "alpine-run": ["AlpineRun"],
  "frozen-over": ["FrozenOver"],
  "four-circles": ["FourCircles"],
  "park-path": ["ParkPath"],
  "tree-stump": ["TreeStump"],
  "the-cabin": ["TheCabin"],
  "in-the-loop": ["InTheLoop"],
  "protect-the-yacht": ["ProtectTheYacht"],
};

function stripToNkKey(name: string): string {
  return name
    .replace(/[''\u2018\u2019\u02BC]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** Lowercase letters/digits only — ignores spaces, apostrophes, punctuation. */
function alnumKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function nkKeysForMapId(mapId: string): string[] {
  const map = MAPS.find((m) => m.id === mapId);
  if (!map) return [];
  const keys = new Set<string>([
    ...(NK_KEY_OVERRIDES[mapId] ?? []),
    stripToNkKey(map.name),
    map.name.replace(/\s+/g, ""),
  ]);
  return [...keys];
}

function buildNkKeyIndex(
  mapProgress: Record<string, NkMapEntry>,
): Map<string, string> {
  const index = new Map<string, string>();
  for (const key of Object.keys(mapProgress)) {
    index.set(alnumKey(key), key);
  }
  return index;
}

function findMapEntry(
  mapProgress: Record<string, NkMapEntry>,
  mapId: string,
  keyIndex?: Map<string, string>,
): NkMapEntry | undefined {
  for (const key of nkKeysForMapId(mapId)) {
    if (mapProgress[key]) return mapProgress[key];
  }

  // Fuzzy: ignore punctuation/apostrophes (fixes Three Mines 'Round, etc.)
  const index = keyIndex ?? buildNkKeyIndex(mapProgress);
  const map = MAPS.find((m) => m.id === mapId);
  const candidates = [
    mapId,
    map?.name,
    ...(NK_KEY_OVERRIDES[mapId] ?? []),
    map ? stripToNkKey(map.name) : undefined,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const hit = index.get(alnumKey(candidate));
    if (hit && mapProgress[hit]) return mapProgress[hit];
  }

  return undefined;
}

function medalFromMode(difficulty: string, mode: string): MedalId | null {
  if (mode === "Standard") return STANDARD_BY_DIFFICULTY[difficulty] ?? null;
  return MODE_TO_MEDAL[mode] ?? null;
}

export type NkPlayMode = "single" | "coop";

function medalsFromModes(
  entry: NkMapEntry,
  playMode: NkPlayMode,
): MapProgress {
  const medals: MapProgress = {};
  if (!entry.difficulty) return medals;

  for (const [diff, modes] of Object.entries(entry.difficulty)) {
    const bucket = (playMode === "coop" ? modes.coop : modes.single) ?? {};
    for (const [mode, data] of Object.entries(bucket)) {
      const medalId = medalFromMode(diff, mode);
      if (!medalId || !data) continue;
      if (data.completed) medals[medalId] = true;
      if (mode === "Clicks" && data.completedWithoutLoadingSave) {
        medals.chimps = true;
        medals.chimpsBlack = true;
      }
    }
  }
  return medals;
}

export function mapProgressFromNkSave(
  save: NkSave,
  playMode: NkPlayMode = "single",
): ProgressStore {
  const maps: Record<string, MapProgress> = {};
  const raw = save.mapProgress ?? {};
  const keyIndex = buildNkKeyIndex(raw);

  for (const map of MAPS) {
    const entry = findMapEntry(raw, map.id, keyIndex);
    if (!entry?.difficulty) continue;
    const medals = medalsFromModes(entry, playMode);
    if (Object.keys(medals).length > 0) maps[map.id] = medals;
  }

  return { updatedAt: new Date().toISOString(), maps };
}

async function nkGet<T>(path: string): Promise<T> {
  const res = await fetch(`${NK_BASE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Ninja Kiwi API HTTP ${res.status} for ${path}`);
  }
  const json = (await res.json()) as NkApiEnvelope<T>;
  if (json.success === false || json.error) {
    throw new Error(
      typeof json.error === "string" && json.error
        ? json.error
        : "Invalid or expired OAK token",
    );
  }
  if (!json.body) {
    throw new Error("Empty response from Ninja Kiwi API");
  }
  return json.body;
}

export function normalizeOak(oak: string): string {
  return oak.trim();
}

export function isPlausibleOak(oak: string): boolean {
  // OAKs are long alphanumeric tokens; avoid sending short garbage.
  return /^[A-Za-z0-9_-]{20,}$/.test(oak.trim());
}

export async function fetchNkSave(oak: string): Promise<NkSave> {
  return nkGet<NkSave>(`/save/${encodeURIComponent(oak)}`);
}

export async function fetchNkProfile(oak: string): Promise<NkProfile> {
  return nkGet<NkProfile>(`/users/${encodeURIComponent(oak)}`);
}

export async function syncFromOak(oak: string): Promise<{
  progress: ProgressStore;
  coopProgress: ProgressStore;
  profile: NkProfile;
  save: Pick<
    NkSave,
    "latestGameVersion" | "rank" | "xp" | "veteranRank" | "veteranXp"
  >;
  unmatchedNkMaps: string[];
}> {
  const token = normalizeOak(oak);
  if (!isPlausibleOak(token)) {
    throw new Error("That does not look like a valid OAK token");
  }

  const [save, profile] = await Promise.all([
    fetchNkSave(token),
    fetchNkProfile(token).catch(() => ({} as NkProfile)),
  ]);

  const progress = mapProgressFromNkSave(save, "single");
  const coopProgress = mapProgressFromNkSave(save, "coop");
  const raw = save.mapProgress ?? {};
  const keyIndex = buildNkKeyIndex(raw);

  const matchedNkKeys = new Set<string>();
  for (const map of MAPS) {
    for (const key of nkKeysForMapId(map.id)) {
      if (raw[key]) matchedNkKeys.add(key);
    }
    for (const candidate of [
      map.name,
      map.id,
      stripToNkKey(map.name),
      ...(NK_KEY_OVERRIDES[map.id] ?? []),
    ]) {
      const hit = keyIndex.get(alnumKey(candidate));
      if (hit) matchedNkKeys.add(hit);
    }
  }

  const unmatchedNkMaps = Object.keys(raw).filter((k) => !matchedNkKeys.has(k));

  return {
    progress,
    coopProgress,
    profile,
    save: {
      latestGameVersion: save.latestGameVersion,
      rank: save.rank,
      xp: save.xp,
      veteranRank: save.veteranRank,
      veteranXp: save.veteranXp,
    },
    unmatchedNkMaps,
  };
}
