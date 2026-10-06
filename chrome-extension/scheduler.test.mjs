import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("./scheduler.js", import.meta.url), "utf8");
const context = vm.createContext({ globalThis: {} });
vm.runInContext(source, context);
const { ZearnScheduler } = context.globalThis;

test("shows the first hint immediately and requires 30 seconds between hints", () => {
  let now = 1_000;
  const scheduler = new ZearnScheduler({
    hints: ["one", "two", "three", "four", "five"],
    hintCooldownMs: 30_000,
    answerCooldownMs: 120_000,
    now: () => now
  });

  assert.equal(scheduler.start().hintIndex, 1);
  assert.equal(scheduler.advance(1_000), false);

  now = 31_001;
  const second = scheduler.advance(now);
  assert.ok(second !== false);
  assert.equal(second.hintIndex, 2);
});

test("keeps the answer hidden for two minutes after the fifth hint", () => {
  let now = 0;
  const scheduler = new ZearnScheduler({
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
  assert.equal(fifth.answerVisible, false);

  now += 119_999;
  assert.equal(scheduler.getSnapshot().answerVisible, false);

  now += 1;
  assert.equal(scheduler.getSnapshot().answerVisible, true);
});

test("restarting resets the full sequence", () => {
  let now = 0;
  const scheduler = new ZearnScheduler({
    hints: ["one", "two", "three", "four", "five"],
    hintCooldownMs: 30_000,
    answerCooldownMs: 120_000,
    now: () => now
  });

  scheduler.start();
  scheduler.restart();
  assert.equal(scheduler.getSnapshot().hintIndex, 1);
  assert.equal(scheduler.getSnapshot().answerVisible, false);
});
