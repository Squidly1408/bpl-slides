// Core data model for BPL Slides. Everything here is stored locally
// (IndexedDB) — see src/lib/db.ts. Nothing is ever sent to a server.

export type TransitionType =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'flip'

export const TRANSITIONS: { value: TransitionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide from right' },
  { value: 'slide-right', label: 'Slide from left' },
  { value: 'slide-up', label: 'Slide from bottom' },
  { value: 'slide-down', label: 'Slide from top' },
  { value: 'zoom', label: 'Zoom in' },
  { value: 'flip', label: 'Flip' },
]

export type BlockType =
  | 'text'
  | 'shape'
  | 'image'
  | 'video'
  | 'audio'
  | 'embed'
  | 'mesh'
  | 'drawing'
  | 'file'
  | 'icon'
  | 'math'
  | 'flowerGraph'

export interface BlockBase {
  id: string
  type: BlockType
  /** position/size as % of slide dimensions, 0-100 */
  x: number
  y: number
  w: number
  h: number
  rotation: number
  zIndex: number
}

export interface TextBlock extends BlockBase {
  type: 'text'
  content: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  align: 'left' | 'center' | 'right'
  valign: 'top' | 'middle' | 'bottom'
  color: string
  isHeading: boolean
  /** optional — makes this block a clickable link (opens in a new tab) instead of plain text */
  href?: string
  /** letter-spacing in px, for small uppercase "eyebrow" labels and stat captions — the detail that reads as designed rather than default-typed. Omit for normal body/heading text. */
  letterSpacing?: number
}

/** The shape's silhouette. 'rect' (the default/legacy shape) uses `radius` for
 * corner rounding, all the way up to a pill/circle at 50 — every other kind
 * has a fixed outline and ignores `radius`. */
export type ShapeKind = 'rect' | 'triangle' | 'pentagon' | 'hexagon' | 'star' | 'arrow' | 'line'

/** A plain decorative rectangle/pill/circle (or other silhouette) — colour
 * bands, cards, and icon bubbles behind other blocks, the building blocks of
 * "designed" layouts. */
export interface ShapeBlock extends BlockBase {
  type: 'shape'
  color: string
  /** corner rounding, 0 (square) to 50 (pill/circle), as % of the shorter side — only used when kind is 'rect' (or unset). */
  radius: number
  opacity: number
  /** optional soft drop shadow, for cards/bubbles that should read as lifted off the background rather than flat-pasted. */
  shadow?: boolean
  /** optional linear gradient from `color` to this second colour, in place of a flat fill — what gives bands/covers real depth instead of a single flat swatch. */
  gradientTo?: string
  /** gradient direction in degrees (CSS linear-gradient convention); ignored unless gradientTo is set. Defaults to 135 (top-left to bottom-right). */
  gradientAngle?: number
  /** silhouette; missing on older saved shapes — treat as 'rect', which preserves their exact prior rounded-rect/circle rendering. */
  kind?: ShapeKind
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  assetId: string
  fit: 'contain' | 'cover'
  /** corner rounding, 0 (square) to 50 (fully round), as % of the shorter side — same convention as ShapeBlock.radius. */
  radius?: number
  /** border width in px (authored against the 1280-wide canvas, like fontSize); 0 or unset means no border. */
  borderWidth?: number
  borderColor?: string
}

export interface VideoBlock extends BlockBase {
  type: 'video'
  assetId: string
  autoplay: boolean
  loop: boolean
  controls: boolean
}

export interface AudioBlock extends BlockBase {
  type: 'audio'
  assetId: string
  autoplay: boolean
  loop: boolean
}

export interface EmbedBlock extends BlockBase {
  type: 'embed'
  url: string
}

export type MeshFormat = 'stl' | 'obj' | 'glb' | 'gltf'

export interface MeshBlock extends BlockBase {
  type: 'mesh'
  assetId: string
  format: MeshFormat
  wireframe: boolean
  autoRotate: boolean
}

export interface DrawingBlock extends BlockBase {
  type: 'drawing'
  assetId: string
}

export type FileKind = 'pdf' | 'docx'

/** A live preview of an uploaded document — PDF pages (with a pager) or a
 * formatted Word doc — rather than just a download link. */
export interface FileBlock extends BlockBase {
  type: 'file'
  assetId: string
  fileKind: FileKind
  page: number
}

/** A single Font Awesome Free (solid set) glyph, bundled locally
 * (`@fortawesome/free-solid-svg-icons`) and rendered as an inline SVG path —
 * fully offline, no webfont/CDN. `iconName` is the bare name (e.g. "star"),
 * looked up at render time — see lib/icons.ts. */
export interface IconBlock extends BlockBase {
  type: 'icon'
  iconName: string
  color: string
}

/** A typed maths expression (LaTeX source), rendered live via KaTeX — fully
 * offline, no photo OCR (see components/MathBlockEditorModal.tsx for why:
 * real handwriting-to-LaTeX needs a cloud OCR service, which would mean
 * sending student photos to a third party and breaking this app's
 * nothing-leaves-the-browser design). A photo of handwritten maths can still
 * be attached — as a plain, un-digitised ImageBlock instead. */
export interface MathBlock extends BlockBase {
  type: 'math'
  latex: string
  color: string
  fontSize: number
}

/** The Big Picture Learning Flower, rendered from BPLA's actual petal
 * artwork (see lib/flowerData.ts) rather than an invented approximation —
 * one petal per Learning Goal, its length set by that goal's real 1-5
 * progression level (the same scale BPLA/TASC use), editable live via the
 * block's properties panel. `levels` is keyed by the goal's official label. */
export interface FlowerGraphBlock extends BlockBase {
  type: 'flowerGraph'
  levels: Record<string, number>
}

export type Block =
  | TextBlock
  | ShapeBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | EmbedBlock
  | MeshBlock
  | DrawingBlock
  | FileBlock
  | IconBlock
  | MathBlock
  | FlowerGraphBlock

export interface Slide {
  id: string
  order: number
  transition: TransitionType
  background: string
  backgroundAssetId?: string
  blocks: Block[]
  notes?: string
}

/** The two colours a student picks for a custom (non-preset) colour scheme — the rest of the palette (dark shade, soft tint, on-primary text) is derived from these. See lib/color.ts + lib/themes.ts. */
export interface CustomThemeColors {
  primary: string
  accent: string
}

export interface Project {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  slides: Slide[]
  /** id into THEMES (lib/themes.ts), or 'custom' to use customTheme below; missing on older saved projects — treat as the default theme */
  theme?: string
  /** only set (and used) when theme === 'custom' */
  customTheme?: CustomThemeColors
}

export interface Asset {
  id: string
  name: string
  mime: string
  blob: Blob
}

/** Slide aspect ratio, 16:9, expressed as width/height in arbitrary units used for block %s */
export const SLIDE_W = 1280
export const SLIDE_H = 720
