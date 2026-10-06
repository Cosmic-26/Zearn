const DEFAULT_HINTS = [
  "Start by identifying the key data or state involved.",
  "Trace the flow from input to output.",
  "Inspect the smallest useful part of the implementation.",
  "Compare the behavior with a working example.",
  "Consider the final condition and how it is reached."
];

const storage = chrome.storage.sync;
const hintsInput = document.querySelector("#hints");
const answerInput = document.querySelector("#answer");

storage.sync.get(["hints", "answer"], (result) => {
  hintsInput.value = (result.hints || DEFAULT_HINTS).join("\n");
  answerInput.value = result.answer || "The answer is configured in this popup.";
});

document.querySelector("#save").addEventListener("click", () => {
  const hints = hintsInput.value.split("\n").map((line) => line.trim()).filter(Boolean);
  storage.sync.set({ hints: hints.slice(0, 5), answer: answerInput.value.trim() });
});
