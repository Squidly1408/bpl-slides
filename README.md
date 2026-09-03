# BPL Slides

A client-side tool for Big Picture Learning students to turn a term's work into a designed exhibition slideshow — build it, present it, done. Nothing is uploaded anywhere: every project, file, drawing, and recording is stored locally in your browser.

**This is a student-built tool designed for Big Picture Learning, aligned with Big Picture Learning Australia's published framework (Exhibition, Senior Portfolio, Gateway Certificate, IBPLC). It's offered as a potential tool for Big Picture schools, but it is not currently an official BPLA product.**

## Features

- **Designed templates, not blank slides** — Exhibition, Senior Portfolio (Years 11–12), Gateway Certificate (Years 8–10), and a general-purpose Normal Presentation deck, each built from real BPLA terminology (the six Learning Goals, Learning Through Internship, the IBPLC) using a small "design system" of layouts (colour bands, icon bubbles, evidence cards, timelines) — see `lib/layouts.ts` and `lib/templates.ts`.
- **Colour themes** — 10 selectable palettes (default: Indigo) applied across a project's slides; switch theme any time and the whole deck recolours. The active project's theme also tints the editor/present chrome.
- **Light/dark app theme** — a sun/moon toggle in the header (follows your OS/browser preference by default, remembers an explicit choice). This is the site's own UI theme, separate from a project's slide colour theme above.
- **Industry slide packs** — 10 industry areas (Trades, Health, Creative Arts, Business, IT, Science, Education, Hospitality, Engineering, Sport), each contributing 3 ready-made slides (overview, skills & tools, evidence) you can drop into any deck.
- **Term/year aware** — new projects prompt for a term & year (defaulting to a best guess for "now"), baked into the generated title and title slide instead of a generic placeholder.
- **Quick-insert IBPLC and Internship (LTI) slides** from the editor toolbar, on top of whatever template you started from.
- **Projects live in your browser** (IndexedDB) — no accounts, nothing uploaded anywhere.
- **Upload work to auto-fill slides** — drop in `.docx`, `.pptx`, `.pdf`, `.txt`/`.md`, images, video, audio, or 3D models (`.stl`/`.obj`/`.glb`/`.gltf`); content is reconstructed into reading order (fixing the jumbled multi-column PDF text and run-together bullet-list text that naive extraction produces), split into one clear point per line, capped and paged so it doesn't overflow, and laid out with the project's theme — all offline, no AI involved.
- **Slide editor** — drag/resize/rotate text, shape, image, video, audio, embed, 3D-model, drawing, icon, maths, and Learning-Flower blocks on a free-form canvas; layering (bring forward/send back); per-slide transition picker; background colour/image; speaker notes; full undo/redo (Ctrl+Z / Ctrl+Shift+Z) and shortcuts (Delete, Ctrl+D duplicate, arrow-key nudge). Redesign a slide's layout in one click from 5 built-in styles (colour band, accent bar, bold cover, grid cards, and mirrored colour band).
- **Shapes** — rectangle/pill/circle (adjustable corner rounding), triangle, pentagon, hexagon, star, arrow, and line, each with an optional gradient fill and drop shadow, toggleable per shape in its properties panel.
- **Icon library** — search and insert from the full ~2,000-icon Font Awesome Free set, bundled with the app (`@fortawesome/free-solid-svg-icons`, no CDN) so it works offline and no search query ever leaves your browser.
- **Maths** — type an expression (standard LaTeX-ish notation: `^`, `_`, `\frac`, `\sqrt`, `\sum`, `\int`, Greek letters, …) rendered live via KaTeX, entirely on-device; or attach a photo of handwritten maths as a plain image instead (see Known limitations for why that photo isn't auto-digitised).
- **The Big Picture Learning Flower, for real** — an editable, insertable version of BPLA's actual Learning-Flower graphic (exact petal artwork, official colours, and 1-5 progression scale, not an approximation) — six sliders in its properties panel adjust each Learning Goal's level live, each backed by BPLA's real level-descriptor text. See `lib/flowerData.ts`.
- **Works on phone, tablet, and desktop** — the editor's slide list and settings panel become full-screen drawers below the `lg` breakpoint; touch dragging/resizing is supported.
- **Present mode** — fullscreen, advance via keyboard (→/Space), mouse click zones, or voice ("next"/"back" using your browser's built-in speech recognition — this is the one feature that needs an internet connection, see Known limitations below); a pen/drawing overlay for live annotation.
- **Media viewers** — images, video, audio, embedded websites (iframe), and an interactive 3D mesh viewer (orbit/zoom, wireframe toggle) built on Three.js.
- **Drawing/pen tool** — as a slide block, a Present-mode annotation overlay, and a standalone whiteboard at `/draw`.
- **PowerPoint interop** — export the deck to a real `.pptx` (pptxgenjs, including shape/colour-band blocks), or import an existing `.pptx` as a best-effort starting point.
- **Project file backup** — since there's no server, "Download project" exports a single portable file (JSON + assets) to back up or move between browsers; "Import project file" restores it.
- **Works offline / installable** — a service worker caches the whole app on first visit (handy on exhibition day with unreliable wifi); "Add to Home Screen"/install from the browser menu turns it into a standalone app window with its own icon. The one exception is voice navigation (below) — everything else, including building, editing, presenting, and exporting, works with no connection at all.
- **Privacy Policy & Terms & Conditions** pages that reflect reality (no accounts, no server — see `/privacy` and `/terms`).

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build locally
```

Requires Node 20+. The offline/install behaviour only runs against the production build — `npm run dev` does not register the service worker; use `npm run build && npm run preview` to test it.

## Project structure

```
src/
  pages/        route-level screens (Dashboard, UploadWork, Editor, Present, Draw, Privacy, Terms)
  components/   SlideStage (the editable/presentable canvas), block renderers (incl. FlowerGraphBlock,
                IconBlockContent, MathBlockContent), MeshViewer, DrawingCanvas, IconPickerModal,
                MathBlockEditorModal, Logo, icons, ...
  lib/          IndexedDB layer (db.ts), themes.ts, layouts.ts (the slide "design system"), templates.ts,
                industries.ts, flowerData.ts (the real Learning Flower's petal paths/colours/level text),
                icons.ts (Font Awesome lookup), shapes.ts (shape-kind clip-paths), document parsers,
                pptx export/import, project-file export/import, speech nav
  store/        Zustand store for the project being edited (with undo/redo history)
  types/        the Project/Slide/Block data model
```

## Known limitations (phase 2 ideas)

- CAD viewer supports mesh formats only (STL/OBJ/glTF/GLB) — true CAD formats (STEP/IGES) would need a WASM CAD kernel.
- Auto-fill is offline/heuristic, not AI-summarised, by design (nothing leaves the browser).
- `.pptx` export carries over position, rotation, colour (including gradients, approximated as a flat midpoint fill — pptxgenjs shapes don't support true gradients), shadow, background (including background images), and image fit for every block — text, shapes (mapped to matching native PowerPoint autoshapes per kind), images, drawings, icons, the Learning Flower, and audio/video map to native PowerPoint objects. Icons and the Flower are rasterized to a crisp PNG at export time (a real independent SVG render pass, not an approximation) rather than lost. Maths, 3D model, and website-embed blocks become a labelled placeholder (PowerPoint has no native equivalent for any of the three, and Maths would need a much heavier DOM-to-canvas dependency to rasterize faithfully). Export always uses the in-editor state directly (not a possibly-stale autosave read), so it matches what's on screen. `.pptx` *import* is still best-effort and doesn't recover the original file's layout/animations.
- The Maths tool is typed-only (LaTeX via KaTeX), not photo-to-maths OCR — real handwriting recognition needs a cloud service (e.g. Mathpix), which would mean sending student photos to a third party and breaking the app's nothing-leaves-the-browser design. A photo of maths can still be attached as a plain, un-digitised image.
- The Icon set (Font Awesome Free) is icons under CC BY 4.0 and code under MIT; the Maths renderer (KaTeX) is MIT — both bundled locally, not loaded from a CDN. See `/terms` for the full attribution.

## License

MIT — see [LICENSE](LICENSE). Bundled third-party assets (Font Awesome Free, KaTeX) keep their own licenses; see that file for details.
- Voice navigation needs an internet connection — the browser's speech recognition (`SpeechRecognition`/`webkitSpeechRecognition`) sends audio to a cloud speech service (e.g. Google's, in Chrome) to transcribe it, it isn't done on-device, so it's the one feature that won't work offline even though the rest of the app (including Present mode itself) does. The app checks `navigator.onLine` and warns before you try to enable it while offline. It can also fail with the same kind of error while genuinely online — a school/organisation network's content filter (Securly, GoGuardian, Cisco Umbrella, a proxy, etc.) blocking the specific cloud endpoint is a common cause on school wifi, and the in-app error message says so rather than just claiming "you're offline" when that's not actually why. It also always uses the browser/OS's current default microphone — there's no web API that lets a page pick a different input device, so there's no in-app microphone picker.
- Drawings are flattened to PNG, not stored as editable vector strokes.
- The "showcase a website" embed block can't fetch a page's content itself (browser CORS) — it embeds the live page in an iframe instead, which some sites block from embedding.
