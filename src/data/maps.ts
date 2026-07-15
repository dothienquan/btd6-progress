export type MapDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface MapDef {
  id: string;
  name: string;
  difficulty: MapDifficulty;
  /** Game version when the map was added */
  introduced: string;
  /** Not available in standard solo/co-op (Challenge Editor / Odyssey / etc.) */
  special?: boolean;
  water?: boolean;
}

/**
 * All BTD6 maps through Version 55.0 (2026).
 * Source: https://www.bloonswiki.com/List_of_maps_in_BTD6
 */
export const MAPS: MapDef[] = [
  // Beginner (26)
  { id: "monkey-meadow", name: "Monkey Meadow", difficulty: "beginner", introduced: "Launch", water: false },
  { id: "in-the-loop", name: "In The Loop", difficulty: "beginner", introduced: "Launch", water: true },
  { id: "middle-of-the-road", name: "Middle of the Road", difficulty: "beginner", introduced: "35.0", water: true },
  { id: "tinkerton", name: "Tinkerton", difficulty: "beginner", introduced: "43.0", water: true },
  { id: "tree-stump", name: "Tree Stump", difficulty: "beginner", introduced: "Launch", water: false },
  { id: "town-center", name: "Town Center", difficulty: "beginner", introduced: "Launch", water: true },
  { id: "one-two-tree", name: "One Two Tree", difficulty: "beginner", introduced: "34.0", water: true },
  { id: "scrapyard", name: "Scrapyard", difficulty: "beginner", introduced: "31.0", water: false },
  { id: "the-cabin", name: "The Cabin", difficulty: "beginner", introduced: "28.0", water: true },
  { id: "resort", name: "Resort", difficulty: "beginner", introduced: "25.0", water: true },
  { id: "skates", name: "Skates", difficulty: "beginner", introduced: "22.0", water: true },
  { id: "lotus-island", name: "Lotus Island", difficulty: "beginner", introduced: "19.0", water: true },
  { id: "candy-falls", name: "Candy Falls", difficulty: "beginner", introduced: "17.0", water: true },
  { id: "winter-park", name: "Winter Park", difficulty: "beginner", introduced: "14.0", water: true },
  { id: "carved", name: "Carved", difficulty: "beginner", introduced: "13.0", water: true },
  { id: "park-path", name: "Park Path", difficulty: "beginner", introduced: "11.0", water: true },
  { id: "alpine-run", name: "Alpine Run", difficulty: "beginner", introduced: "7.0", water: false },
  { id: "frozen-over", name: "Frozen Over", difficulty: "beginner", introduced: "5.0", water: true },
  { id: "cubism", name: "Cubism", difficulty: "beginner", introduced: "Launch", water: true },
  { id: "four-circles", name: "Four Circles", difficulty: "beginner", introduced: "Launch", water: true },
  { id: "hedge", name: "Hedge", difficulty: "beginner", introduced: "Launch", water: false },
  { id: "end-of-the-road", name: "End Of The Road", difficulty: "beginner", introduced: "Launch", water: true },
  { id: "logs", name: "Logs", difficulty: "beginner", introduced: "Launch", water: true },
  { id: "spa-pits", name: "Spa Pits", difficulty: "beginner", introduced: "48.0", water: true },
  { id: "three-mines-round", name: "Three Mines 'Round", difficulty: "beginner", introduced: "51.0", water: true },
  { id: "skull-peak", name: "Skull Peak", difficulty: "beginner", introduced: "55.0", water: true },

  // Intermediate (25 standard + Protect The Yacht special)
  { id: "lost-crevasse", name: "Lost Crevasse", difficulty: "intermediate", introduced: "50.0", water: true },
  { id: "luminous-cove", name: "Luminous Cove", difficulty: "intermediate", introduced: "44.0", water: true },
  { id: "ancient-portal", name: "Ancient Portal", difficulty: "intermediate", introduced: "45.0", water: true },
  { id: "sulfur-springs", name: "Sulfur Springs", difficulty: "intermediate", introduced: "41.0", water: true },
  { id: "water-park", name: "Water Park", difficulty: "intermediate", introduced: "38.0", water: true },
  { id: "polyphemus", name: "Polyphemus", difficulty: "intermediate", introduced: "36.0", water: true },
  { id: "covered-garden", name: "Covered Garden", difficulty: "intermediate", introduced: "33.0", water: true },
  { id: "quarry", name: "Quarry", difficulty: "intermediate", introduced: "32.0", water: true },
  { id: "quiet-street", name: "Quiet Street", difficulty: "intermediate", introduced: "29.0", water: true },
  { id: "bloonarius-prime", name: "Bloonarius Prime", difficulty: "intermediate", introduced: "27.0", water: true },
  { id: "balance", name: "Balance", difficulty: "intermediate", introduced: "24.0", water: true },
  { id: "encrypted", name: "Encrypted", difficulty: "intermediate", introduced: "21.0", water: true },
  { id: "bazaar", name: "Bazaar", difficulty: "intermediate", introduced: "18.0", water: true },
  { id: "adoras-temple", name: "Adora's Temple", difficulty: "intermediate", introduced: "14.0", water: true },
  { id: "spring-spring", name: "Spring Spring", difficulty: "intermediate", introduced: "10.0", water: true },
  { id: "kartsndarts", name: "KartsNDarts", difficulty: "intermediate", introduced: "8.0", water: false },
  { id: "moon-landing", name: "Moon Landing", difficulty: "intermediate", introduced: "6.0", water: false },
  { id: "haunted", name: "Haunted", difficulty: "intermediate", introduced: "5.0", water: true },
  { id: "downstream", name: "Downstream", difficulty: "intermediate", introduced: "4.0", water: true },
  { id: "firing-range", name: "Firing Range", difficulty: "intermediate", introduced: "2.0", water: true },
  { id: "cracked", name: "Cracked", difficulty: "intermediate", introduced: "Launch", water: true },
  { id: "streambed", name: "Streambed", difficulty: "intermediate", introduced: "Launch", water: true },
  { id: "chutes", name: "Chutes", difficulty: "intermediate", introduced: "Launch", water: true },
  { id: "rake", name: "Rake", difficulty: "intermediate", introduced: "Launch", water: true },
  { id: "spice-islands", name: "Spice Islands", difficulty: "intermediate", introduced: "Launch", water: true },
  { id: "protect-the-yacht", name: "Protect The Yacht", difficulty: "intermediate", introduced: "42.3", water: true, special: true },

  // Advanced (22)
  { id: "mushroom-grotto", name: "Mushroom Grotto", difficulty: "advanced", introduced: "54.0", water: false },
  { id: "party-parade", name: "Party Parade", difficulty: "advanced", introduced: "53.0", water: false },
  { id: "sunset-gulch", name: "Sunset Gulch", difficulty: "advanced", introduced: "49.0", water: false },
  { id: "enchanted-glade", name: "Enchanted Glade", difficulty: "advanced", introduced: "47.0", water: true },
  { id: "last-resort", name: "Last Resort", difficulty: "advanced", introduced: "46.0", water: true },
  { id: "castle-revenge", name: "Castle Revenge", difficulty: "advanced", introduced: "42.0", water: true },
  { id: "dark-path", name: "Dark Path", difficulty: "advanced", introduced: "39.0", water: false },
  { id: "erosion", name: "Erosion", difficulty: "advanced", introduced: "37.0", water: true },
  { id: "midnight-mansion", name: "Midnight Mansion", difficulty: "advanced", introduced: "33.0", water: false },
  { id: "sunken-columns", name: "Sunken Columns", difficulty: "advanced", introduced: "30.0", water: true },
  { id: "x-factor", name: "X Factor", difficulty: "advanced", introduced: "22.0", water: false },
  { id: "mesa", name: "Mesa", difficulty: "advanced", introduced: "20.0", water: false },
  { id: "geared", name: "Geared", difficulty: "advanced", introduced: "16.0", water: false },
  { id: "spillway", name: "Spillway", difficulty: "advanced", introduced: "12.0", water: true },
  { id: "cargo", name: "Cargo", difficulty: "advanced", introduced: "11.0", water: true },
  { id: "pats-pond", name: "Pat's Pond", difficulty: "advanced", introduced: "9.0", water: true },
  { id: "peninsula", name: "Peninsula", difficulty: "advanced", introduced: "7.0", water: true },
  { id: "high-finance", name: "High Finance", difficulty: "advanced", introduced: "3.0", water: true },
  { id: "another-brick", name: "Another Brick", difficulty: "advanced", introduced: "Launch", water: true },
  { id: "off-the-coast", name: "Off The Coast", difficulty: "advanced", introduced: "Launch", water: true },
  { id: "cornfield", name: "Cornfield", difficulty: "advanced", introduced: "Launch", water: false },
  { id: "underground", name: "Underground", difficulty: "advanced", introduced: "Launch", water: false },

  // Expert (13 standard + Blons special)
  { id: "tricky-tracks", name: "Tricky Tracks", difficulty: "expert", introduced: "52.0", water: false },
  { id: "glacial-trail", name: "Glacial Trail", difficulty: "expert", introduced: "40.0", water: true },
  { id: "dark-dungeons", name: "Dark Dungeons", difficulty: "expert", introduced: "35.0", water: true },
  { id: "sanctuary", name: "Sanctuary", difficulty: "expert", introduced: "26.0", water: true },
  { id: "ravine", name: "Ravine", difficulty: "expert", introduced: "23.0", water: true },
  { id: "flooded-valley", name: "Flooded Valley", difficulty: "expert", introduced: "18.0", water: true },
  { id: "infernal", name: "Infernal", difficulty: "expert", introduced: "15.0", water: true },
  { id: "bloody-puddles", name: "Bloody Puddles", difficulty: "expert", introduced: "13.0", water: true },
  { id: "workshop", name: "Workshop", difficulty: "expert", introduced: "12.0", water: false },
  { id: "quad", name: "Quad", difficulty: "expert", introduced: "6.0", water: true },
  { id: "dark-castle", name: "Dark Castle", difficulty: "expert", introduced: "5.0", water: true },
  { id: "muddy-puddles", name: "Muddy Puddles", difficulty: "expert", introduced: "Launch", water: true },
  { id: "ouch", name: "#Ouch", difficulty: "expert", introduced: "Launch", water: true },
  { id: "blons", name: "Blons", difficulty: "expert", introduced: "24.0", water: true, special: true },
];

export const MAP_VERSION = "55.0";
export const MAP_YEAR = 2026;

export const DIFFICULTY_ORDER: MapDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export const DIFFICULTY_LABELS: Record<MapDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export function getMapById(id: string): MapDef | undefined {
  return MAPS.find((m) => m.id === id);
}

/** Official in-game map select thumbnail (from Blooncyclopedia / NK assets). */
export function getMapImagePath(mapId: string): string {
  return `/maps/${mapId}.png`;
}

export function getMapsByDifficulty(difficulty: MapDifficulty): MapDef[] {
  return MAPS.filter((m) => m.difficulty === difficulty);
}

export const STANDARD_MAPS = MAPS.filter((m) => !m.special);
export const TOTAL_STANDARD_MAPS = STANDARD_MAPS.length;
export const MEDALS_PER_MAP = 15;
