# YouTube Minimal

A Manifest V3 browser extension that makes YouTube cleaner, quieter, and easier to use intentionally.

## File structure

- `manifest.json` - MV3 manifest and content script registration
- `settings.js` - shared defaults, storage helpers, and the popup/content contract
- `popup.html` - popup markup with the frosted glass UI and all feature toggles
- `popup.css` - frosted glass popup styling
- `popup.js` - popup state syncing, toggle persistence, restore defaults, plus whitelist and blacklist editors
- `content.js` - YouTube SPA observer, selector-based hiding rules, channel blacklist filtering, and live page updates
- `icons/` - extension icons (16, 48, 128px)

## Install on Chrome / Edge

1. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `ytextensions` folder (the one with `manifest.json`)
5. Open YouTube — the extension icon shows in the toolbar. Pin it for quick access

## Install on Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Pick `manifest.json` from this folder
4. Open YouTube — the popup works just like on Chrome

> **Note:** Temporary add-ons are removed when Firefox closes. For a permanent install you'd need to package and sign it via [addons.mozilla.org](https://addons.mozilla.org).

## Install on other Chromium browsers (Brave, Vivaldi, Opera, Arc)

Most Chromium browsers have an extensions page similar to Chrome:

1. Open the browser's extensions page (usually in Settings → Extensions)
2. Turn on **Developer mode**
3. Click **Load unpacked** and select this folder
4. Done — works identically to Chrome

## Notes

- The popup writes to browser storage and the content script reacts live through storage listeners
- Most selectors and text-based filters are centralized in `content.js` so YouTube DOM updates are easier to maintain
- `settings.js` exposes `globalThis.YouTubeMinimalSettings` and `globalThis.YTMinimalSettings`
- Whitelist mode relaxes the general filters on matching channel pages
- Blacklist mode hides cards from blocked channels and hides current watch or channel pages when they match
# lolblocker
