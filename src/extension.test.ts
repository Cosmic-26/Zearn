import assert from "node:assert/strict";
import test from "node:test";

import { HintScheduler } from "./hintScheduler.js";

test("the scheduler is available to the extension", () => {
  const scheduler = new HintScheduler({
    hints: ["one", "two", "three", "four", "five"],
    hintCooldownMs: 30_000,
    answerCooldownMs: 120_000,
    now: () => 0
  });
  assert.equal(scheduler.start().hintIndex, 1);
});
