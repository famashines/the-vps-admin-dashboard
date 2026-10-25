import assert from "node:assert/strict";
import { test } from "node:test";
import { birthDateLimits, gradeLabel, schoolYearOf, todayInPakistan, yearStarting } from "./school.ts";

test("the school year runs from April to March, in Pakistan time", () => {
  assert.deepEqual(schoolYearOf(new Date("2026-10-25T12:00:00Z")), { name: "2026-27", startsOn: "2026-04-01", endsOn: "2027-03-31" });
  assert.equal(schoolYearOf(new Date("2027-03-31T12:00:00Z")).name, "2026-27");
  assert.equal(schoolYearOf(new Date("2027-03-31T19:30:00Z")).name, "2027-28");
  assert.equal(yearStarting(2099).name, "2099-00");
});

test("grades have plain names", () => {
  assert.equal(gradeLabel("prep"), "Prep");
  assert.equal(gradeLabel("class-10"), "Class 10");
});

test("a date of birth gives an age of 2 to 25 on the day", () => {
  assert.deepEqual(birthDateLimits("2026-10-25"), { min: "2000-10-26", max: "2024-10-25" });
  assert.deepEqual(birthDateLimits("2028-02-29"), { min: "2002-03-01", max: "2026-02-28" });
  assert.equal(todayInPakistan(new Date("2026-10-25T18:59:00Z")), "2026-10-25");
  assert.equal(todayInPakistan(new Date("2026-10-25T19:01:00Z")), "2026-10-26");
});
