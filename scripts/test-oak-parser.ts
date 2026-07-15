import { mapProgressFromNkSave } from "@/lib/ninjakiwi";
import { getBorder } from "@/lib/progress";

/** Minimal fixture shaped like NK /btd6/save mapProgress. */
const fixture = {
  latestGameVersion: "55.2",
  mapProgress: {
    MonkeyMeadow: {
      complete: true,
      difficulty: {
        Easy: {
          single: {
            Standard: { completed: true, completedWithoutLoadingSave: true },
            PrimaryOnly: { completed: true, completedWithoutLoadingSave: true },
            Deflation: { completed: true, completedWithoutLoadingSave: true },
          },
          coop: {},
        },
        Medium: {
          single: {
            Standard: { completed: true, completedWithoutLoadingSave: true },
            MilitaryOnly: { completed: true, completedWithoutLoadingSave: true },
            Apopalypse: { completed: true, completedWithoutLoadingSave: true },
            Reverse: { completed: true, completedWithoutLoadingSave: true },
          },
          coop: {},
        },
        Hard: {
          single: {
            Standard: { completed: true, completedWithoutLoadingSave: true },
            MagicOnly: { completed: true, completedWithoutLoadingSave: true },
            DoubleMoabHealth: {
              completed: true,
              completedWithoutLoadingSave: true,
            },
            HalfCash: { completed: true, completedWithoutLoadingSave: true },
            AlternateBloonsRounds: {
              completed: true,
              completedWithoutLoadingSave: true,
            },
            Impoppable: { completed: true, completedWithoutLoadingSave: true },
            Clicks: { completed: true, completedWithoutLoadingSave: true },
          },
          coop: {},
        },
      },
    },
    TownCentre: {
      complete: false,
      difficulty: {
        Easy: {
          single: {
            Standard: { completed: true, completedWithoutLoadingSave: true },
          },
          coop: {},
        },
      },
    },
  },
};

const progress = mapProgressFromNkSave(fixture);
const meadow = progress.maps["monkey-meadow"];
const town = progress.maps["town-center"];

if (!meadow?.chimpsBlack) {
  throw new Error("Expected Monkey Meadow black CHIMPS from Clicks");
}
if (getBorder(meadow) !== "black") {
  throw new Error(`Expected black border, got ${getBorder(meadow)}`);
}
if (!town?.easy || town.chimps) {
  throw new Error("Town Centre should only have Easy standard");
}

console.log("oak-parser ok", {
  meadowBorder: getBorder(meadow),
  townMedals: town,
});
