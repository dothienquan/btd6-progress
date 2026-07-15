import { MAP_VERSION, MAP_YEAR, MAPS, TOTAL_STANDARD_MAPS } from "@/data/maps";
import { MEDALS } from "@/data/medals";

export async function GET() {
  return Response.json({
    version: MAP_VERSION,
    year: MAP_YEAR,
    standardMaps: TOTAL_STANDARD_MAPS,
    totalMapsIncludingSpecial: MAPS.length,
    medalsPerMap: MEDALS.length,
    medals: MEDALS,
    maps: MAPS,
  });
}
