import { buildIndustryMotif } from './industryMotifs'
import { CONTENT_STYLES, evidenceSlide, iconGridSlide } from './layouts'
import { getTheme } from './themes'
import type { Theme } from './themes'
import type { Slide } from '../types'

interface IndustryDef {
  id: string
  /** id into CONTENT_STYLES — deliberately varied across industries so the packs read as genuinely different designs, not the same layout re-worded. */
  style: string
  name: string
  icon: string
  overview: string[]
  skills: { icon: string; label: string }[]
  /**
   * A polished, fully-designed 8-slide .pptx (in public/examples/) showing
   * what a finished Big Picture Learning journey deck can look like for this
   * industry — served as a static download so a student can see a real
   * example before building their own. Deliberately NOT run through the
   * best-effort pptx parser (lib/parsers/pptx.ts): that only lifts text and
   * images, which would throw away exactly the layout/colour/typography
   * polish that makes it worth looking at as an example.
   */
  exampleFile: string
}

/**
 * Ten broad industry areas students commonly do internships/Senior Projects
 * in. Each contributes 3 ready-made, on-theme slides (overview, skills &
 * tools, evidence) that can be dropped into any deck — a starting point to
 * edit, not a fixed script.
 */
export const INDUSTRIES: IndustryDef[] = [
  {
    id: 'trades',
    exampleFile: '/examples/trades.pptx',
    style: 'cards',
    name: 'Trades & Construction',
    icon: '🛠️',
    overview: [
      'The trade or construction project I worked on this term',
      'The site, workshop, or mentor I worked with',
      'The tools, materials, and processes involved',
    ],
    skills: [
      { icon: '📐', label: 'Measuring & planning' },
      { icon: '🦺', label: 'Workplace safety' },
      { icon: '🔧', label: 'Tools & equipment' },
      { icon: '🧱', label: 'Building & finishing' },
    ],
  },
  {
    id: 'health',
    exampleFile: '/examples/health.pptx',
    style: 'band',
    name: 'Health & Community Services',
    icon: '🩺',
    overview: [
      'The health or community service setting I worked in',
      'Who I worked alongside, and what I observed or helped with',
      'What this taught me about care, ethics, and communication',
    ],
    skills: [
      { icon: '🤲', label: 'Patient / client care' },
      { icon: '🗣️', label: 'Communication' },
      { icon: '📋', label: 'Recording & reporting' },
      { icon: '🔒', label: 'Privacy & ethics' },
    ],
  },
  {
    id: 'creative',
    exampleFile: '/examples/creative.pptx',
    style: 'band-mirrored',
    name: 'Creative Arts & Design',
    icon: '🎨',
    overview: [
      'The creative project, medium, or brief I worked on',
      'My process — research, drafts, iteration, feedback',
      'Who I made it for, and how it was received',
    ],
    skills: [
      { icon: '✏️', label: 'Concept & drafting' },
      { icon: '🎭', label: 'Style & technique' },
      { icon: '🗂️', label: 'Curation & critique' },
      { icon: '📣', label: 'Presenting work' },
    ],
  },
  {
    id: 'business',
    exampleFile: '/examples/business.pptx',
    style: 'bar',
    name: 'Business & Enterprise',
    icon: '💼',
    overview: [
      'The business, organisation, or venture I worked with',
      'The task, project, or problem I helped tackle',
      'What I learned about how a real organisation runs',
    ],
    skills: [
      { icon: '📊', label: 'Planning & strategy' },
      { icon: '💵', label: 'Budgeting & numbers' },
      { icon: '🤝', label: 'Teamwork & clients' },
      { icon: '📈', label: 'Marketing & pitching' },
    ],
  },
  {
    id: 'it',
    exampleFile: '/examples/it.pptx',
    style: 'cover',
    name: 'Information Technology',
    icon: '💻',
    overview: [
      'The app, system, or IT problem I worked on',
      'The tools, languages, or platforms I used',
      'How I tested it and what I’d improve next',
    ],
    skills: [
      { icon: '⌨️', label: 'Coding / scripting' },
      { icon: '🧩', label: 'Problem-solving' },
      { icon: '🖥️', label: 'Systems & tools' },
      { icon: '🐛', label: 'Testing & debugging' },
    ],
  },
  {
    id: 'science',
    exampleFile: '/examples/science.pptx',
    style: 'cards',
    name: 'Science & Environment',
    icon: '🔬',
    overview: [
      'The investigation, experiment, or fieldwork I carried out',
      'My method — what I measured, tested, or observed',
      'What the data or results showed, and what it means',
    ],
    skills: [
      { icon: '🧪', label: 'Method & measurement' },
      { icon: '📉', label: 'Data & analysis' },
      { icon: '🌱', label: 'Environmental awareness' },
      { icon: '📓', label: 'Recording evidence' },
    ],
  },
  {
    id: 'education',
    exampleFile: '/examples/education.pptx',
    style: 'band',
    name: 'Education & Human Services',
    icon: '📚',
    overview: [
      'The classroom, service, or program I was involved with',
      'What I helped with, taught, or supported',
      'What this taught me about working with people',
    ],
    skills: [
      { icon: '🧑‍🏫', label: 'Explaining & mentoring' },
      { icon: '👂', label: 'Listening & empathy' },
      { icon: '🗓️', label: 'Planning sessions' },
      { icon: '🤝', label: 'Supporting others' },
    ],
  },
  {
    id: 'hospitality',
    exampleFile: '/examples/hospitality.pptx',
    style: 'band-mirrored',
    name: 'Hospitality & Culinary',
    icon: '🍳',
    overview: [
      'The kitchen, café, or event I worked in',
      'What I prepared, served, or organised',
      'What I learned about quality, timing, and service',
    ],
    skills: [
      { icon: '🔪', label: 'Food prep & technique' },
      { icon: '🧂', label: 'Menu & flavour' },
      { icon: '🧼', label: 'Hygiene & safety' },
      { icon: '🍽️', label: 'Service & presentation' },
    ],
  },
  {
    id: 'engineering',
    exampleFile: '/examples/engineering.pptx',
    style: 'cover',
    name: 'Engineering & Manufacturing',
    icon: '⚙️',
    overview: [
      'The design, build, or manufacturing project I worked on',
      'The design/CAD process I followed, and any prototypes made',
      'How I tested it, and what I’d refine next',
    ],
    skills: [
      { icon: '📐', label: 'Design & CAD' },
      { icon: '🔩', label: 'Building & assembly' },
      { icon: '🧮', label: 'Calculations & specs' },
      { icon: '🛡️', label: 'Testing & safety' },
    ],
  },
  {
    id: 'sport',
    exampleFile: '/examples/sport.pptx',
    style: 'bar',
    name: 'Sport & Recreation',
    icon: '🏅',
    overview: [
      'The sport, program, or recreation project I worked on',
      'My role — coaching, organising, training, or officiating',
      'What I learned about leadership and performance',
    ],
    skills: [
      { icon: '🏋️', label: 'Training & technique' },
      { icon: '🧑‍🤝‍🧑', label: 'Leadership & coaching' },
      { icon: '📅', label: 'Event organisation' },
      { icon: '🏆', label: 'Performance & feedback' },
    ],
  },
]

/**
 * Builds one industry-flavoured slide, with that industry's decorative motif
 * (see industryMotifs.ts) tucked in behind the layout's own blocks. The
 * motif has to be built BEFORE the layout — block z-index is a simple
 * incrementing counter (see blocks.ts), so whichever set is created first
 * ends up with the lower z-index and renders behind, regardless of the
 * order the two arrays are concatenated in below.
 *
 * Only used for the Skills & Evidence slides, not the Overview slide — the
 * Overview's layout varies per industry (`style`, from a "cover"'s full
 * white card to a "cards" grid to a colour band), and several of those
 * fully cover the motif's corner with opaque content. Skills & Evidence
 * always use the same plain-heading layout, so the motif's header-strip
 * position (see industryMotifs.ts) is reliably empty there.
 */
function withMotif(industryId: string, theme: Theme, build: () => Slide): Slide {
  const motif = buildIndustryMotif(industryId, theme)
  const slide = build()
  slide.blocks = [...motif, ...slide.blocks]
  return slide
}

export function buildIndustrySlides(industryId: string, themeId?: string): Slide[] {
  const industry = INDUSTRIES.find((i) => i.id === industryId)
  if (!industry) return []
  const theme = getTheme(themeId)
  const style = CONTENT_STYLES.find((s) => s.id === industry.style) ?? CONTENT_STYLES[0]
  return [
    style.build(theme, `${industry.icon} ${industry.name}: Overview`, industry.overview),
    withMotif(industryId, theme, () => iconGridSlide(theme, 'Skills & Tools', industry.skills)),
    withMotif(industryId, theme, () => evidenceSlide(theme, 'Evidence & Outcomes')),
  ]
}
