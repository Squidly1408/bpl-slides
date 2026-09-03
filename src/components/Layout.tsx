import { Link, Outlet } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <header style={{ background: '#12172a' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-white">
            {/* This header's background is a fixed dark navy in both light and
                dark app theme (see the inline style above) — Logo's own default
                fill is `var(--color-primary)`, which in light mode is ALSO a
                dark navy (for use as an accent on light backgrounds elsewhere),
                so it rendered near-invisible here specifically in light mode.
                Pinned to a fixed light blue that reads clearly against this
                particular header regardless of the site theme toggle. */}
            <Logo size={32} color="#82a6dd" />
            <span>BPL Slides</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Link to="/" className="hover:underline">
              My projects
            </Link>
            <Link to="/draw" className="hover:underline">
              Whiteboard
            </Link>
            <ThemeToggle dark />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer
        className="border-t py-6 text-center text-xs"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
          <span>
            A student-built tool designed for Big Picture Learning, aligned with BPLA's Exhibition, Senior Portfolio,
            Gateway Project, and IBPLC framework — not an official BPLA product.
          </span>
          <Link to="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:underline">
            Terms &amp; Conditions
          </Link>
        </div>
      </footer>
    </div>
  )
}
