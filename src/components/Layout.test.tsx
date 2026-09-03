import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import Layout from './Layout'
import { markTutorialSeen } from '../lib/tutorial'

afterEach(() => {
  localStorage.clear()
})

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<p>page content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  it('auto-opens the tutorial the first time, in an unseen browser', () => {
    renderLayout()
    expect(screen.getByText(/Welcome to BPL Slides/)).toBeInTheDocument()
  })

  it('does not auto-open the tutorial once it has already been seen', () => {
    markTutorialSeen()
    renderLayout()
    expect(screen.queryByText(/Welcome to BPL Slides/)).not.toBeInTheDocument()
  })

  it('the Help button reopens the tutorial even after it has been seen', async () => {
    markTutorialSeen()
    const user = userEvent.setup()
    renderLayout()
    expect(screen.queryByText(/Welcome to BPL Slides/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'How this works' }))

    expect(screen.getByText(/Welcome to BPL Slides/)).toBeInTheDocument()
  })
})
