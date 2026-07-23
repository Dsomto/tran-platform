import assert from "node:assert/strict";
import test from "node:test";
import {
  advancedCadenceError,
  isAdvancedStageKey,
  stageTimingChanged,
} from "./stage-schedule";

test("recognizes advanced stages", () => {
  assert.equal(isAdvancedStageKey("STAGE_4"), false);
  assert.equal(isAdvancedStageKey("STAGE_5"), true);
  assert.equal(isAdvancedStageKey("STAGE_9"), true);
});

test("accepts the standard advanced-stage WAT cadence", () => {
  assert.equal(
    advancedCadenceError(
      "STAGE_5",
      new Date("2026-07-20T08:00:00.000Z"),
      new Date("2026-07-24T17:10:00.000Z")
    ),
    null
  );
});

test("identifies a Sunday extension as an exceptional cadence", () => {
  assert.match(
    advancedCadenceError(
      "STAGE_5",
      new Date("2026-07-20T08:00:00.000Z"),
      new Date("2026-07-26T17:00:00.000Z")
    ) ?? "",
    /normally Monday/
  );
});

test("detects deadline-only timing changes", () => {
  const previous = {
    activeFrom: new Date("2026-07-20T08:00:00.000Z"),
    submitUntil: new Date("2026-07-24T17:10:00.000Z"),
  };
  assert.equal(
    stageTimingChanged(
      previous,
      new Date("2026-07-20T08:00:00.000Z"),
      new Date("2026-07-24T17:10:00.000Z")
    ),
    false
  );
  assert.equal(
    stageTimingChanged(
      previous,
      new Date("2026-07-20T08:00:00.000Z"),
      new Date("2026-07-26T17:00:00.000Z")
    ),
    true
  );
});
