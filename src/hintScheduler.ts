export interface HintSchedulerOptions {
  hints: readonly string[];
  hintCooldownMs: number;
  answerCooldownMs: number;
  now: () => number;
}

export type SchedulerPhase = "idle" | "showing-hints" | "waiting-for-answer" | "complete";

export interface SchedulerSnapshot {
  phase: SchedulerPhase;
  hintIndex: number;
  currentHint: string | undefined;
  hints: readonly string[];
  remainingHintMs: number;
  answerCooldownMs: number;
  answerVisible: boolean;
  remainingAnswerMs: number;
}

export class HintScheduler {
  private readonly hints: readonly string[];
  private readonly hintCooldownMs: number;
  private readonly answerCooldownMs: number;
  private readonly now: () => number;
  private hintIndex = 0;
  private lastHintAt = 0;
  private answerAt = 0;
  private phase: SchedulerPhase = "idle";

  constructor(options: HintSchedulerOptions) {
    this.hints = options.hints;
    this.hintCooldownMs = Math.max(1, options.hintCooldownMs);
    this.answerCooldownMs = Math.max(1, options.answerCooldownMs);
    this.now = options.now;
  }

  start(): SchedulerSnapshot {
    const currentTime = this.now();
    this.hintIndex = 1;
    this.lastHintAt = currentTime;
    this.answerAt = 0;
    this.phase = this.hints.length > 0 ? "showing-hints" : "complete";
    return this.getSnapshot(currentTime);
  }

  advance(currentTime = this.now()): SchedulerSnapshot | false {
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

  restart(): SchedulerSnapshot {
    this.hintIndex = 0;
    this.lastHintAt = 0;
    this.answerAt = 0;
    this.phase = "idle";
    return this.start();
  }

  getSnapshot(currentTime = this.now()): SchedulerSnapshot {
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
