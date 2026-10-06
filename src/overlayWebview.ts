import * as vscode from "vscode";

export interface OverlayState {
  phase: "idle" | "showing-hints" | "waiting-for-answer" | "complete";
  hintIndex: number;
  currentHint?: string;
  hints: readonly string[];
  remainingHintMs: number;
  answerCooldownMs: number;
  answerVisible: boolean;
  remainingAnswerMs: number;
  answer: string;
}

export class OverlayWebview {
  private readonly panel: vscode.WebviewPanel;
  private state: OverlayState;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(initialState: OverlayState) {
    this.state = initialState;
    this.panel = vscode.window.createWebviewPanel(
      "zearnHintOverlay",
      "Zearn Hint Overlay",
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    this.panel.webview.html = this.renderHtml();

    this.disposables.push(
      this.panel.onDidDispose(() => this.dispose()),
      this.panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "close") {
          this.panel.dispose();
        }
      })
    );
  }

  update(state: OverlayState): void {
    this.state = state;
    this.panel.webview.postMessage({ command: "update", state });
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private renderHtml(): string {
    const css = `
      body { margin: 0; min-width: 330px; background: #111827; color: #f9fafb; font-family: var(--vscode-font-family); }
      .card { padding: 20px; border: 1px solid #374151; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.45); }
      .eyebrow { color: #60a5fa; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      h1 { margin: 8px 0 14px; font-size: 19px; }
      .hint { min-height: 64px; margin: 0 0 18px; color: #e5e7eb; line-height: 1.5; }
      .progress { height: 5px; margin-bottom: 14px; overflow: hidden; border-radius: 99px; background: #1f2937; }
      .progress > div { height: 100%; width: 0; background: #60a5fa; transition: width .25s ease; }
      .status { color: #9ca3af; font-size: 12px; }
      .answer { padding: 14px; border-left: 3px solid #22c55e; background: #052e16; color: #bbf7d0; line-height: 1.5; }
      button { padding: 8px 12px; border: 1px solid #60a5fa; border-radius: 6px; background: #2563eb; color: white; cursor: pointer; }
    `;

    const script = `
      const vscode = acquireVsCodeApi();
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command !== 'update') return;
        const state = message.state;
        const count = Math.min(state.hintIndex, state.hints.length);
        document.getElementById('hint-count').textContent = count + ' / ' + state.hints.length;
        document.getElementById('hint').textContent = state.currentHint || 'Waiting…';
        document.getElementById('status').textContent = state.answerVisible
          ? 'Answer revealed'
          : state.phase === 'waiting-for-answer'
            ? 'Answer in ' + Math.ceil(state.remainingAnswerMs / 1000) + ' seconds'
            : 'Hint ' + count + ' of ' + state.hints.length;
        document.getElementById('progress').style.width = (count / state.hints.length * 100) + '%';
        document.getElementById('answer').hidden = !state.answerVisible;
        document.getElementById('answer-text').textContent = state.answerVisible ? state.answer : '';
      });
      document.getElementById('close').addEventListener('click', () => vscode.postMessage({ command: 'close' }));
    `;

    return `<!doctype html>
      <html><head><meta charset="utf-8"><style>${css}</style></head>
      <body><main class="card">
        <div class="eyebrow">Zearn hint sequence</div>
        <h1>Hint <span id="hint-count">0 / 0</span></h1>
        <p id="hint" class="hint">Opening overlay…</p>
        <div class="progress"><div id="progress"></div></div>
        <div id="status" class="status">Loading…</div>
        <div id="answer" class="answer" hidden><strong>Answer</strong><p id="answer-text"></p></div>
        <p><button id="close">Close</button></p>
      </main><script>${script}</script></body></html>`;
  }
}
