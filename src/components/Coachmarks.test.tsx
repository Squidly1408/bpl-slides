import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Coachmarks, { type CoachStep } from './Coachmarks'

// jsdom has no real layout engine — every element's getBoundingClientRect()
// is all-zero and offsetParent is always null by default. Stub both so a
// "real page" target element reads as present/visible/sized, the same way
// it would in an actual browser.
beforeEach(() => {
  // Both respect inline `display: none`, the way a real browser's would —
  // that's how the "hidden target" test below simulates an element that
  // exists but isn't actually visible right now.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const hidden = this.style.display === 'none'
    return {
      top: 100,
      left: 100,
      right: 200,
      bottom: 150,
      width: hidden ? 0 : 100,
      height: hidden ? 0 : 50,
      x: 100,
      y: 100,
      toJSON() {},
    }
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get(this: HTMLElement) {
      return this.style.display === 'none' ? null : document.body
    },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Renders a stand-in "page" element the way a real target would appear
 * outside the Coachmarks tree, plus the tour itself. */
function renderWithTarget(steps: CoachStep[], onFinish = vi.fn()) {
  render(
    <>
      <button data-tour="real-button">Real button</button>
      <Coachmarks steps={steps} onFinish={onFinish} />
    </>,
  )
  return onFinish
}

describe('Coachmarks', () => {
  it('shows a targetless step as a centered card immediately', () => {
    renderWithTarget([{ title: 'Welcome', body: 'Hello there' }])
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Hello there')).toBeInTheDocument()
  })

  it('shows a step pointing at a real, visible target', () => {
    renderWithTarget([{ target: 'real-button', title: 'Look here', body: 'This is the button' }])
    expect(screen.getByText('Look here')).toBeInTheDocument()
  })

  it('spotlights whichever candidate target in an array is actually visible', () => {
    render(
      <>
        <button data-tour="desktop-only" style={{ display: 'none' }}>
          Desktop
        </button>
        <button data-tour="mobile-only">Mobile</button>
        <Coachmarks
          steps={[{ target: ['desktop-only', 'mobile-only'], title: 'Responsive step', body: 'body' }]}
          onFinish={vi.fn()}
        />
      </>,
    )
    expect(screen.getByText('Responsive step')).toBeInTheDocument()
  })

  it('skips a step whose target does not exist, moving straight to the next', () => {
    renderWithTarget([
      { target: 'missing', title: 'Ghost step', body: '...' },
      { title: 'Real step', body: 'Here we are' },
    ])
    expect(screen.queryByText('Ghost step')).not.toBeInTheDocument()
    expect(screen.getByText('Real step')).toBeInTheDocument()
  })

  it('skips a step whose target is hidden (zero-size / no offsetParent)', () => {
    render(
      <>
        <button data-tour="hidden-button" style={{ display: 'none' }}>
          Hidden
        </button>
        <Coachmarks steps={[{ target: 'hidden-button', title: 'Ghost', body: '...' }, { title: 'Fallback', body: 'ok' }]} onFinish={vi.fn()} />
      </>,
    )
    expect(screen.getByText('Fallback')).toBeInTheDocument()
  })

  it('calls onFinish if every step is skippable', () => {
    const onFinish = vi.fn()
    render(<Coachmarks steps={[{ target: 'missing', title: 'Ghost', body: '...' }]} onFinish={onFinish} />)
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('Next advances and Back returns to the previous step', async () => {
    const user = userEvent.setup()
    renderWithTarget([
      { title: 'Step one', body: 'first' },
      { title: 'Step two', body: 'second' },
    ])

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Step two')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step one')).toBeInTheDocument()
  })

  it('shows "Done" instead of "Next" on the last step, and it finishes the tour', async () => {
    const user = userEvent.setup()
    const onFinish = renderWithTarget([
      { title: 'Only step', body: 'body' },
    ])
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('Skip finishes the tour immediately regardless of step', async () => {
    const user = userEvent.setup()
    const onFinish = renderWithTarget([
      { title: 'Step one', body: 'first' },
      { title: 'Step two', body: 'second' },
    ])
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('shows a progress dot per step', () => {
    const { container } = render(
      <Coachmarks
        steps={[
          { title: 'A', body: 'a' },
          { title: 'B', body: 'b' },
          { title: 'C', body: 'c' },
        ]}
        onFinish={vi.fn()}
      />,
    )
    // Dots aren't individually labelled — just check the right count renders.
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })
})
