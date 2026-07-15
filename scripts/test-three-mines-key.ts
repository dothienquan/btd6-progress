import { mapProgressFromNkSave } from "../src/lib/ninjakiwi";

const entry = {
  complete: true,
  difficulty: {
    Easy: {
      single: {
        Standard: { completed: true, completedWithoutLoadingSave: true },
        PrimaryOnly: { completed: true, completedWithoutLoadingSave: true },
      },
      coop: {},
    },
  },
};

const keys = [
  "ThreeMinesRound",
  "ThreeMines'Round",
  "ThreeMines\u2018Round",
  "ThreeMines\u2019Round",
  "ThreeMinesAround",
  "Three Mines Round",
];

let failed = 0;
for (const key of keys) {
  const progress = mapProgressFromNkSave({ mapProgress: { [key]: entry } });
  const hit = progress.maps["three-mines-round"];
  const ok = Boolean(hit?.easy && hit?.primaryOnly);
  console.log(`${ok ? "OK" : "MISS"} ${JSON.stringify(key)}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`failed ${failed}/${keys.length}`);
  process.exit(1);
}
console.log("three-mines key matching ok");
