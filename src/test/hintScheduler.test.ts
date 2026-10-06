import assert from "node:assert/strict";
import test from "node:test";

import { HintScheduler } from "../hintScheduler.js";

test("reveals the first hint immediately and enforces the 30-second gap", () => {
  let now = 1_000;
  const scheduler = new HintScheduler({
    hints: ["one", "two", "three", "four", "five"],
    hintCooldownMs: 30_000,
    answerCooldownMs: 120_000,
    now: () => now
  });

  const first = scheduler.start();
  assert.equal(first.phase, "showing-hints");
  assert.equal(first.hintIndex, 1);
  assert.equal(first.hints[0], "one");
  assert.equal(scheduler.advance(1_000), false);

  now = 31_001;
  const second = scheduler.advance(now);
  assert.ok(second !== false);
  assert.equal(second.hintIndex, 2);
});

test("shows all five hints before beginning the two-minute answer cooldown", () => {
  let now = 0;
  const scheduler = new HintScheduler({
    hints: ["one", "two", "three", "four", "five"],
    hintCooldownMs: 30_000,
    answerCooldownMs: 120_000,
    now: () => now
  });

  scheduler.start();
  for (let index = 0; index < 4; index += 1) {
    now += 30_001;
    scheduler.advance(now);
  }

  const fifth = scheduler.getSnapshot();
  assert.equal(fifth.hintIndex, 5);
  assert.equal(fifth.phase, "waiting-for-answer");
  assert.equal(fifth.answerCooldownMs, 120_000);
  assert.equal(fifth.answerVisible, false);

  now += 119_999;
  assert.equal(scheduler.getSnapshot().answerVisible, false);
  now += 1;
  assert.equal(scheduler.getSnapshot().answerVisible, true);
});

test("does not reveal the answer before the fifth hint is shown", () => {
  let now = 0;
  const scheduler = new HintScheduler({
    hints: ["one", "two", "three", "four", "five"],
    hintCooldownMs: 30_000,
    answerCooldownMs: 120_000,
    now: () => now
  });

  scheduler.start();
  assert.equal(scheduler.getSnapshot().answerVisible, false);
  const first = scheduler.advance(now);
  assert.ok(first !== false);
  assert.equal(first.hintIndex, 1);
  assert.equal(scheduler.getSnapshot().answerVisible, false);
});
