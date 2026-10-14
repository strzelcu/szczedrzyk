import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isWasteSchedule, polishDay, relativeDay, upcomingCollections } from "../src/lib/waste.ts";
const schedule = JSON.parse(readFileSync(new URL("../public/data/waste.json", import.meta.url), "utf8"));
test("verified schedule: valid dates, no duplicate entries, Szczedrzyk bulky pickup", () => {
  assert.ok(isWasteSchedule(schedule));
  assert.equal(new Set(schedule.collections.map((e: {date: string}) => e.date)).size, schedule.collections.length);
  assert.deepEqual(schedule.collections.filter((e: {fractions: string[]}) => e.fractions.includes("bulky")), [{date:"2026-05-15",fractions:["bulky"]}]);
  assert.equal(isWasteSchedule({...schedule, collections:[{date:"2026-13-01",fractions:["mixed"]}]}), false);
});
test("upcoming collections and combined fractions match PDF", () => {
  assert.deepEqual(upcomingCollections(schedule,"2026-10-14").slice(0,4), [
    {date:"2026-10-22",fractions:["glass"]},
    {date:"2026-10-23",fractions:["bio"]},
    {date:"2026-10-27",fractions:["mixed"]},
    {date:"2026-11-05",fractions:["packaging","paper"]},
  ]);
  assert.deepEqual(upcomingCollections(schedule,"2026-12-31"),[{date:"2026-12-31",fractions:["packaging","paper"]}]);
  assert.deepEqual(upcomingCollections(schedule,"2027-01-01"),[]);
  assert.deepEqual(upcomingCollections(schedule,"2025-12-31"),[]);
});
test("Polish midnight and DST do not shift calendar days", () => {
  assert.equal(polishDay(new Date("2026-10-21T22:01:00Z")),"2026-10-22");
  assert.equal(polishDay(new Date("2026-12-30T23:01:00Z")),"2026-12-31");
  assert.equal(relativeDay("2026-10-25","2026-10-24"),"Jutro");
  assert.equal(relativeDay("2026-10-22","2026-10-22"),"Dzisiaj");
});
