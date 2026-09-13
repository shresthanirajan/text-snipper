# Text Snipper

Click the toolbar icon, drag around visible English text, and paste it anywhere.
Text Snipper uses local optical character recognition (OCR) to copy text from
webpages, pictures, and online documents. No account, API key, server, or usage
quota is required. The complete OCR engine and English data are included.

**Version 1.0.0 — release candidate.** The earlier workflow was tested by the
owner across normal websites. This cleaned package still requires the Chrome
acceptance checks in [TESTING.md](TESTING.md) before a 1.0.0 release.

## Install or update

1. Extract the ZIP into a permanent folder such as Documents.
2. Open `chrome://extensions` in Google Chrome and enable **Developer mode**.
3. If updating, disable the old Text Snipper first so there are not two copies.
4. Click **Load unpacked** and select the `text-snipper` folder containing
   `manifest.json`. Do not select `src`, `vendor`, or the ZIP itself.
5. Pin Text Snipper using Chrome's puzzle-piece menu.
6. Refresh the webpage you want to use. Click the icon, drag a rectangle, wait
   for **Copied!**, then paste with Ctrl+V (Mac: Command+V).

No terminal, npm install, or build step is needed. Keep the extracted folder;
Chrome loads the extension from it. After editing code, save, reload the
extension at `chrome://extensions`, then refresh the test webpage.

Optional shortcut: **Alt+Shift+S**. Customize it at
`chrome://extensions/shortcuts`. **Esc** cancels while selecting. Resizing or
scrolling during selection also cancels to prevent an incorrect crop. During
recognition, wait for completion before starting another snip.

## Scope and accuracy

- Copies plain English text from the visible selection; it does not preserve
  fonts, tables, or Word formatting and does not extract underlying DOM text.
- OCR enlarges the crop, checks normal layout and contrast, then checks up to
  four colored text bands. It merges competing lines by position and confidence.
- Low-confidence or punctuation-only lines can be omitted. Review pasted text:
  decorative fonts, names, formulas, blur, and background details can cause errors.
- Select one column at a time in multi-column documents. Zoom in for tiny text.
- Normal websites are supported. Chrome internal pages (including New Tab and
  `chrome://extensions`), Chrome Web Store, and some built-in viewers block the
  selection overlay. There is no alternate screenshot tab or desktop capture.
- Recognition takes longer for large selections. Each job has a two-minute
  timeout, not a daily usage limit. The engine is released after every job.
- Chrome 116 or newer is required. Windows/macOS and browser zoom checks remain
  part of release testing. Browser/OS policies can independently restrict access.

## Project guide

| Path | Purpose |
| --- | --- |
| `manifest.json` | Chrome entry points, permissions, icons, shortcut, security policy |
| `src/background.js` | Toolbar activation, screenshot capture, job lifetime, cleanup |
| `src/selection.js` | Drag rectangle and small Reading/Copied/error notifications |
| `src/offscreen.html` | Hidden local processing document |
| `src/offscreen.js` | Bitmap decoding, OCR passes, merging, clipboard write |
| `src/image-processing.js` | Contrast and colored-lettering image preparation |
| `icons/` | Editable SVG source and Chrome PNG sizes |
| `vendor/` | Bundled OCR engine, English data, dependency record and licenses |

Helpful comments are retained. There are no previews, menus, accounts, history,
analytics, remote OCR requests, or debug logs containing copied text.

## GitHub

Open this folder in VS Code. Initialize a repository using Source Control,
review the staged files, and make the first commit. Publish to your own GitHub
account when ready. Track the `vendor` directory: it is required for offline use.
The `.gitignore` excludes ZIPs, local dependencies, logs, and private key files.
Only one project folder is needed; do not upload the outer ZIP wrapper.

The project source is MIT licensed. Third-party code and data retain their
licenses. See [THIRD_PARTY.md](THIRD_PARTY.md).

## Before Chrome Web Store submission

Complete [TESTING.md](TESTING.md), fix failures, and update `manifest.json` to
`1.0.0`. Host [PRIVACY.md](PRIVACY.md) at a publicly accessible URL, prepare real
store screenshots, and complete the developer account and listing disclosures.
These account-specific steps and store approval are not included in this ZIP.

Suggested description: “Select visible English text on a webpage or image and
copy it to your clipboard. OCR runs locally, with no account or usage quota.”
Do not claim perfect accuracy or support for every browser page.

For a store upload ZIP, put `manifest.json`, `src/`, `icons/`, `vendor/`,
`LICENSE`, `PRIVACY.md`, and `THIRD_PARTY.md` at the ZIP root (not inside an extra
`text-snipper` folder). Preserve the vendor license notices. The downloadable
project ZIP uses an enclosing folder for convenient extraction and GitHub use.
