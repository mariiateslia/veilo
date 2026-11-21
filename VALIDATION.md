# Validation — beta 0.1.1

November 17, 2026. Tested build: website, shared editor/effects, and installable ZIP.

- Nine automated tests pass: page action guard, style/priority restoration, pause/resume, mode switches, stale/nested selection cleanup, keyboard selection/reinjection, exported PNG overlap protection, scoped public demo, and independent web editor validation.
- The PNG regression uses a native canvas encoder and verifies opaque Cover pixels after a later overlapping Blur.
- Web editor tested with Chrome APIs absent. Unsupported MIME type and oversize input produce readable errors; edits/export call no fetch/XHR and use no local/session storage.
- Browser QA: all five public pages at 360, 768, and 1440 px; document scroll width equals viewport width, all visible images load.
- Browser QA: demo masks fictional targets only, Blur/Cover switch works, surrounding navigation remains unaffected.
- Browser QA: opened the fictional 1000 × 560 PNG, added a mask with Tab/Space and numeric coordinates, saved PNG. Downloaded output retained original dimensions; covered pixel was RGBA (41, 36, 49, 255).
- Installation ZIP extracted into one Veilo folder and loaded into a newly created, signed-out Chrome QA profile. Veilo 0.1.1 was enabled without installation errors. The profile had no previous Veilo installation; Chrome automatically added its usual default/system extension entries.
- Installed ZIP: selected a real webpage heading, observed 1 element hidden, pressed Escape, captured the visible tab, and verified the image opened in the extension editor (3182 × 1826).
- Install guide uses real Chrome screenshots, cropped to omit unrelated UI. JSON is visibly disabled in the folder picker.
- Build check validates relative links under a project subpath, installer folder layout and runtime assets, version substitution, and absence of Chrome adapters/network request APIs in public JavaScript.

Live page effects are cosmetic. No claim of secure redaction for blur, protection against malicious page scripts, cross-browser coverage, or dynamic-page mask persistence is made.

## English-only documentation — November 20, 2026

- Website and repository documentation use English only.
- The installation guide no longer offers a language switch.
- The legacy install-ru.html address redirects to install.html, with an English fallback link.
- README-RU.md remains as an English pointer to the main README so existing links stay useful.
