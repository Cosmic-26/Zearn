class ZearnScheduler {
  constructor({ hints, hintCooldownMs, answerCooldownMs, now = () => Date.now() }) {
    this.hints = Array.isArray(hints) ? hints.slice() : [];
    this.hintCooldownMs = Math.max(1, Number(hintCooldownMs) || 30_000);
    this.answerCooldownMs = Math.max(1, Number(answerCooldownMs) || 120_000);
    this.now = now;
    this.hintIndex = 0;
    this.lastHintAt = 0;
    this.answerAt = 0;
    this.phase = "idle";
  }

  start() {
    const currentTime = this.now();
    this.hintIndex = Math.min(1, this.hints.length);
    this.lastHintAt = currentTime;
    this.answerAt = 0;
    this.phase = this.hints.length > 0 ? "showing-hints" : "complete";
    return this.getSnapshot(currentTime);
  }

  advance(currentTime = this.now()) {
    if (this.phase !== "showing-hints" || this.hintIndex >= this.hints.length) {
      return false;
    }

    if (currentTime - this.lastHintAt < this.hintCooldownMs) {
      return false;
    }

    this.hintIndex += 1;
    this.lastHintAt = currentTime;

    if (this.hintIndex === this.hints.length) {
      this.phase = "waiting-for-answer";
      this.answerAt = currentTime + this.answerCooldownMs;
    }

    return this.getSnapshot(currentTime);
  }

  restart() {
    this.hintIndex = 0;
    this.lastHintAt = 0;
    this.answerAt = 0;
    this.phase = "idle";
    return this.start();
  }

  getSnapshot(currentTime = this.now()) {
    const currentHint = this.hintIndex > 0 ? this.hints[this.hintIndex - 1] : undefined;
    const remainingHintMs = this.phase === "showing-hints" && this.hintIndex < this.hints.length
      ? Math.max(0, this.lastHintAt + this.hintCooldownMs - currentTime)
      : 0;
    const answerVisible = this.phase === "waiting-for-answer" && currentTime >= this.answerAt;
    const remainingAnswerMs = this.phase === "waiting-for-answer"
      ? Math.max(0, this.answerAt - currentTime)
      : 0;

    return {
      phase: this.phase,
      hintIndex: this.hintIndex,
      currentHint,
      hints: this.hints,
      remainingHintMs,
      answerCooldownMs: this.answerCooldownMs,
      answerVisible,
      remainingAnswerMs
    };
  }
}

globalThis.ZearnScheduler = ZearnScheduler;
