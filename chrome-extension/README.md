# Zearn Chrome Extension

A Chrome extension that adds a small dot to the bottom-right corner of a web page. Clicking the dot opens a timed hint overlay.

## Behavior

1. The first hint appears immediately.
2. The following four hints appear every 30 seconds.
3. The fifth hint appears after the final 30-second interval.
4. The answer remains hidden for two minutes after the fifth hint.
5. The answer then appears automatically.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `chrome-extension` folder.
5. Open a website and click the Zearn dot in the bottom-right corner.

## Configure

Open the extension popup to set up to five hints and the final answer.

## Test

```sh
node --test chrome-extension/scheduler.test.mjs
```
