# Development guide

Everything you need to change BPL Slides safely. Read [ARCHITECTURE.md](ARCHITECTURE.md) first for the big picture.

## Setup

Prerequisites: **Node 20+** (developed on 20.12) and npm. Nothing else: no database, env vars, or API keys.

```bash
git clone https://github.com/Squidly1408/bpl-slides.git
cd bpl-slides
npm ci             # exact versions from package-lock.json
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload. **No service worker**, so offline behaviour isn't testable here. |
| `npm run build` | `tsc -b` (type-checks app **and** test files) then `vite build` → `dist/` + `dist/sw.js` |
| `npm run preview` | Serves `dist/` locally. Use this to test offline/PWA behaviour and anything code-split. |
| `npm test` | Vitest in watch mode |
| `npm run test:run` | Vitest once (what you'd run before committing / in CI) |
| `npm run test:ui` | Vitest browser UI |
| `npm run lint` | oxlint (config in [.oxlintrc.json](../.oxlintrc.json)) |

**Before every commit:** `npm run test:run && npm run lint && npm run build`. The build matters because it's the only step that type-checks. Vitest strips types without checking them.

Expected noise, not errors:

- `vite build` warns that the `fontawesome` and `three` chunks are over 500 kB. That's intentional (they're lazy-loaded; see [ARCHITECTURE.md](ARCHITECTURE.md#offline--pwa)).
- oxlint reports 4 `set-state-in-effect` warnings in `Dashboard.tsx` / `Editor.tsx`. They're known and harmless. See [HANDOVER.md](HANDOVER.md#known-issues).

## Testing

- Tests are colocated: `foo.ts` → `foo.test.ts`. 21 files and 193 tests as of handover.
- Environment: jsdom, configured in [vitest.config.ts](../vitest.config.ts) (deliberately separate from `vite.config.ts` so the PWA/Tailwind plugins don't run under test).
- [src/test/setup.ts](../src/test/setup.ts) installs `fake-indexeddb`, RTL cleanup, and polyfills jsdom lacks: `Blob.text/arrayBuffer`, `matchMedia`, `URL.createObjectURL`. Read its comments before fighting a weird Blob/ArrayBuffer test failure.
- Most coverage is on `lib/` (pure logic: parsers, themes, layout, blocks, project file, speech) and the Zustand store. Component tests use Testing Library + `user-event` (Coachmarks, Layout, ThemeToggle, Logo).
- **Parser tests don't check in binary fixtures.** `xlsx.test.ts` builds workbooks in code with SheetJS; `docx.test.ts` mocks `mammoth` and feeds `parseDocx` HTML captured from mammoth's real output, so it tests this app's own HTML-walking logic. Keep doing that: each test documents exactly what input triggers its edge case.
- `projectFile.test.ts` mocks `lib/db` instead of relying on fake-indexeddb, because jsdom/fake-indexeddb don't round-trip Blobs faithfully.
- Not covered by automated tests: the canvas drag/resize interactions, `.pptx` export output, the 3D viewer, and the PWA. Check those by hand in `npm run preview` (see the [manual test checklist](#manual-test-checklist)).

## Code conventions

- **TypeScript everywhere**, type-checked by `npm run build` (unused locals/parameters and switch fallthrough are errors; see [tsconfig.app.json](../tsconfig.app.json)). Function components and hooks; no class components.
- **Create blocks and slides only through the factories** in [lib/blocks.ts](../src/lib/blocks.ts) (`makeTextBlock`, `makeSlide`, …). They assign ids, z-index, and defaults.
- **Mutate the open project only through store actions** in [useProjectStore.ts](../src/store/useProjectStore.ts), which handle undo history and autosave. Never mutate `project`/`slides`/`blocks` in place.
- **Generated slides use only `Theme` colours** (`theme.primary`, `.primaryDark`, `.accent`, `.surfaceTint`, `.onPrimary`) or neutrals. Otherwise theme switching can't recolour them.
- **Styling:** Tailwind utility classes for layout; app-chrome colours come from CSS variables (`var(--color-primary)`, `var(--color-surface)`, `var(--color-border)`, `var(--color-text-muted)`, …) defined in [index.css](../src/index.css) for both light and dark. Don't hard-code chrome colours, or dark mode breaks.
- **Responsive:** the editor switches to drawers below Tailwind's `lg` breakpoint. Check new UI on a phone-width viewport.
- **Comments explain *why*.** The codebase has long "why this exists / what broke before" comments. Keep them accurate when you change the code they describe.
- **Data compatibility rules** (optional new fields, never rename storage keys) are in [ARCHITECTURE.md](ARCHITECTURE.md#data-compatibility). They're the most important convention in the repo.
- **No network calls.** See the [one rule](ARCHITECTURE.md#the-one-rule-everything-else-follows).

## Recipes

### Add a new block type

The Table/Grid block (commit `d1c6007`) is a complete, recent worked example. `git show d1c6007` shows every file touched.

1. **Model**: [src/types/index.ts](../src/types/index.ts): add the name to `BlockType`, define `interface FooBlock extends BlockBase { type: 'foo'; … }`, and add it to the `Block` union. If it stores a file, give it an `assetId: string` field. Asset cleanup and project-file export find assets by the presence of `assetId`, so that's all they need.
2. **Factory**: [src/lib/blocks.ts](../src/lib/blocks.ts): `makeFooBlock(…, partial)` following the existing pattern (`id: createId()`, `zIndex: nextZ()`, defaults, then `...partial`). Add a test in `blocks.test.ts`.
3. **Renderer**: create `src/components/blocks/FooBlockContent.tsx` and add a `case 'foo'` to [BlockRenderer.tsx](../src/components/blocks/BlockRenderer.tsx). Multiply any pixel sizes by `scale`.
4. **Properties panel**: add a section for `block.type === 'foo'` in [BlockPropertiesPanel.tsx](../src/components/BlockPropertiesPanel.tsx), calling `updateBlock(slideId, block.id, patch)`.
5. **Add menu**: add an `onAddFoo` handler to `AddBlockHandlers` and an entry for both variants (`rail` desktop and `grid` mobile) in [AddBlockMenu.tsx](../src/components/AddBlockMenu.tsx). Add an icon to [components/icons.tsx](../src/components/icons.tsx).
6. **Editor wiring**: in [Editor.tsx](../src/pages/Editor.tsx), write `handleAddFoo()` (create with the factory, `addBlock(currentSlide.id, block)`, select it) and register it in `addBlockHandlers`.
7. **PowerPoint export**: add an `else if (block.type === 'foo')` branch in [pptxExport.ts](../src/lib/pptxExport.ts). Map it to a native object if one exists; otherwise rasterise it (like icons) or emit a labelled placeholder (like mesh). Don't let it silently vanish.
8. **Theming (optional)**: if its colour should follow theme switches, handle it in [applyTheme.ts](../src/lib/applyTheme.ts).
9. **Docs**: update the README feature list and the block list in ARCHITECTURE.md.

### Add a colour theme

Append `{ id, name, primary, primaryDark, accent, surfaceTint, onPrimary }` to `THEMES` in [lib/themes.ts](../src/lib/themes.ts). Ids must be unique and **must never change once shipped**: projects store the id. Check white text on `primary` and `primaryDark` text on white/`surfaceTint` for contrast (aim for WCAG AA, 4.5:1). Every theme's hex values must be distinct from each other within that theme, or `applyThemeToProject`'s colour substitution becomes ambiguous.

### Add a slide layout / "Redesign" style

Write a function in [lib/layouts.ts](../src/lib/layouts.ts) that takes a `Theme` and returns a `Slide` built from block factories. To offer it in the editor's one-click Redesign, add `{ id, name, build }` to `CONTENT_STYLES` (signature `(theme, heading, bullets) => Slide`). Industry packs reference these ids too.

### Add a template

In [lib/templates.ts](../src/lib/templates.ts):

1. Write `createFooTemplate(opts: TemplateOptions): Project`, composing slides from `layouts.ts` with `getTheme(opts.themeId, opts.customTheme)`. Copy an existing template for the project skeleton (id, title, timestamps, `theme`, `customTheme`).
2. Add `'foo'` to the `TemplateId` union.
3. Add `{ id: 'foo', name, description }` to `TEMPLATE_OPTIONS` (this drives the new-project modal).
4. Add `case 'foo'` to `createProjectFromTemplate`. TypeScript will flag the switch if you forget.

Use real BPLA terminology. Templates are deliberately aligned to Big Picture Learning Australia's published framework (Learning Goals, Exhibition, LTI, IBPLC).

### Add an industry pack

1. Add an entry to `INDUSTRIES` in [lib/industries.ts](../src/lib/industries.ts): `id`, `name`, `icon` (emoji), `style` (an id from `CONTENT_STYLES`; vary it so packs don't all look the same), `overview` bullets, four `skills`, and `exampleFile`.
2. Put the example deck at `public/examples/<id>.pptx` (it's served as a static download, not parsed).
3. Optionally add a decorative motif under the same id in `MOTIFS` in [lib/industryMotifs.ts](../src/lib/industryMotifs.ts). A missing motif just renders nothing.

### Support a new document format for auto-fill

1. Create `src/lib/parsers/foo.ts` exporting `parseFoo(file: File): Promise<ParseResult>`. Only extract content into `ParsedSlideDraft`s (`heading`, `paragraphs`, `bullets`, `images`, `grids`) and push human-readable `warnings`. Don't build blocks; `draftsToSlides` does layout.
2. In [lib/parsers/index.ts](../src/lib/parsers/index.ts): add to `DocumentKind`, `detectDocumentKind` (by extension), `parseDocument`'s switch, and the error message listing supported types.
3. Update the supported-types copy in [UploadWork.tsx](../src/pages/UploadWork.tsx) (both the page text and `processFile`'s error message) and the README.
4. Write `foo.test.ts`, building input in code or mocking the library (see [Testing](#testing)).
5. If the parsing library is large, import it inside the parser so it stays in the lazily-loaded UploadWork chunk.

### Add a guided-tour step

Put `data-tour="my-thing"` on the element (and on its mobile counterpart, if there is one), then add `{ target: ['my-thing', 'my-thing-mobile'], title, body, placement }` to the page's `TOUR_STEPS` array (`Dashboard.tsx` or `Editor.tsx`). Steps whose targets aren't visible are skipped automatically. To force existing users to see a revised tour, change the page's `TOUR_ID` (e.g. `'editor'` → `'editor-v2'`).

### Change the Privacy Policy or Terms

They're plain JSX in [pages/Privacy.tsx](../src/pages/Privacy.tsx) and [pages/Terms.tsx](../src/pages/Terms.tsx). Update them whenever you change what data the app handles, add a third-party library with attribution requirements, or change who operates the service. Bump the `updated="…"` prop passed to `<LegalPage>` at the top of each file (it renders the "Last updated" line).

## Manual test checklist

Run through this in `npm run build && npm run preview` before a release. It covers what automated tests don't.

- [ ] Create a project from each template; switch theme (preset and custom) and confirm the whole deck recolours.
- [ ] Editor: add one of each block type; drag, resize, rotate, snap; undo/redo; duplicate; delete; reorder slides.
- [ ] Reload the page: everything persisted.
- [ ] Upload Work: one `.docx`, `.pptx`, `.pdf`, `.xlsx`, image, and `.stl`.
- [ ] Export `.pptx` and open it in PowerPoint (or Google Slides/Keynote).
- [ ] Download project file → delete project → import file → identical, including media.
- [ ] Present: keyboard, click zones, pen overlay (D), save annotation, Esc.
- [ ] Offline: load once, then DevTools → Network → Offline → reload. App, editing, presenting, PDF auto-fill and export still work.
- [ ] Phone-width viewport: editor drawers, tours, canvas sizing.
- [ ] Light and dark app theme.
