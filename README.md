# SummAI

A Chrome extension that summarizes web pages using Claude API.

Just press CMD+SHIFT+S.

You can also summarize highlighted text within the context of the page. Highlight text, right click, "AI Summary".

## WARNING

This uses your API key in the browser. This is not safe practice! Carefully decide how fun you are and use at your own discretion.

It passes "anthropic-dangerous-direct-browser-access" header to Anthropic to allow the request.

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the directory containing this extension

## Configuration

Before using the extension, you need to configure your Claude API key:

1. Open the `config.js` file in the extension directory
2. Replace `'YOUR_CLAUDE_API_KEY'` with your actual Claude API key
3. Save the file and reload the extension in Chrome

## Credit

Icon / favicon is not mine.

Thank you Parzival' 1997.
https://www.flaticon.com/free-icon/creative_12122387?term=generator&page=1&position=2&origin=tag&related_id=12122387
