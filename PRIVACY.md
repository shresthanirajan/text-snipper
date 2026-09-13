# Text Snipper privacy policy

Effective date: September 13, 2026

Text Snipper processes selected visible text locally in your browser.

## What happens when you use it

After you click the extension and select an area, Chrome captures the visible
tab into memory. The extension crops that image to your selection, recognizes
English text locally, and writes the result to your system clipboard.

The screenshot and recognition data are temporary. The processing document is
closed when the job finishes or times out. Text Snipper does not intentionally
save screenshots, text history, or OCR language caches to browser storage.
The OCR code and English language data are bundled with the extension.

## Data transmission and collection

Text Snipper has no server, account system, analytics, advertising, or tracking.
It does not send screenshots or recognized text to the developer or an external
OCR service. There is no extension-controlled database of your activity. It
does not log recognized text to the developer console.

The existing webpage, Chrome, your operating system, and applications into
which you paste text have their own privacy practices. Your clipboard may
retain or synchronize text if you have enabled clipboard history or syncing.
Removing Text Snipper does not clear your clipboard or operating-system history.

## Permissions

- **activeTab:** temporary access after you invoke the extension, to capture
  the visible tab and run the selector on supported pages.
- **scripting:** display and remove the rectangle and status notification.
- **offscreen:** run local image processing and OCR in a hidden document.
- **clipboardWrite:** copy the recognized text to your clipboard.

Text Snipper does not request clipboard-read permission or persistent access
to all websites. It cannot read the contents of your existing clipboard.

## Control and contact

Use Esc to cancel before capture, disable the extension, or uninstall it from
Chrome's Extensions page. Once recognition starts, it may finish and update the
clipboard even if you switch tabs. It is bounded by a two-minute timeout.

Privacy questions can be directed to the publisher using the support contact
on Text Snipper's Chrome Web Store listing when published. No personal contact
address has been embedded in this development package.
