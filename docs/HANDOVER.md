# Handover

Start here if you're taking over BPL Slides. It covers the project's current state, what has to be transferred, what's known to be rough, and what to do first.

## What this is

A browser-only slideshow builder for Big Picture Learning students. They build a term's exhibition deck from BPLA-aligned templates, auto-fill it from their existing work, and present or export it. There is **no backend**: all data stays in the student's browser, and Firebase Hosting just serves static files. It's student-built and aligned to Big Picture Learning Australia's framework, but **not an official BPLA product**.

- Feature list and user-facing limitations: [README.md](../README.md)
- How it works: [ARCHITECTURE.md](ARCHITECTURE.md)
- How to change it: [DEVELOPMENT.md](DEVELOPMENT.md)
- How to ship it: [DEPLOYMENT.md](DEPLOYMENT.md)

## State at handover (November 2026)

| | |
| --- | --- |
| Version | `0.1.0` (package.json). No formal release tags yet. |
| Branch | `master` is the only branch and is what's deployed. |
| Tests | 21 files, **193 tests, all passing** (`npm run test:run`) |
| Build | Passes (`npm run build`), with the expected large-chunk warning |
| Lint | 0 errors, 4 known warnings (see below) |
| CI | **None.** Tests/lint/build are run by hand before deploying. |
| Hosting | Firebase Hosting, project `bpl-slides` |
| Repo | `github.com/Squidly1408/bpl-slides` |

All features listed in the README are implemented and working.

## Transfer checklist

Work through these with the outgoing maintainer (Lucas Newman):

- [ ] **Licence / permission.** The code is "All rights reserved" ([LICENSE](../LICENSE)): nobody may use, modify, or host it without the copyright holder's written consent. Agree in writing what the new maintainer or organisation is allowed to do, or replace the LICENSE with the agreed terms. Do this first; everything else depends on it.
- [ ] **GitHub.** Transfer the repository to the new owner or organisation (Settings → Transfer), or add the new maintainer as an admin. If the URL changes, update the clone URL in [DEVELOPMENT.md](DEVELOPMENT.md).
- [ ] **Firebase.** Add the new owner to the `bpl-slides` Firebase/Google Cloud project as Owner, confirm they can `firebase deploy`, then decide whether the previous owner should be removed. Check the billing account (Hosting on the free Spark plan needs none).
- [ ] **Custom domain** (if one is configured in Firebase Hosting): transfer DNS/registrar access too.
- [ ] **Privacy Policy & Terms.** [Privacy.tsx](../src/pages/Privacy.tsx) and [Terms.tsx](../src/pages/Terms.tsx) give a hard-coded contact email for privacy questions and complaints (Privacy §10, Terms §14). If the operator changes, replace it with a mailbox the new owner monitors, review the wording, bump the `updated` date, and redeploy. An address students and schools write to shouldn't go unanswered.
- [ ] **Example decks** in `public/examples/`: confirm the new owner has the rights to keep distributing them.
- [ ] **Do a practice release** to a preview channel (`firebase hosting:channel:deploy preview`) to prove the whole loop works for the new maintainer.

## Your first hour

```bash
git clone https://github.com/Squidly1408/bpl-slides.git && cd bpl-slides
npm ci
npm run test:run        # expect 193 passing
npm run dev             # click around: create a project, edit, present
```

Then read [ARCHITECTURE.md](ARCHITECTURE.md), especially [the one rule](ARCHITECTURE.md#the-one-rule-everything-else-follows) and [data compatibility](ARCHITECTURE.md#data-compatibility). Those two sections are where a well-meaning change could do real damage: breaking a privacy promise, or wiping out students' saved projects.

## Things that must not break

1. **Students' saved projects.** They live only in each student's browser. Renaming the IndexedDB database (`bpe-slides-db`), a store, a `localStorage` key, or a data-model field, or making a new field required, can make existing work disappear or crash on load. There is no server copy to restore from.
2. **Old project files** (`.BPL-Slides.zip`) must keep importing.
3. **No data leaves the device.** This is promised in the Privacy Policy. Adding analytics, error reporting, a CDN, or a cloud API changes that promise and requires updating the policy (and probably talking to the schools using it).
4. **The `/sw.js` no-cache header** in `firebase.json`. Without it, users can get stuck on an old version.

## Known issues

Ordered roughly by how much they matter:

1. **Orphaned media accumulates in IndexedDB.** Assets are only deleted when a whole project is deleted ([db.ts](../src/lib/db.ts) `deleteProject`). Deleting a block or slide, replacing a background image, or re-editing a drawing ([DrawingBlockEditorModal.tsx](../src/components/DrawingBlockEditorModal.tsx) saves a *new* asset each time) leaves the old blob behind forever. `deleteAsset()` exists but nothing calls it. Heavy video users could slowly fill their browser storage quota.
   *Suggested fix:* a garbage-collection sweep on Dashboard load. Delete assets referenced by no saved project. Don't delete on block removal directly: undo can bring the block back. Add tests in `db.test.ts`.
2. **Browser storage can be evicted.** The app doesn't call `navigator.storage.persist()`, so under storage pressure (and especially in Safari after 7 days without a visit) a browser may clear a student's projects. The project-file download is the only backup.
   *Suggested fix:* request persistent storage after a project is first created, and nudge students to download a backup before exhibition day.
3. **`npm audit` findings.** Most are in dev-only tooling (Vitest, Vite dev server, build plugins) and don't ship to users. Run `npm audit fix` and re-test. Some need major-version bumps (`--force`), so do those deliberately, one at a time. The notable runtime one is **`xlsx` (SheetJS) 0.18.5**: high-severity prototype-pollution/ReDoS advisories, and no fixed version on npm because SheetJS stopped publishing there. Real-world risk is low (it only parses files the student chooses, locally, and nothing else in the page is reachable). The fix is to install a current build from SheetJS's own CDN (`npm i https://cdn.sheetjs.com/xlsx-<version>/xlsx-<version>.tgz`) and re-run `xlsx.test.ts`.
4. **No CI.** Adding a GitHub Actions workflow that runs `npm ci && npm run test:run && npm run lint && npm run build` on pushes and PRs is a ~20-line job and the cheapest safety net available.
5. **Lint warnings:** four `react(set-state-in-effect)` warnings (`Dashboard.tsx:53,57`, `Editor.tsx:160,170`). These are effects that load data or decide whether to show the first-run tour. They work correctly; they could be refactored to initialise state directly.
6. **`Editor.tsx` is large** (~850 lines: all add-block handlers, the settings panel, toolbar and drawers). It works, but it's the file most likely to cause merge pain. Splitting the settings panel and add-block handlers into their own modules would be a good first refactor.
7. **Big lazy chunks.** The Font Awesome (~1.5 MB) and three.js (~640 kB) chunks are lazy-loaded and precached for offline use, so this is intentional. If first-visit size ever matters (slow school networks), subsetting the icon set is the biggest win.

User-facing limitations (`.pptx` fidelity, typed-only maths, voice nav needing internet and not working in Brave, etc.) are documented in the README's *Known limitations* section. Most are deliberate trade-offs that preserve the no-server design. Read the reasoning there before "fixing" them.

## Suggested roadmap

Short term, low risk: fix known issues 1–4 above.

Ideas already raised (from the README's "phase 2" list):

- Editable vector drawings instead of flattened PNGs.
- True CAD formats (STEP/IGES) via a WASM CAD kernel.
- Better `.pptx` import that keeps layout.
- Subsetting the icon set for a lighter first load.

Anything requiring a server (accounts, cloud sync, sharing links, AI summarisation, handwriting OCR) is a fundamental change to the product's privacy model, not a feature add. Treat it as a decision for the schools and BPLA, not just an engineering task.
