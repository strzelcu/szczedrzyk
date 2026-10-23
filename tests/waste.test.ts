import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectionsWithinWeek, isWasteSchedule, polishDay, relativeDay, upcomingCollections } from "../src/lib/waste.ts";
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

test("weekly reminders include all pickups through day seven and omit later dates", () => {
  const weekly = {...schedule, collections: [
    {date: "2026-10-30", fractions: ["paper"]},
    {date: "2026-10-23", fractions: ["bio"]},
    {date: "2026-10-22", fractions: ["glass"]},
    {date: "2026-10-29", fractions: ["packaging", "paper"]},
    {date: "2026-10-21", fractions: ["mixed"]},
    {date: "2026-10-27", fractions: ["mixed"]},
  ]};
  assert.deepEqual(collectionsWithinWeek(weekly, "2026-10-22").map(e => e.date),
    ["2026-10-22", "2026-10-23", "2026-10-27", "2026-10-29"]);
  assert.deepEqual(collectionsWithinWeek(schedule, "2026-10-23"), [
    {date: "2026-10-23", fractions: ["bio"]},
    {date: "2026-10-27", fractions: ["mixed"]},
  ]);
});
test("weekly reminders handle empty weeks, expired schedules, and year boundaries", () => {
  assert.deepEqual(collectionsWithinWeek({...schedule, collections: []}, "2026-10-22"), []);
  assert.deepEqual(collectionsWithinWeek(schedule, "2027-01-01"), []);
  assert.deepEqual(collectionsWithinWeek(schedule, "2025-12-31"), []);
  assert.deepEqual(collectionsWithinWeek(schedule, "2026-12-31"),
    [{date: "2026-12-31", fractions: ["packaging", "paper"]}]);
  const yearEnd = {...schedule, validUntil: "2027-12-31", collections: [
    {date: "2027-01-04", fractions: ["bio"]},
    {date: "2027-01-05", fractions: ["mixed"]},
  ]};
  assert.deepEqual(collectionsWithinWeek(yearEnd, "2026-12-28"),
    [{date: "2027-01-04", fractions: ["bio"]}]);
});
