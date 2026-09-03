import { makeShapeBlock, makeSlide, makeTextBlock } from './blocks'
import { createId } from './id'
import { bulletSlide, circle, closingSlide, evidenceSlide, flowerSlide, heroSlide, iconGridSlide, splitSlide, statSlide, timelineSlide } from './layouts'
import { FLOWER_COLOR_BY_LABEL } from './flowerData'
import type { Region } from './layout'
import { darken } from './color'
import { getTheme } from './themes'
import type { CustomThemeColors, Project, Slide } from '../types'

export interface TemplateOptions {
  studentName?: string
  termLabel?: string
  themeId?: string
  customTheme?: CustomThemeColors
}

/** Big Picture Learning's six Learning Goals — used across templates. Source: bigpicture.org.au/learning-goals. */
export const LEARNING_GOALS = [
  { icon: '💬', label: 'Communication' },
  { icon: '🤝', label: 'Social Reasoning' },
  { icon: '🔢', label: 'Quantitative Reasoning' },
  { icon: '🔬', label: 'Empirical Reasoning' },
  { icon: '🌱', label: 'Personal Qualities' },
  { icon: '🧭', label: 'Knowing How to Learn' },
]

function subtitleOf(opts: TemplateOptions) {
  return [opts.studentName, opts.termLabel].filter(Boolean).join(' · ')
}

/**
 * The 4 supporting components of the IBPLC beyond the Learning Goals score —
 * grounded in BPLA's own IBPLC Student Guide / "What is the IBPLC?"
 * explainer (bigpicture.org.au): a student video statement, a curated
 * external-facing digital portfolio, a fixed advisor narrative statement,
 * and a student-curated achievements list. Shown as a compact footer row —
 * the scorecard above is the part worth a full slide.
 */
const IBPLC_COMPONENTS = [
  { icon: '🎥', label: 'Video statement' },
  { icon: '📁', label: 'Digital portfolio' },
  { icon: '📝', label: 'Advisor narrative' },
  { icon: '🏅', label: 'Achievements & certifications' },
]

/**
 * A reasonable starting spread of progression levels (1-5) across the six
 * Learning Goals, in LEARNING_GOALS order — just placeholder variety so the
 * scorecard doesn't render as one flat row; every level number below is its
 * own text block a student edits to their own real, advisor-confirmed result.
 */
const SAMPLE_LEVELS = [3, 4, 3, 4, 4, 3]

/**
 * A standalone slide about the International Big Picture Learning Credential
 * — insertable into any deck via the editor's Add menu, not just bundled
 * into one template.
 *
 * The IBPLC itself has no fixed certificate graphic to "replicate" — BPLA
 * issues it as a personalised digital Learner Profile on a third-party
 * platform (Credfolio), built from a video statement, a portfolio, an
 * advisor narrative, and a progression score. What IS a real, documented
 * part of that score is the 1-5 progression-level scale applied to each of
 * the six Learning Goals (see e.g. TASC's IBPLC pages) — so that's what this
 * slide actually renders: a scorecard of the six goals, each against that
 * real 5-level scale, using the same official per-goal colours as the
 * Learning Flower. Every level number is its own plain text block, so a
 * student can double-click and change "Level 3" to whatever their advisor
 * has actually confirmed — this is a starting point to fill in, not a
 * finished, authoritative record.
 */
export function ibplcSlide(themeId?: string, custom?: CustomThemeColors): Slide {
  const theme = getTheme(themeId, custom)
  const rowRegion: Region = { x: 8, y: 26, w: 84, h: 54 }
  const rowH = rowRegion.h / LEARNING_GOALS.length
  const iconD = circle(4.6)
  const segGap = 0.7
  const segCount = 5
  const segW = (26 - segGap * (segCount - 1)) / segCount

  const blocks: Slide['blocks'] = [
    makeShapeBlock({ x: 8, y: 6, w: 9, h: 0.9, color: theme.accent, radius: 50 }),
    makeTextBlock({ content: 'International Big Picture Learning Credential', x: 8, y: 8, w: 84, h: 4, fontSize: 13, fontWeight: 'bold', color: theme.accent, letterSpacing: 1.5 }),
    makeTextBlock({ content: 'My Learning Goals Progression', x: 8, y: 12.5, w: 84, h: 11, fontSize: 29, fontWeight: 'bold', color: theme.primaryDark }),
  ]

  LEARNING_GOALS.forEach((goal, i) => {
    const rowY = rowRegion.y + i * rowH
    const color = FLOWER_COLOR_BY_LABEL[goal.label] ?? theme.primary
    const level = SAMPLE_LEVELS[i] ?? 3
    const iconY = rowY + rowH / 2 - iconD.h / 2

    blocks.push(
      // icon bubble
      makeShapeBlock({ x: rowRegion.x, y: iconY, w: iconD.w, h: iconD.h, color, gradientTo: darken(color, 0.22), radius: 50, shadow: true }),
      makeTextBlock({ content: goal.icon, x: rowRegion.x, y: iconY, w: iconD.w, h: iconD.h, fontSize: 20, align: 'center', valign: 'middle', color: '#ffffff' }),
      // goal name
      makeTextBlock({ content: goal.label, x: rowRegion.x + iconD.w + 2, y: rowY, w: 27, h: rowH, fontSize: 15, fontWeight: 'bold', valign: 'middle', color: '#211f1a' }),
    )

    // 5-segment progression meter, filled up to `level`
    for (let s = 0; s < segCount; s++) {
      blocks.push(
        makeShapeBlock({
          x: rowRegion.x + iconD.w + 33 + s * (segW + segGap),
          y: rowY + rowH / 2 - 0.9,
          w: segW,
          h: 1.8,
          color: s < level ? color : theme.surfaceTint,
          radius: 30,
        }),
      )
    }

    blocks.push(
      makeTextBlock({ content: `Level ${level}`, x: rowRegion.x + rowRegion.w - 13, y: rowY, w: 13, h: rowH, fontSize: 15, fontWeight: 'bold', align: 'right', valign: 'middle', color }),
    )

    if (i < LEARNING_GOALS.length - 1) {
      blocks.push(makeShapeBlock({ x: rowRegion.x, y: rowY + rowH - 0.2, w: rowRegion.w, h: 0.15, color: theme.surfaceTint, radius: 0 }))
    }
  })

  // Footer: the other real components of the IBPLC, as a compact strip — not the main event on this slide.
  const footerY = 84
  blocks.push(makeShapeBlock({ x: 8, y: footerY, w: 84, h: 10, color: theme.surfaceTint, radius: 8 }))
  const chipW = 84 / IBPLC_COMPONENTS.length
  IBPLC_COMPONENTS.forEach((c, i) => {
    blocks.push(
      makeTextBlock({
        content: `${c.icon}  ${c.label}`,
        x: 8 + i * chipW,
        y: footerY,
        w: chipW,
        h: 10,
        fontSize: 12.5,
        fontWeight: 'bold',
        align: 'center',
        valign: 'middle',
        color: theme.primaryDark,
      }),
    )
  })

  blocks.push(
    makeTextBlock({
      content: 'Your full IBPLC — video, portfolio, and advisor narrative — lives in your BPLA Learner Profile. This slide is your own editable summary of it: change the levels above to your real, advisor-confirmed results.',
      x: 8,
      y: 95,
      w: 84,
      h: 5,
      fontSize: 10.5,
      color: '#6b6b6b',
    }),
  )

  return makeSlide({ background: '#ffffff', transition: 'fade', blocks })
}

/** A standalone slide about Learning Through Internship (LTI) — also insertable on its own. */
export function internshipSlide(themeId?: string, custom?: CustomThemeColors): Slide {
  const theme = getTheme(themeId, custom)
  return bulletSlide(theme, 'My Internship (LTI)', [
    'Where I intern, and who my mentor is',
    'The real-world project my mentor and I have designed together',
    'The skills and Learning Goals this work is building',
    'What I’ve produced so far, and what’s next',
  ])
}

function baseProject(title: string, opts: TemplateOptions, slides: Slide[]): Project {
  const now = Date.now()
  slides.forEach((s, i) => (s.order = i))
  return { id: createId(), title, createdAt: now, updatedAt: now, theme: opts.themeId, customTheme: opts.customTheme, slides }
}

/**
 * Senior Portfolio Exhibition deck — the termly presentation of a student's
 * Learning Plan and Learning Through Internship work to an advisory panel.
 * Grounded in BPLA's "A Guide to Exhibitions" / "Assessment by Exhibition"
 * (bigpicture.org.au): a ~45-minute reflection on the student's learning
 * plan, goals, and growth. A generic, editable starting point — confirm the
 * exact format with your advisor.
 */
export function createExhibitionTemplate(opts: TemplateOptions = {}): Project {
  const theme = getTheme(opts.themeId, opts.customTheme)
  const term = opts.termLabel ?? ''
  const slides = [
    heroSlide(theme, 'My Exhibition', subtitleOf(opts) || 'Student name · Term · Year'),
    splitSlide(theme, 'About Me & My Learning Plan', [
      'Who I am, and what I’m interested in right now',
      'The goals in my current Learning Plan',
      'How this term’s work connects to those goals',
    ]),
    bulletSlide(theme, 'What I Worked On', [
      'A summary of the project(s), internship, or coursework I completed this term',
      'Add photos, video, files, or a 3D model with the Upload tool, or edit this slide directly',
    ]),
    flowerSlide(theme, 'Learning Goals I Grew In', LEARNING_GOALS),
    evidenceSlide(theme, 'Evidence of Learning'),
    bulletSlide(theme, 'Reflection & Next Steps', [
      'What went well, and what was hard',
      'What I’d do differently next time',
      `What’s next in my Learning Plan${term ? ` for ${term}` : ''}`,
    ]),
    closingSlide(theme, 'Questions?', 'Thank you for listening'),
  ]
  return baseProject(term ? `My Exhibition — ${term}` : 'My Exhibition', opts, slides)
}

/**
 * Senior Portfolio deck (Years 11–12) — Learning Plan, internship, evidence
 * against the six Learning Goals, and the IBPLC it builds toward.
 */
export function createSeniorPortfolioTemplate(opts: TemplateOptions = {}): Project {
  const theme = getTheme(opts.themeId, opts.customTheme)
  const term = opts.termLabel ?? ''
  const slides = [
    heroSlide(theme, 'Senior Portfolio', subtitleOf(opts) || 'Student name · Term · Year'),
    splitSlide(theme, 'My Learning Plan', [
      'My interests and long-term goals',
      'The goals in my current Learning Plan',
      'Why this Senior Project matters to me',
    ]),
    internshipSlide(opts.themeId, opts.customTheme),
    flowerSlide(theme, 'Progress Against My Learning Goals', LEARNING_GOALS),
    evidenceSlide(theme, 'Evidence & Artefacts'),
    statSlide(theme, 'Term Reflection', 'What I’m proudest of this term, and what I’m still working on'),
    ibplcSlide(opts.themeId, opts.customTheme),
    closingSlide(theme, 'Questions?', 'Thank you for listening'),
  ]
  return baseProject(term ? `Senior Portfolio — ${term}` : 'Senior Portfolio', opts, slides)
}

/**
 * Gateway Certificate deck (Years 8–10) — the junior pathway some Big Picture
 * schools run alongside a student's ROSA, building the habits and body of
 * work that lead into the Senior Portfolio. A generic starting point —
 * confirm the exact requirements and naming with your own school, since this
 * varies by school.
 */
export function createGatewayTemplate(opts: TemplateOptions = {}): Project {
  const theme = getTheme(opts.themeId, opts.customTheme)
  const term = opts.termLabel ?? ''
  const slides = [
    heroSlide(theme, 'My Gateway Certificate', subtitleOf(opts) || 'Student name · Term · Year'),
    bulletSlide(theme, 'About My Gateway Journey', [
      'What I’ve been working on this term',
      'The projects, subjects, or interests I’ve been exploring',
      'How this builds toward my Senior Portfolio',
    ]),
    timelineSlide(theme, 'My Journey So Far', ['Explored', 'Practised', 'Produced', 'Presented']),
    iconGridSlide(theme, 'Skills I’m Building', LEARNING_GOALS.slice(0, 4)),
    evidenceSlide(theme, 'Evidence of My Work'),
    bulletSlide(theme, 'Reflection & Goals', [
      'What I’m proud of this term',
      'What I found challenging',
      `My goals for ${term || 'next term'}`,
    ]),
    closingSlide(theme, 'Questions?', 'Thank you for listening'),
  ]
  return baseProject(term ? `Gateway Certificate — ${term}` : 'Gateway Certificate', opts, slides)
}

/** A generic, non-BPL-specific deck for any class presentation. */
export function createNormalPresentationTemplate(opts: TemplateOptions = {}): Project {
  const theme = getTheme(opts.themeId, opts.customTheme)
  const term = opts.termLabel ?? ''
  const slides = [
    heroSlide(theme, 'Presentation Title', subtitleOf(opts) || 'Your name · Term · Year'),
    bulletSlide(theme, 'Agenda', ['Introduction', 'Main content', 'Key takeaways', 'Questions']),
    splitSlide(theme, 'Overview', ['Background / context', 'What this presentation covers', 'Why it matters']),
    bulletSlide(theme, 'Key Points', ['Point one', 'Point two', 'Point three']),
    evidenceSlide(theme, 'Supporting Evidence', ['Image / diagram', 'Data / chart', 'Source / link']),
    closingSlide(theme, 'Thank you', 'Questions & discussion'),
  ]
  return baseProject(term ? `Presentation — ${term}` : 'Presentation', opts, slides)
}

export function createBlankProject(title = 'Untitled project', opts: TemplateOptions = {}): Project {
  const theme = getTheme(opts.themeId, opts.customTheme)
  const slide = makeSlide({
    order: 0,
    background: '#ffffff',
    blocks: [makeTextBlock({ content: 'Title slide', x: 8, y: 40, w: 84, h: 20, fontSize: 44, fontWeight: 'bold', color: theme.primaryDark })],
  })
  return baseProject(title, opts, [slide])
}

export type TemplateId = 'exhibition' | 'senior-portfolio' | 'gateway' | 'normal' | 'blank'

export const TEMPLATE_OPTIONS: { id: TemplateId; name: string; description: string }[] = [
  { id: 'exhibition', name: 'Exhibition', description: 'Termly Senior Portfolio Exhibition — Learning Plan, evidence, reflection.' },
  { id: 'senior-portfolio', name: 'Senior Portfolio', description: 'Years 11–12 — Learning Plan, internship, Learning Goals, and your IBPLC.' },
  { id: 'gateway', name: 'Gateway Certificate', description: 'Years 8–10 — your journey, skills, and evidence toward Senior Portfolio.' },
  { id: 'normal', name: 'Normal presentation', description: 'A clean, general-purpose deck for any class presentation.' },
  { id: 'blank', name: 'Blank deck', description: 'Start from a single title slide.' },
]

export function createProjectFromTemplate(id: TemplateId, opts: TemplateOptions = {}): Project {
  switch (id) {
    case 'exhibition':
      return createExhibitionTemplate(opts)
    case 'senior-portfolio':
      return createSeniorPortfolioTemplate(opts)
    case 'gateway':
      return createGatewayTemplate(opts)
    case 'normal':
      return createNormalPresentationTemplate(opts)
    case 'blank':
      return createBlankProject(opts.termLabel ? `Untitled — ${opts.termLabel}` : undefined, opts)
  }
}
