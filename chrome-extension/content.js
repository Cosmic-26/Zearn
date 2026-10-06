const DEFAULT_HINTS = [
  "Start by identifying the key data or state involved.",
  "Trace the flow from input to output.",
  "Inspect the smallest useful part of the implementation.",
  "Compare the behavior with a working example.",
  "Consider the final condition and how it is reached."
];

const DEFAULT_ANSWER = "The answer is configured in this extension.";
const LOCKED_CLASS = "zearn-hint-overlay-root";

const settings = {
  hints: DEFAULT_HINTS,
  answer: DEFAULT_ANSWER
};

chrome.storage.sync.get(["hints", "answer"], (result) => {
  if (Array.isArray(result.hints) && result.hints.length > 0) {
    settings.hints = result.hints.slice(0, 5);
  }
  if (typeof result.answer === "string") {
    settings.answer = result.answer;
  }
});

const root = document.createElement("div");
root.className = LOCKED_CLASS;
root.innerHTML = `
  <button class="zearn-dot" type="button" aria-label="Open Zearn hints">✦</button>
  <section class="zearn-card" hidden>
    <div class="zearn-title">Zearn hint <span class="zearn-count">0 / 5</span></div>
    <p class="zearn-hint"></p>
    <div class="zearn-progress"><span></span></div>
    <div class="zearn-status"></div>
    <div class="zearn-answer" hidden></div>
    <button class="zearn-close" type="button">Close</button>
  </section>`;

document.documentElement.appendChild(root);

const dot = root.querySelector(".zearn-dot");
const card = root.querySelector(".zearn-card");
const hintText = root.querySelector(".zearn-hint");
const count = root.querySelector(".zearn-count");
const progress = root.querySelector(".zearn-progress span");
const status = root.querySelector(".zearn-status");
const answer = root.querySelector(".zearn-answer");
const close = root.querySelector(".zearn-close");

const scheduler = new ZearnScheduler({
  hints: settings.hints,
  hintCooldownMs: 30_000,
  answerCooldownMs: 120_000
});

let timer;
let open = false;

const render = () => {
  const snapshot = scheduler.getSnapshot();
  const percentage = Math.min(100, (snapshot.hintIndex / snapshot.hints.length) * 100);
  count.textContent = `${snapshot.hintIndex} / ${snapshot.hints.length}`;
  hintText.textContent = snapshot.currentHint || "Waiting…";
  progress.style.width = `${percentage}%`;

  if (snapshot.answerVisible) {
    answer.hidden = false;
    answer.textContent = `Answer: ${settings.answer}`;
    status.textContent = "Answer revealed";
  } else if (snapshot.phase === "waiting-for-answer") {
    answer.hidden = true;
    status.textContent = `Answer in ${Math.ceil(snapshot.remainingAnswerMs / 1000)} seconds`;
  } else {
    answer.hidden = true;
    status.textContent = `Hint ${snapshot.hintIndex} of ${snapshot.hints.length}`;
  }
};

const startTicker = () => {
  clearInterval(timer);
  timer = setInterval(() => {
    const snapshot = scheduler.advance();
    if (snapshot) render();
    else if (scheduler.getSnapshot().answerVisible) {
      render();
      clearInterval(timer);
    }
  }, 250);
};

const openOverlay = () => {
  if (!open) {
    scheduler.start();
    card.hidden = false;
    open = true;
    render();
    startTicker();
  }
};

dot.addEventListener("click", openOverlay);
close.addEventListener("click", () => {
  card.hidden = true;
  open = false;
  clearInterval(timer);
});

root.addEventListener("click", (event) => event.stopPropagation());
