export type MedalId =
  | "easy"
  | "primaryOnly"
  | "deflation"
  | "medium"
  | "militaryOnly"
  | "apopalypse"
  | "reverse"
  | "hard"
  | "magicOnly"
  | "doubleHpMoabs"
  | "halfCash"
  | "abr"
  | "impoppable"
  | "chimps"
  | "chimpsBlack";

export type MedalDifficulty = "easy" | "medium" | "hard";

export interface MedalDef {
  id: MedalId;
  label: string;
  short: string;
  difficulty: MedalDifficulty;
  /** Required for bronze / silver / gold / black border math */
  tier: "easy" | "medium" | "hard" | "impoppable" | "chimps" | "chimpsBlack";
  /** Official medal sprite under /public/medals */
  icon: string;
}

/** Solo map medals in BTD6 (as of 2026 / v55). Sprites from Blooncyclopedia. */
export const MEDALS: MedalDef[] = [
  {
    id: "easy",
    label: "Easy",
    short: "E",
    difficulty: "easy",
    tier: "easy",
    icon: "/medals/easy.png",
  },
  {
    id: "primaryOnly",
    label: "Primary Only",
    short: "PO",
    difficulty: "easy",
    tier: "easy",
    icon: "/medals/primaryOnly.png",
  },
  {
    id: "deflation",
    label: "Deflation",
    short: "Def",
    difficulty: "easy",
    tier: "easy",
    icon: "/medals/deflation.png",
  },
  {
    id: "medium",
    label: "Medium",
    short: "M",
    difficulty: "medium",
    tier: "medium",
    icon: "/medals/medium.png",
  },
  {
    id: "militaryOnly",
    label: "Military Only",
    short: "MO",
    difficulty: "medium",
    tier: "medium",
    icon: "/medals/militaryOnly.png",
  },
  {
    id: "apopalypse",
    label: "Apopalypse",
    short: "Apo",
    difficulty: "medium",
    tier: "medium",
    icon: "/medals/apopalypse.png",
  },
  {
    id: "reverse",
    label: "Reverse",
    short: "Rev",
    difficulty: "medium",
    tier: "medium",
    icon: "/medals/reverse.png",
  },
  {
    id: "hard",
    label: "Hard",
    short: "H",
    difficulty: "hard",
    tier: "hard",
    icon: "/medals/hard.png",
  },
  {
    id: "magicOnly",
    label: "Magic Monkeys Only",
    short: "Mag",
    difficulty: "hard",
    tier: "hard",
    icon: "/medals/magicOnly.png",
  },
  {
    id: "doubleHpMoabs",
    label: "Double HP MOABs",
    short: "2HP",
    difficulty: "hard",
    tier: "hard",
    icon: "/medals/doubleHpMoabs.png",
  },
  {
    id: "halfCash",
    label: "Half Cash",
    short: "HC",
    difficulty: "hard",
    tier: "hard",
    icon: "/medals/halfCash.png",
  },
  {
    id: "abr",
    label: "Alternate Bloons Rounds",
    short: "ABR",
    difficulty: "hard",
    tier: "hard",
    icon: "/medals/abr.png",
  },
  {
    id: "impoppable",
    label: "Impoppable",
    short: "Imp",
    difficulty: "hard",
    tier: "impoppable",
    icon: "/medals/impoppable.png",
  },
  {
    id: "chimps",
    label: "CHIMPS",
    short: "CH",
    difficulty: "hard",
    tier: "chimps",
    icon: "/medals/chimps.png",
  },
  {
    id: "chimpsBlack",
    label: "Black Border CHIMPS",
    short: "BB",
    difficulty: "hard",
    tier: "chimpsBlack",
    icon: "/medals/chimpsBlack.png",
  },
];

export const MEDAL_IDS = MEDALS.map((m) => m.id);

export const EASY_MEDALS = MEDALS.filter((m) => m.tier === "easy").map((m) => m.id);
export const MEDIUM_MEDALS = MEDALS.filter((m) => m.tier === "medium").map(
  (m) => m.id,
);
export const HARD_CORE_MEDALS = MEDALS.filter(
  (m) => m.tier === "hard" || m.tier === "impoppable" || m.tier === "chimps",
).map((m) => m.id);

export type BorderTier = "none" | "bronze" | "silver" | "gold" | "black";
