# Release testing — 0.9.0

This is a release candidate. Check the actual package in Chrome before
publishing 1.0.0. Do not interpret component tests as browser acceptance.

## Checks completed while packaging

September 13, 2026:

- All project JavaScript files passed Node syntax checks.
- Manifest entry points and generated icon paths were checked.
- Both packaged browser core variants instantiated successfully in Node:
  LSTM with SIMD and LSTM without SIMD, using their embedded WebAssembly.
- The actual OCR pipeline and bundled English data recognized a two-line
  ordinary English sample on two consecutive runs.
- The same pipeline recovered all five expected lines in the supplied gym
  poster, including LEE PRIEST. A stray quotation mark before LEE remained.
- Blank-image recognition returned a no-readable-text error.
- A simulated clipboard refusal returned an error rather than success.
- Invalid crop dimensions were rejected.

These OCR checks used a Node canvas adapter and a simulated clipboard. They
do not validate Chrome's actual clipboard, toolbar, permissions, screenshots,
or offscreen-document lifecycle. Downloading the browser test runtime timed
out, so full browser automation was not completed. Earlier user reports
confirmed the preceding version worked on the tested normal websites.

## Chrome acceptance checklist

Start by disabling the old copy, loading this folder, and refreshing the test
webpage. Confirm that the extension card shows version 1.0.0 and the new icon.
For every successful capture, paste into Notepad/TextEdit and compare it with
the original text. Keep a note of the Chrome version, OS, zoom, and failures.

- [ ] Normal paragraph: click, drag, Reading text…, Copied!, paste.
- [ ] Repeat 15 snips without refreshing; no stuck button or duplicate selector.
- [ ] Drag in each direction, including bottom-right to top-left.
- [ ] Esc during selection removes the overlay; next click works.
- [ ] Tiny rectangle reports an error; next selection works.
- [ ] Blank selection reports an error and leaves the previous clipboard intact.
- [ ] Colored gym poster: headline and white text are recovered; review punctuation.
- [ ] Small text, large headings, light and dark backgrounds.
- [ ] Normal website image, Word Online document, and a regular long webpage.
- [ ] Zoom at 80%, 100%, 125%, 150%, and 200%; crop matches the selected region.
- [ ] Windows display scaling / Retina if available; crop remains aligned.
- [ ] Scroll or resize while selecting: selection cancels cleanly.
- [ ] Click while OCR is busy: no second job; clicking works after completion.
- [ ] Change tabs during capture: no text from the wrong tab is copied.
- [ ] Close the source tab during OCR, then use the extension on another page.
- [ ] Chrome internal pages give an unavailable tooltip/badge, not a stuck job.
- [ ] Load a page, disconnect the network, and recognize text successfully.
- [ ] Check extension Errors after testing; no new unexpected errors.
- [ ] Confirm no preview, menu, persistent text log, or extra results panel.

For recognition failures, record the exact selection, expected text, and
actual pasted text. A screenshot can help, but do not add private documents
or another person's copyrighted poster to the public repository by default.

## Release gate

Resolve functional failures before changing the version to 1.0.0. Document
remaining OCR limitations rather than claiming 100% accuracy. Finish the
public privacy-policy URL, store screenshots, publisher/support details,
permissions disclosures, and Google review separately. The current project
ZIP is ready to install and commit to GitHub, not a declaration of store approval.
