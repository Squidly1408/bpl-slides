import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Logo from './Logo'

describe('Logo', () => {
  it('renders the shared favicon asset with the given size', () => {
    render(<Logo size={48} title="BPL Slides" />)
    const img = screen.getByRole('img', { name: 'BPL Slides' })
    expect(img).toHaveAttribute('src', '/favicon.svg')
    expect(img).toHaveAttribute('width', '48')
    expect(img).toHaveAttribute('height', '48')
  })

  it('falls back to sane defaults', () => {
    render(<Logo />)
    const img = screen.getByRole('img', { name: 'BPL Slides' })
    expect(img).toHaveAttribute('width', '32')
  })
})
