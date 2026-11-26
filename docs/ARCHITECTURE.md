# Architecture

How BPL Slides works under the hood. Read this before making non-trivial changes.

## The one rule everything else follows

**Nothing leaves the browser.** There is no backend, no database server, no accounts, no analytics, and no CDN at runtime. Every project, uploaded file, drawing, and setting lives in the student's own browser (IndexedDB + `localStorage`). Firebase is used *only* as a static file host.

This rule is a product promise, not just an implementation detail — the [Privacy Policy](../src/pages/Privacy.tsx) and [Terms](../src/pages/Terms.tsx) pages state it to students and schools. Many design decisions below (heuristic auto-fill instead of AI, typed maths instead of photo OCR, bundled icons instead of a CDN, the project-file backup) exist because of it. **If you add anything that sends data off-device, you must update those pages and think hard about whether it's worth breaking the promise.** The single existing exception is voice navigation, which uses the browser's built-in speech recognition (cloud-backed in Chrome/Edge); it's opt-in and documented.

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 19 + TypeScript, function components and hooks |
| Build | Vite 6, `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) + CSS custom properties in [src/index.css](../src/index.css) for the light/dark app theme |
| Routing | `react-router-dom` v7 with **`HashRouter`** (URLs look like `/#/project/abc/edit`) |
| State | Zustand ([src/store/useProjectStore.ts](../src/store/useProjectStore.ts)) for the open project; local component state elsewhere |
| Storage | IndexedDB via `idb` ([src/lib/db.ts](../src/lib/db.ts)); `localStorage` for two small UI preferences |
| Offline | `vite-plugin-pwa` (Workbox `generateSW`) |
| Tests | Vitest + jsdom + Testing Library + `fake-indexeddb` |
| Lint | oxlint |
| Hosting | Firebase Hosting (static) |

Heavy, feature-specific libraries — all bundled, all client-side:

| Library | Used for |
| --- | --- |
| `pptxgenjs` | `.pptx` export ([src/lib/pptxExport.ts](../src/lib/pptxExport.ts)) |
| `jszip` | `.pptx` import parsing, project-file zip export/import |
| `mammoth` | `.docx` parsing and the Word-document preview block |
| `pdfjs-dist` | `.pdf` parsing and the PDF preview block (worker set up in [src/lib/pdfjs.ts](../src/lib/pdfjs.ts)) |
| `xlsx` (SheetJS) | `.xlsx` / `.xls` / `.ods` parsing |
| `three` | Interactive 3D mesh viewer ([src/components/MeshViewer.tsx](../src/components/MeshViewer.tsx)) |
| `katex` | Maths block rendering |
| `@fortawesome/free-*-svg-icons` | ~2,000-icon picker (rendered as inline SVG paths, no webfont) |
| `file-saver` | Triggering downloads |

## Source layout

```
src/
  main.tsx            Entry: mounts <App/> inside <HashRouter> + <StrictMode>
  App.tsx             Route table; lazy-loads the heavy pages
  index.css           Tailwind import + app-chrome CSS variables (light/dark)
  types/index.ts      The data model: Project, Slide, every Block type, Asset, SLIDE_W/H
  store/              Zustand store for the project currently open (autosave + undo/redo)
  pages/              One file per route
  components/         Canvas, panels, modals, tour engine
    blocks/           Per-block-type renderers (BlockRenderer dispatches to these)
  lib/                Framework-free logic — storage, themes, templates, parsers, export…
    parsers/          One parser per document format, all producing ParseResult
  test/setup.ts       jsdom polyfills used by every test
public/
  examples/*.pptx     Static example decks, one per industry (download links)
  icons, favicon      PWA / home-screen icons
```

Rule of thumb: **`lib/` holds logic that doesn't need React** (and is where most unit tests live); `components/` and `pages/` hold UI.

## Routes

Defined in [src/App.tsx](../src/App.tsx). Because of `HashRouter` the real URLs are prefixed with `#/`.

| Route | Page | Notes |
| --- | --- | --- |
| `/` | [Dashboard](../src/pages/Dashboard.tsx) | Project list, new-project modal (template/theme/term picker), import/duplicate/delete, first-run tour |
| `/project/:id/upload` | [UploadWork](../src/pages/UploadWork.tsx) | Drop files to auto-generate slides (lazy) |
| `/project/:id/edit` | [Editor](../src/pages/Editor.tsx) | The slide editor (lazy) |
| `/project/:id/present` | [Present](../src/pages/Present.tsx) | Fullscreen presenter — **outside** the shared `Layout` (no header) (lazy) |
| `/draw` | [Draw](../src/pages/Draw.tsx) | Standalone whiteboard; can save a drawing into a project (lazy) |
| `/privacy`, `/terms` | Privacy, Terms | Legal pages |
| `*` | NotFound | |

Every route except Present is wrapped in [Layout](../src/components/Layout.tsx) (header with logo, theme toggle, Help button, footer links). The four heavy pages are `React.lazy` code-split so the dashboard loads fast.

**Why `HashRouter`?** It makes the app work from any static host (and from `vite preview`) with no server-side rewrite rules, and keeps the service worker's offline navigation simple. Don't switch to `BrowserRouter` without also checking the PWA `navigateFallback` and the Firebase rewrite.

## Data model

All in [src/types/index.ts](../src/types/index.ts) — read that file; it's heavily commented.

```
Project
 ├─ id, title, createdAt, updatedAt
 ├─ theme?          id into THEMES, or 'custom'
 ├─ customTheme?    { primary, accent }  (only when theme === 'custom')
 └─ slides: Slide[]
      ├─ id, order, transition, background (hex), backgroundAssetId?, notes?
      └─ blocks: Block[]   (discriminated union on `type`)
           common: id, type, x, y, w, h, rotation, zIndex
           text | shape | image | video | audio | embed | mesh | drawing
           | file | icon | math | flowerGraph | grid

Asset   { id, name, mime, blob }    ← binary content, stored separately
```

Key conventions:

- **Coordinates are percentages.** A block's `x/y/w/h` are 0–100 % of the slide. The slide is a fixed 16:9 canvas of `SLIDE_W × SLIDE_H` = 1280 × 720 "authoring pixels". Because it's 16:9, a square needs `h = w × 1280/720`; use `circle()` in [lib/layouts.ts](../src/lib/layouts.ts).
- **Pixel-valued properties** (`fontSize`, `letterSpacing`, `borderWidth`) are authored against the 1280-wide canvas and multiplied by a `scale` factor at render time (on-screen width ÷ 1280). That's how the same slide renders correctly as a thumbnail, in the editor, and fullscreen.
- **Binary content never lives inside a Project.** Blocks that need a file (`image`, `video`, `audio`, `mesh`, `drawing`, `file`) and slide backgrounds hold an `assetId` pointing into the `assets` store. This keeps project saves small and fast.
- **New fields must be optional.** Students' existing projects are stored as-is with no migration step. Every field added after launch (`theme`, `customTheme`, `ShapeBlock.kind`, `gradientTo`, `shadow`, `ImageBlock.radius`, `TextBlock.href`, …) is optional, and the renderer treats "missing" as the old behaviour. Follow this pattern — see [Data compatibility](#data-compatibility).

## Storage

### IndexedDB — [src/lib/db.ts](../src/lib/db.ts)

Database `bpe-slides-db`, version `1`, two object stores (both keyed by `id`):

| Store | Value | Written by |
| --- | --- | --- |
| `projects` | `Project` (JSON-like, no blobs) | `saveProject()` — stamps `updatedAt` on every write |
| `assets` | `Asset` (`Blob` + metadata) | `putAsset()` — uploads, drawings, parsed images, imports |

- `deleteProject()` also deletes that project's assets, **unless another project still references them** (duplicated projects share asset ids).
- `getAssetUrl()` memoises one `blob:` object URL per asset id for the life of the page, so re-renders don't leak URLs. Components use the `useAssetUrl()` hook in [lib/hooks.ts](../src/lib/hooks.ts).
- The `bpe-` prefix is historical (the app's working name) — **don't rename the DB or keys**, or every student loses their projects.

### localStorage

| Key | Purpose | Code |
| --- | --- | --- |
| `bpe-theme` | App chrome light/dark preference (`light` / `dark`; absent = follow OS) | [lib/theme.ts](../src/lib/theme.ts), plus an inline pre-paint script in [index.html](../index.html) — keep them in sync |
| `bpe-tutorial-seen-<tourId>` | `"1"` once a guided tour has been shown (`dashboard`, `editor`) | [lib/tutorial.ts](../src/lib/tutorial.ts) |

All `localStorage` access is wrapped in `try/catch` (it throws in some private-browsing modes).

### Backups — project files

Because storage is per-browser, students can lose work by clearing site data or switching devices. [lib/projectFile.ts](../src/lib/projectFile.ts) is the mitigation:

- **Export** writes `<title>.BPL-Slides.zip` containing `project.json`, `manifest.json` (asset id → name/mime) and `assets/<id>` blobs.
- **Import** restores it under **fresh ids** for the project and every asset (remapping all `assetId` references), so importing never overwrites or collides with existing work.

Treat this zip layout as a public file format: old exports must keep importing.

## Editor state — [src/store/useProjectStore.ts](../src/store/useProjectStore.ts)

The project being edited lives in a single Zustand store. Pages read it with selectors; all mutations go through store actions (`addBlock`, `updateBlock`, `insertSlide`, `setProjectTheme`, …). Every mutation:

1. **Records undo history** (`recordHistory`) — snapshots the whole `Project` onto `past` (max 60). Edits arriving within **700 ms** of each other are coalesced into one undo step, so a drag or a typed sentence undoes in one go.
2. **Replaces the project immutably** — new `slides`/`blocks` arrays; never mutate in place (history snapshots share structure).
3. **Schedules an autosave** — debounced **500 ms** write to IndexedDB; `saving` is exposed for the "Saving…" indicator.

Because autosave is debounced, **anything that needs the latest state (export, present) must read from the store, not from IndexedDB.** `exportProjectToPptx(project)` and `exportProjectFile(project)` take the in-memory `Project` for exactly this reason.

`loadProject`/`setProject` call `seedZCounterFromSlides()` ([lib/blocks.ts](../src/lib/blocks.ts)) so newly added blocks get a z-index above everything already on the slide.

## Rendering slides

```
Editor / Present / thumbnails
        │
        ▼
  SlideStage  ── sizes a 16:9 box to fit its container (useContainedSize),
        │        computes scale = width / 1280, positions each block by %,
        │        and in edit mode handles select / drag / resize / rotate,
        │        alignment snapping & guides, and touch input
        ▼
  BlockRenderer ── switch (block.type) → the visual for that block
        │
        ├─ blocks/GridBlockContent, IconBlockContent, MathBlockContent,
        │  FlowerGraphBlock, FileBlockContent
        └─ MeshViewer (three.js), <img>, <video>, <audio>, <iframe>, text
```

- [SlideStage](../src/components/SlideStage.tsx) is the one canvas used everywhere; `interactive`/edit props switch between editing, presenting, and static thumbnail use.
- [BlockRenderer](../src/components/blocks/BlockRenderer.tsx) is read-only visuals only. Editing UI for a block's properties lives in [BlockPropertiesPanel](../src/components/BlockPropertiesPanel.tsx).
- Shapes other than rectangles use CSS `clip-path` polygons from [lib/shapes.ts](../src/lib/shapes.ts).
- Transitions are CSS classes chosen by [lib/transitions.ts](../src/lib/transitions.ts).
- Editor keyboard shortcuts (in `Editor.tsx`): Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z or Ctrl/⌘+Y redo, Ctrl/⌘+D duplicate, Delete/Backspace remove, arrow keys nudge. Shortcuts are ignored while typing in an input ([lib/dom.ts](../src/lib/dom.ts) `isEditableTarget`).
- Present mode keys: → / Space / PageDown next, ← / PageUp back, D toggles the pen overlay, Esc exits to the editor. Clicking the outer 12 % of either side also navigates. A pen annotation can be saved onto the slide as a full-slide `drawing` block.

## Themes and the slide "design system"

Two separate theme concepts — don't confuse them:

1. **App theme** (light/dark) — the site's own chrome. CSS variables in [index.css](../src/index.css) switched by `data-theme` on `<html>`. See [lib/theme.ts](../src/lib/theme.ts) and [ThemeToggle](../src/components/ThemeToggle.tsx).
2. **Project colour theme** — the palette a deck's slides are drawn in. Defined in [lib/themes.ts](../src/lib/themes.ts) as five roles: `primary`, `primaryDark`, `accent`, `surfaceTint`, `onPrimary`. There are 10 presets, plus `custom`, where the student picks primary + accent and the rest is derived ([lib/color.ts](../src/lib/color.ts)).

**Re-theming works by colour substitution.** [lib/applyTheme.ts](../src/lib/applyTheme.ts) maps each of the old theme's five exact hex values to the new theme's, across slide backgrounds and text/shape colours. Anything the student coloured by hand (not one of the five palette values) is left alone. The consequence: **generated slides must only use colours from the `Theme` object** (or neutral greys/white), or they won't recolour.

The design system is layered:

| Layer | File | What it provides |
| --- | --- | --- |
| Block factories | [lib/blocks.ts](../src/lib/blocks.ts) | `makeTextBlock`, `makeShapeBlock`, … `makeSlide` — every block is created through these (sane defaults, fresh id, next z-index) |
| Geometry helpers | [lib/layout.ts](../src/lib/layout.ts), `circle()` in layouts.ts | `gridLayout()` splits a region into cells |
| Slide layouts | [lib/layouts.ts](../src/lib/layouts.ts) | Composed slides taking a `Theme`: `heroSlide`, `bulletSlide`, `coverSlide`, `gridCardSlide`, `iconGridSlide`, `flowerSlide`, `statSlide`, `evidenceSlide`, `timelineSlide`, `stackedSlide`, `minimalSlide`, `closingSlide`. `CONTENT_STYLES` is the list behind the editor's one-click "Redesign" |
| Templates | [lib/templates.ts](../src/lib/templates.ts) | Whole decks: Exhibition, Senior Portfolio, Gateway, Normal, Blank. Plus standalone `ibplcSlide()` / `internshipSlide()` used by the editor's quick-insert buttons. `TEMPLATE_OPTIONS` + `createProjectFromTemplate()` drive the new-project modal |
| Industry packs | [lib/industries.ts](../src/lib/industries.ts), [lib/industryMotifs.ts](../src/lib/industryMotifs.ts) | 10 industries × 3 slides each, with a decorative motif per industry and a link to a static example deck in `public/examples/` |
| BPL domain data | [lib/flowerData.ts](../src/lib/flowerData.ts), `LEARNING_GOALS` in templates.ts | The real Learning Flower artwork, colours and level descriptors; the six Learning Goals |

`term.ts` produces the default "Term N YYYY" label for new projects.

## Auto-fill pipeline (Upload Work)

Turns a student's existing files into slides, entirely offline and heuristic (no AI, by design).

```
File ──► UploadWork.processFile()
          ├─ image/* | video/* | audio/* | .stl/.obj/.glb/.gltf
          │      └─► putAsset() + one slide with a single media block
          └─ document? detectDocumentKind()  (lib/parsers/index.ts)
                 └─► parseDocument(file) ──► ParseResult
                        docx.ts  (mammoth → HTML → headings/paras/bullets/tables)
                        pptx.ts  (jszip → slide XML text + images)
                        pdf.ts   (pdf.js → positioned text → reading-order lines)
                        xlsx.ts  (SheetJS → one draft per sheet, as a grid)
                        text.ts  (.txt / .md)
                     └─► draftsToSlides(result, themeId)   (lib/draftsToSlides.ts)
                            • every paragraph/bullet → one bullet line
                            • max 6 items per slide, overflow paged "(1/2)"
                            • images stored as assets, laid out with gridLayout
                            • each grid → its own slide with a table block
                     └─► slides appended to the project
```

The contract between the two halves is `ParseResult` in [lib/parsers/types.ts](../src/lib/parsers/types.ts): `{ slides: ParsedSlideDraft[], warnings: string[] }`, where a draft is `{ heading?, paragraphs, bullets, images, grids? }`. Parsers only extract and clean up; they never build blocks. That keeps each parser unit-testable and means layout changes happen in one place.

Hard-won parsing fixes worth knowing about before you touch the parsers (each has tests): PDF multi-column text re-ordered by position; bullet lists that extract as one run-on string split back into items; manual line breaks (`<br>` / Shift+Enter) preserved instead of gluing words together; Word tables turned into grids instead of jumbled text; sheets capped at 15 rows × 8 columns with a warning.

## Export and import

- **`.pptx` export** — [lib/pptxExport.ts](../src/lib/pptxExport.ts) walks the in-memory project and maps each block to a native PowerPoint object: text → text box, shape → matching autoshape (gradients approximated as a flat midpoint colour), image/drawing → picture, video/audio → media, grid → native table, icon & Learning Flower → rasterised to PNG via an off-screen SVG→canvas pass. Embed, mesh, file and maths blocks become labelled placeholders (no PowerPoint equivalent). Percent coordinates are converted to inches on a 13.33″ × 7.5″ slide.
- **`.pptx` import** is just the auto-fill pptx parser — text and images only, not layout.
- **Project file** export/import — see [Backups](#backups--project-files).

## Offline / PWA

Configured in [vite.config.ts](../vite.config.ts):

- `registerType: 'autoUpdate'` with Workbox `generateSW`; the whole build (`js, mjs, css, html, png, svg, woff2…`) is precached on first visit (~7 MB, mostly the icon set, three.js and the pdf.js worker).
- `.mjs` is explicitly included and `maximumFileSizeToCacheInBytes` raised to 6 MB — **required** for the pdf.js worker, otherwise PDF auto-fill silently breaks offline.
- [UpdatePwaToast](../src/components/UpdatePwaToast.tsx) shows "ready to work offline" on first install and a **Refresh** button when a new deploy has been downloaded in the background.
- The service worker is only generated by `npm run build`; `npm run dev` never registers one.

**Code splitting.** `manualChunks` forces Font Awesome and three.js into their own chunks so adding an icon doesn't download the 3D viewer and vice versa. The Vite "chunk larger than 500 kB" warning for these two is expected.

## Guided tours

[components/Coachmarks.tsx](../src/components/Coachmarks.tsx) is a small spotlight-tour engine. A page defines a `CoachStep[]` whose `target` names one or more `data-tour="…"` attributes on real elements; the engine spotlights the first one that's actually visible (so a step can point at a desktop panel *or* its mobile drawer button) and skips steps with nothing on screen. Each page subscribes to the header Help button through the tiny pub/sub in [lib/tutorial.ts](../src/lib/tutorial.ts). Tours exist on the Dashboard and Editor.

## Data compatibility

Students' work is stored in their browsers and can't be migrated server-side, and project files may be imported years later. So:

- **Never remove or rename** a field on `Project`, `Slide`, or any block type, or change its meaning.
- **Add new fields as optional** and handle `undefined` as "old behaviour" in every renderer, the properties panel, and `pptxExport`.
- **Never rename** the IndexedDB database/stores or the `localStorage` keys.
- If a breaking change is ever unavoidable, bump the `openDB` version in `db.ts` and write an `upgrade` migration, **and** add the same migration to `importProjectFile` for old zip exports.
