import { useState } from 'react'
import Modal from './Modal'
import Logo from './Logo'
import { markTutorialSeen } from '../lib/tutorial'
import { IconDownload, IconPlay, IconPlus, IconShape, IconUpload } from './icons'

interface Step {
  icon: React.ReactNode
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: <Logo size={40} />,
    title: 'Welcome to BPL Slides 👋',
    body: "Build an Exhibition, Senior Portfolio, Gateway Project, or any presentation — entirely in this browser. Nothing you make is ever uploaded anywhere, and there's no account to set up. This is a 30-second tour of the basics.",
  },
  {
    icon: <IconPlus size={22} />,
    title: 'Start from a template',
    body: 'From My projects, hit + New project and pick a template — Exhibition, Senior Portfolio, Gateway Project, or a blank Normal Presentation. Choose a colour theme, and optionally drop in a set of ready-made slides for your industry area.',
  },
  {
    icon: <IconUpload size={22} />,
    title: 'Or turn your existing work into slides',
    body: 'Already got a Word doc, PDF, PowerPoint, or some photos? Use Upload work to auto-fill a deck from it — headings become slide titles, paragraphs and bullet points become clean slide text, images get laid out automatically. All done on-device.',
  },
  {
    icon: <IconShape size={22} />,
    title: 'Make it yours',
    body: 'In the editor, drag, resize, and rotate any block — text, shapes, images, icons, maths, 3D models, even the real Learning Flower. Stuck on a layout? Redesign gives a slide a fresh look in one click. Ctrl+Z undoes anything.',
  },
  {
    icon: <IconPlay size={22} />,
    title: 'Present when you’re ready',
    body: "Present goes fullscreen — advance with the arrow keys, a click, or your voice (“next” / “back”). A pen tool lets you annotate live over any slide.",
  },
  {
    icon: <IconDownload size={22} />,
    title: 'Back it up, hand it in',
    body: "Export to a real .pptx to hand in or present from PowerPoint, or download a project file to move a project to another browser or device. Come back to this tour any time from the ? Help button.",
  },
]

/**
 * First-time-user walkthrough — a short, skippable slideshow-about-the-
 * slideshow-app, covering the basics (templates, auto-fill, editing,
 * presenting, backing up). Shown automatically once (see lib/tutorial.ts),
 * and reachable afterwards from the Help button in the header (Layout.tsx).
 */
export default function TutorialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const current = STEPS[step]

  function finish() {
    markTutorialSeen()
    onClose()
  }

  return (
    <Modal title="How BPL Slides works" onClose={finish} width={480}>
      <div className="flex flex-col items-center px-2 pb-2 pt-1 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
        >
          {current.icon}
        </div>
        <h3 className="mb-2 text-base font-semibold">{current.title}</h3>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {current.body}
        </p>

        <div className="mb-5 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 18 : 6,
                background: i === step ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        <div className="flex w-full items-center justify-between gap-2">
          <button
            onClick={finish}
            className="rounded-lg px-3 py-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Back
              </button>
            )}
            <button
              onClick={() => (last ? finish() : setStep((s) => s + 1))}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              {last ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
