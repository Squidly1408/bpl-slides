/**
 * The Big Picture Learning Flower — six petals, one per Learning Goal, each
 * sized to that goal's 1-5 progression level. This data is lifted directly
 * from the developer's own BPE-Flower project (the interactive tool BPLA
 * itself uses on its site — see the README this session sourced it from),
 * not redrawn from scratch: the exact SVG petal paths, the exact official
 * colours, the exact ring radii, and the exact BPLA level-descriptor text
 * per goal, so this renders as the real graphic rather than an
 * approximation of it.
 */

export interface FlowerGoal {
  label: string
  color: string
  /** raw SVG path `d` string, in the 0 0 375 375 viewBox below */
  path: string
  /** BPLA's official descriptor text for this goal at progression levels 1-5 */
  descriptions: Record<number, string>
}

export const FLOWER_VIEWBOX = 375
export const FLOWER_CENTER = 187.5
/** The flower's whole-graphic rotation, applied once to the group of rings+petals (matches the source exactly). */
export const FLOWER_ROTATION_DEG = -30
/** Concentric guide rings behind the petals, marking the 1-5 progression scale. */
export const FLOWER_RING_RADII = [60, 85, 115, 145, 175]

/**
 * Six goals in the same order as the source's petal1..petal6 (and its
 * inputBoxData array) — colour, path, and level text all line up by index.
 */
export const FLOWER_GOALS: FlowerGoal[] = [
  {
    label: 'Personal Qualities',
    color: '#FF6384',
    path: 'M 235.097656 112.074219 L 192.4375 184.824219 L 276.769531 185.394531 C 314.003906 185.683594 337.441406 145.207031 318.667969 113.078125 C 300.667969 80.507812 253.898438 79.9375 235.097656 112.074219 Z',
    descriptions: {
      1: 'Students at this level begin to take responsibility for planning their inquiries and are developing strategies to explore their interests.',
      2: 'Students at this level take initiative and frame inquiry questions around their area of interest.',
      3: 'Students at this level make informed and deliberate decisions about their learning progress.',
      4: 'Students at this level are highly motivated and strategic about their learning.',
      5: 'Students at this level are open to ideas that challenge their current thinking and they pursue new knowledge to develop improved solutions.',
    },
  },
  {
    label: 'Quantitative Reasoning',
    color: '#36A2EB',
    path: 'M 317.304688 264.46875 C 337.25 232.628906 314.488281 190.972656 276.855469 190.792969 C 276.855469 190.792969 192.398438 190.222656 192.398438 190.222656 L 234.132812 263.652344 C 252.367188 295.730469 298.480469 296.207031 317.304688 264.46875 Z',
    descriptions: {
      1: 'Students at this level are willing to have a go at using mathematics they are familiar with to understand situations.',
      2: 'Students at this level reliably use the mathematics they know to help solve problems they are working through.',
      3: 'Students at this level make use of their growing repertoire of mathematical strategies to explore unfamiliar situations.',
      4: 'Students at this level are competent and confident users of mathematics in their lives.',
      5: 'Students at this level understand the systematic nature of mathematics and the power of it in modelling the physical or social environment.',
    },
  },
  {
    label: 'Empirical Reasoning',
    color: '#F2F22A',
    path: 'M 229.441406 266.316406 L 187.707031 192.886719 L 144.984375 265.746094 C 125.882812 298.171875 150.027344 339.042969 187.589844 338.195312 C 224.488281 338.261719 247.675781 298.398438 229.441406 266.316406 Z',
    descriptions: {
      1: 'Students at this level notice and explore phenomena and ideas, making connections to their own experience.',
      2: 'Students at this level ask questions and plan and undertake processes to explore their areas of interest.',
      3: 'Students at this level develop inquiry questions related to their interests and conduct investigations to test their predictions.',
      4: 'Students at this level pose and test hypotheses, applying investigative methods to clarify and explore their new understandings.',
      5: 'Students at this level systematically refine hypotheses to develop authoritative knowledge from their investigations.',
    },
  },
  {
    label: 'Communication',
    color: '#4BC0C0',
    path: 'M 56.511719 261.203125 C 74.160156 294.285156 121.5 295.25 140.433594 262.832031 C 140.433594 262.832031 183.050781 190.15625 183.050781 190.15625 L 98.804688 189.589844 C 61.90625 189.339844 38.4375 229.035156 56.511719 261.203125 Z',
    descriptions: {
      1: 'Students at this level use familiar communication tools in order to convey their ideas and opinions.',
      2: 'Students at this level are prepared to try out new modes of communication in order to expand their repertoire.',
      3: 'Students at this level communicate with presence and purpose.',
      4: 'Students at this level adapt their communication to achieve impact.',
      5: 'Students at this level use a blend of tools to design and refine their communication in order to deliver a compelling message that expands perspectives.',
    },
  },
  {
    label: 'Social Reasoning',
    color: '#9966FF',
    path: 'M 98.628906 184.191406 L 183.085938 184.761719 L 141.351562 111.332031 C 123.117188 79.25 77.007812 78.777344 58.183594 110.515625 C 38.234375 142.355469 60.996094 184.007812 98.628906 184.191406 Z',
    descriptions: {
      1: 'Students at this level can describe the social frameworks and systems they are embedded in.',
      2: 'Students at this level recognise that there are different ways to investigate social issues.',
      3: 'Students at this level investigate social issues in depth by applying a range of tools.',
      4: 'Students at this level recognise the connections and distinctions between social issues through systematic investigation.',
      5: 'Students at this level define and analyse social issues using relevant frameworks and perspectives and take responsible social action.',
    },
  },
  {
    label: 'Knowing How to Learn',
    color: '#FF9F40',
    path: 'M 146.042969 108.664062 L 187.78125 182.09375 L 230.503906 109.238281 C 249.601562 76.808594 225.460938 35.941406 187.898438 36.789062 C 150.996094 36.722656 127.8125 76.582031 146.042969 108.664062 Z',
    descriptions: {
      1: 'Students at this level are starting to develop awareness of themselves and their potential, and to pursue opportunities for personal growth.',
      2: 'Students at this level can identify their strengths and challenges and make decisions to support their personal growth with increasing self-awareness.',
      3: 'Students at this level are developing increased personal, physical and social awareness and are able to analyse their strengths and draw from their experience to prioritise what is required for personal growth.',
      4: 'Students at this level show sense of self and strength of character and appreciate the need for sustained effort.',
      5: 'Students at this level are confident and insightful, holding themselves accountable for their actions.',
    },
  },
]

/** The six official colours, keyed by goal label — the single source every other Learning-Goal visual in the app (the scorecard, any legend) should read from, rather than each inventing its own palette. */
export const FLOWER_COLOR_BY_LABEL: Record<string, string> = Object.fromEntries(FLOWER_GOALS.map((g) => [g.label, g.color]))

export const DEFAULT_FLOWER_LEVEL = 3

/** Default levels object — every goal at the middle of the 1-5 scale, a neutral starting point to edit. */
export function defaultFlowerLevels(): Record<string, number> {
  return Object.fromEntries(FLOWER_GOALS.map((g) => [g.label, DEFAULT_FLOWER_LEVEL]))
}

/**
 * Maps a 1-5 progression level to the petal's CSS scale factor — the exact
 * formula the source tool uses (a 50-150 slider in steps of 25, `value/100
 * * 0.8`), just re-expressed in terms of the level directly: level 1 -> 0.4,
 * level 3 (the path data's own drawn size) -> 0.8, level 5 -> 1.2.
 */
export function flowerLevelToScale(level: number): number {
  const clamped = Math.min(5, Math.max(1, level))
  const sliderValue = 50 + (clamped - 1) * 25
  return (sliderValue / 100) * 0.8
}
