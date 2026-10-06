import * as vscode from "vscode";
import { HintScheduler, type SchedulerSnapshot } from "./hintScheduler.js";
import { OverlayWebview, type OverlayState } from "./overlayWebview.js";

const CONFIG_SECTION = "zearn";

export function activate(context: vscode.ExtensionContext): void {
  const configuration = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const hints = configuration.get<string[]>("hints", []);
  const answer = configuration.get<string>("answer", "Answer not configured");
  const hintCooldownMs = configuration.get<number>("hintCooldownMs", 30_000);
  const answerCooldownMs = configuration.get<number>("answerCooldownMs", 120_000);

  const scheduler = new HintScheduler({
    hints,
    hintCooldownMs,
    answerCooldownMs,
    now: () => Date.now()
  });

  let overlay: OverlayWebview | undefined;
  let dot: vscode.StatusBarItem | undefined;
  let timer: NodeJS.Timeout | undefined;

  const showOverlay = (): void => {
    if (!overlay) {
      overlay = new OverlayWebview(toOverlayState(scheduler.getSnapshot(), answer));
    }

    const state = scheduler.start();
    overlay.update(toOverlayState(state, answer));
    dot?.show();
    startClock();
  };

  const startClock = (): void => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const state = scheduler.advance();
      if (!state) {
        const snapshot = scheduler.getSnapshot();
        if (snapshot.phase === "waiting-for-answer" && snapshot.answerVisible) {
          overlay?.update(toOverlayState(snapshot, answer));
          if (timer) clearInterval(timer);
        }
        return;
      }
      overlay?.update(toOverlayState(state, answer));
    }, 250);
  };

  dot = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  dot.text = "$(circle)";
  dot.tooltip = "Open the Zearn hint overlay";
  dot.command = "zearn.openOverlay";
  dot.show();
  context.subscriptions.push(dot);

  context.subscriptions.push(
    vscode.commands.registerCommand("zearn.openOverlay", showOverlay),
    vscode.commands.registerCommand("zearn.restartSequence", () => {
      scheduler.restart();
      if (overlay) overlay.update(toOverlayState(scheduler.getSnapshot(), answer));
      showOverlay();
    })
  );

  context.subscriptions.push({
    dispose(): void {
      if (timer) clearInterval(timer);
      overlay?.dispose();
    }
  });
}

function toOverlayState(snapshot: SchedulerSnapshot, answer: string): OverlayState {
  return {
    phase: snapshot.phase,
    hintIndex: snapshot.hintIndex,
    currentHint: snapshot.currentHint,
    hints: snapshot.hints,
    remainingHintMs: snapshot.remainingHintMs,
    answerCooldownMs: snapshot.answerCooldownMs,
    answerVisible: snapshot.answerVisible,
    remainingAnswerMs: snapshot.remainingAnswerMs,
    answer
  };
}

export function deactivate(): void {
  // The extension's resources are disposed through the extension context.
}
