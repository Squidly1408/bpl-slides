import { describe, expect, it } from 'vitest'
import { applyThemeToProject } from './applyTheme'
import { makeShapeBlock, makeSlide, makeTextBlock } from './blocks'
import { getTheme } from './themes'
import type { Project } from '../types'

function makeProject(themeId: string): Project {
  const theme = getTheme(themeId)
  const slide = makeSlide({
    background: theme.surfaceTint,
    blocks: [
      makeShapeBlock({ color: theme.primary }),
      makeTextBlock({ color: theme.primaryDark }),
    ],
  })
  return {
    id: 'p1',
    title: 'Test project',
    createdAt: 0,
    updatedAt: 0,
    theme: themeId,
    slides: [slide],
  }
}

describe('applyThemeToProject', () => {
  it('remaps every palette-derived colour to the new theme', () => {
    const project = makeProject('indigo')
    const newTheme = getTheme('teal')

    const result = applyThemeToProject(project, 'teal')

    expect(result.theme).toBe('teal')
    expect(result.slides[0].background).toBe(newTheme.surfaceTint)
    const [shape, text] = result.slides[0].blocks
    expect(shape.type).toBe('shape')
    expect((shape as { color: string }).color).toBe(newTheme.primary)
    expect(text.type).toBe('text')
    expect((text as { color: string }).color).toBe(newTheme.primaryDark)
  })

  it('leaves a hand-picked colour outside the old palette untouched', () => {
    const project = makeProject('indigo')
    project.slides[0].blocks[1] = makeTextBlock({ color: '#ff00ff' })

    const result = applyThemeToProject(project, 'teal')

    expect((result.slides[0].blocks[1] as { color: string }).color).toBe('#ff00ff')
  })

  it('is a no-op recolour when switching to the same theme', () => {
    const project = makeProject('indigo')
    const result = applyThemeToProject(project, 'indigo')
    expect(result).toEqual(project)
  })

  it('carries custom theme colours through when switching to "custom"', () => {
    const project = makeProject('indigo')
    const custom = { primary: '#111111', accent: '#222222' }
    const result = applyThemeToProject(project, 'custom', custom)
    expect(result.theme).toBe('custom')
    expect(result.customTheme).toEqual(custom)
  })
})
