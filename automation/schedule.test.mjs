import test from "node:test";
import assert from "node:assert/strict";
import { cyprusScheduleContext } from "./schedule.mjs";

test("summer attempt is eligible after 19:00 Cyprus", () => {
  assert.deepEqual(
    cyprusScheduleContext(new Date("2026-08-07T16:07:00Z")),
    { date: "2026-08-07", time: "19:07", eligible: true },
  );
});

test("winter attempts wait for the Cyprus 19:00 window", () => {
  assert.equal(
    cyprusScheduleContext(new Date("2026-12-07T16:47:00Z")).eligible,
    false,
  );
  assert.deepEqual(
    cyprusScheduleContext(new Date("2026-12-07T17:07:00Z")),
    { date: "2026-12-07", time: "19:07", eligible: true },
  );
});

test("a severely delayed run does not publish the next day after midnight", () => {
  assert.deepEqual(
    cyprusScheduleContext(new Date("2026-08-07T21:30:00Z")),
    { date: "2026-08-08", time: "00:30", eligible: false },
  );
});
