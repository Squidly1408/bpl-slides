import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// @testing-library/react only auto-cleans up after each test when it
// detects Jest's globals; under Vitest (without `test.globals: true`) that
// detection misses, so without this every component test's markup would
// pile up in the same jsdom document instead of starting from a blank one.
afterEach(cleanup)

// jsdom's Blob/File never implemented the read methods (.text(),
// .arrayBuffer()) — real browsers have for years, and app code (document
// parsing) relies on them. Polyfill via jsdom's own FileReader, which *is*
// implemented, so those code paths work the same under test as in a real
// browser.
//
// (Deliberately jsdom's FileReader, not Node's native Blob/File — swapping
// in Node's classes fixes fake-indexeddb's structured-clone handling of
// Blobs, but Node's Blob.arrayBuffer() then returns an ArrayBuffer from a
// different realm than the rest of this jsdom-sandboxed test environment,
// which fails `instanceof ArrayBuffer` checks in library code, e.g. JSZip.
// Tests that need real Blob fidelity through storage (projectFile.test.ts)
// mock lib/db instead of relying on fake-indexeddb's clone.)
if (!Blob.prototype.text) {
  Blob.prototype.text = function (this: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (this: Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}

// jsdom doesn't implement matchMedia — polyfill a "light" default so code
// that reads system theme preference (lib/theme.ts, ThemeToggle) doesn't
// throw. Individual tests override `matches` where they need dark mode.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom doesn't implement blob object URLs either — assets code (lib/db.ts)
// only needs *a* string back, never resolves it to real image data in tests.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock-url'
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {}
}
