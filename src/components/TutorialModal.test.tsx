import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TutorialModal from './TutorialModal'

afterEach(() => {
  localStorage.clear()
})

describe('TutorialModal', () => {
  it('opens on the welcome step, with no Back button yet', () => {
    render(<TutorialModal onClose={() => {}} />)
    expect(screen.getByText(/Welcome to BPL Slides/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('Next advances to the next step, and Back returns to the previous one', async () => {
    const user = userEvent.setup()
    render(<TutorialModal onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText(/Start from a template/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText(/Welcome to BPL Slides/)).toBeInTheDocument()
  })

  it('the last step offers "Get started" instead of "Next"', async () => {
    const user = userEvent.setup()
    render(<TutorialModal onClose={() => {}} />)

    // Walk to the end regardless of exactly how many steps there are.
    while (screen.queryByRole('button', { name: 'Next' })) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }

    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument()
  })

  it('finishing marks the tutorial as seen and calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TutorialModal onClose={onClose} />)

    while (screen.queryByRole('button', { name: 'Next' })) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    await user.click(screen.getByRole('button', { name: 'Get started' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('bpe-tutorial-seen')).toBe('1')
  })

  it('Skip closes immediately and also marks the tutorial as seen', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TutorialModal onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('bpe-tutorial-seen')).toBe('1')
  })
})
