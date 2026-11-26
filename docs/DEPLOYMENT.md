# Deployment

BPL Slides is a static site: `npm run build` produces `dist/`, and anything that serves files can host it. It's currently hosted on **Firebase Hosting**, Firebase project id `bpl-slides` (see [.firebaserc](../.firebaserc)). Its default URLs are `https://bpl-slides.web.app` and `https://bpl-slides.firebaseapp.com`, plus any custom domain configured in the Firebase console.

No other Firebase product is used (no Firestore, Auth, Functions, or Analytics), so there's no backend to deploy, configure, or pay for beyond static hosting.

## Prerequisites (one-time)

```bash
npm install -g firebase-tools
firebase login
firebase projects:list   # you should see bpl-slides
```

You need at least the **Firebase Hosting Admin** role (or Editor/Owner) on the `bpl-slides` Google Cloud project. Ask the current owner to add you under Firebase console → Project settings → Users and permissions.

## Releasing

```bash
git checkout master && git pull
npm ci
npm run test:run && npm run lint
npm run build                       # writes dist/ and dist/sw.js
npm run preview                     # optional: smoke-test the real build locally
firebase deploy --only hosting
```

The deploy prints the live URL when it finishes. Then:

1. Open the live site in a normal tab. Users who already have the app see the **"A new version is ready — Refresh"** toast on their next visit (see below).
2. Run the offline check from the [manual test checklist](DEVELOPMENT.md#manual-test-checklist) against the live URL.

To test a release on a temporary URL before it goes live:

```bash
firebase hosting:channel:deploy preview --expires 7d
```

## What `firebase.json` does

| Setting | Why |
| --- | --- |
| `"public": "dist"` | Serve the Vite build output. |
| Rewrite `**` → `/index.html` | SPA fallback. With `HashRouter` this mostly covers direct hits on `/` and the PWA `start_url`; it's harmless to keep. |
| `**/*.@(js\|mjs\|css\|woff2)` → `Cache-Control: public, max-age=31536000, immutable` | Vite fingerprints these filenames (`index-AbC123.js`), so they can be cached forever. |
| `/sw.js` → `Cache-Control: no-cache` | **Critical.** Browsers must re-check the service worker on every visit, or users get stuck on an old version. Don't remove this. |

If you ever move hosts, reproduce those two cache rules. Never cache `sw.js` long-term, and `index.html` must not be cached `immutable` either.

## How updates reach users

The app is a PWA with a precaching service worker (`vite-plugin-pwa`, `registerType: 'autoUpdate'`):

1. A returning user loads the cached app instantly, even offline.
2. In the background the browser fetches `sw.js`, sees a new precache manifest, and downloads the new build.
3. [UpdatePwaToast](../src/components/UpdatePwaToast.tsx) shows **"A new version is ready" → Refresh**, which activates the new worker and reloads.

Students' projects are in IndexedDB, which is separate from the service-worker cache, so updates never touch their work. That only holds if you follow the [data compatibility rules](ARCHITECTURE.md#data-compatibility).

## Rollback

Firebase keeps previous releases. In the Firebase console → Hosting → release history, open the menu on the last good release → **Rollback**. Alternatively, check out the last good commit and deploy it again.

Rolled-back code reaches users through the same Refresh toast. If the bad release changed the stored data shape (it shouldn't; see the compatibility rules), rolling back the code won't undo data already written by it.

## Hosting elsewhere

Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages, a school web server). Requirements:

- Serve `dist/` at the **domain root**. The PWA manifest uses `start_url: '/'` and `scope: '/'`, and assets use absolute paths. Serving from a sub-path (e.g. `school.edu/bpl-slides/`) needs Vite's `base` option and the manifest `start_url`/`scope` changed to match.
- HTTPS (required for service workers, except on `localhost`).
- The cache headers described above.
