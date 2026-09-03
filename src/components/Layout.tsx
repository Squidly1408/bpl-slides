import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import TutorialModal from './TutorialModal'
import { IconHelp } from './icons'
import { hasSeenTutorial } from '../lib/tutorial'

export default function Layout() {
  const [showTutorial, setShowTutorial] = useState(false)

  // Auto-open once, the first time anyone lands in the app in this browser.
  useEffect(() => {
    if (!hasSeenTutorial()) setShowTutorial(true)
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      <header style={{ background: '#12172a' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-white">
            <Logo size={32} />
            <span>BPL Slides</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Link to="/" className="hover:underline">
              My projects
            </Link>
            <Link to="/draw" className="hover:underline">
              Whiteboard
            </Link>
            <button
              onClick={() => setShowTutorial(true)}
              title="How this works"
              aria-label="How this works"
              className="flex h-8 w-8 items-center justify-center rounded-md border"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)' }}
            >
              <IconHelp size={16} />
            </button>
            <ThemeToggle dark />
          </nav>
        </div>
      </header>
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
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
