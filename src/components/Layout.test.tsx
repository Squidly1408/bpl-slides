import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Layout from './Layout'
import * as tutorial from '../lib/tutorial'

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
  it('renders the page content passed via the router outlet', () => {
    renderLayout()
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('the Help button asks whichever page is mounted to show its tour', async () => {
    const spy = vi.spyOn(tutorial, 'requestTutorial')
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'How this works' }))

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
