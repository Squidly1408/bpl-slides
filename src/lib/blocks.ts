import { createId } from './id'
import { defaultFlowerLevels } from './flowerData'
import type {
  AudioBlock,
  Block,
  DrawingBlock,
  EmbedBlock,
  FileBlock,
  FileKind,
  FlowerGraphBlock,
  IconBlock,
  ImageBlock,
  MathBlock,
  MeshBlock,
  MeshFormat,
  ShapeBlock,
  Slide,
  TextBlock,
  TransitionType,
  VideoBlock,
} from '../types'

let zCounter = 1

function nextZ() {
  return zCounter++
}

export function makeTextBlock(partial: Partial<TextBlock> = {}): TextBlock {
  return {
    id: createId(),
    type: 'text',
    x: 8,
    y: 8,
    w: 84,
    h: 20,
    rotation: 0,
    zIndex: nextZ(),
    content: 'New text',
    fontSize: 28,
    fontWeight: 'normal',
    align: 'left',
    valign: 'top',
    color: '#211f1a',
    isHeading: false,
    ...partial,
  }
}

export function makeHeadingBlock(text: string, partial: Partial<TextBlock> = {}): TextBlock {
  return makeTextBlock({
    content: text,
    fontSize: 44,
    fontWeight: 'bold',
    isHeading: true,
    y: 6,
    h: 16,
    ...partial,
  })
}

export function makeShapeBlock(partial: Partial<ShapeBlock> = {}): ShapeBlock {
  return {
    id: createId(),
    type: 'shape',
    x: 0,
    y: 0,
    w: 30,
    h: 100,
    rotation: 0,
    zIndex: nextZ(),
    color: '#1f6f5c',
    radius: 0,
    opacity: 1,
    ...partial,
  }
}

export function makeImageBlock(assetId: string, partial: Partial<ImageBlock> = {}): ImageBlock {
  return {
    id: createId(),
    type: 'image',
    x: 10,
    y: 26,
    w: 80,
    h: 60,
    rotation: 0,
    zIndex: nextZ(),
    assetId,
    fit: 'contain',
    ...partial,
  }
}

export function makeVideoBlock(assetId: string, partial: Partial<VideoBlock> = {}): VideoBlock {
  return {
    id: createId(),
    type: 'video',
    x: 10,
    y: 20,
    w: 80,
    h: 60,
    rotation: 0,
    zIndex: nextZ(),
    assetId,
    autoplay: false,
    loop: false,
    controls: true,
    ...partial,
  }
}

export function makeAudioBlock(assetId: string, partial: Partial<AudioBlock> = {}): AudioBlock {
  return {
    id: createId(),
    type: 'audio',
    x: 15,
    y: 42,
    w: 70,
    h: 10,
    rotation: 0,
    zIndex: nextZ(),
    assetId,
    autoplay: false,
    loop: false,
    ...partial,
  }
}

export function makeEmbedBlock(url: string, partial: Partial<EmbedBlock> = {}): EmbedBlock {
  return {
    id: createId(),
    type: 'embed',
    x: 8,
    y: 16,
    w: 84,
    h: 70,
    rotation: 0,
    zIndex: nextZ(),
    url,
    ...partial,
  }
}

export function makeMeshBlock(
  assetId: string,
  format: MeshFormat,
  partial: Partial<MeshBlock> = {},
): MeshBlock {
  return {
    id: createId(),
    type: 'mesh',
    x: 10,
    y: 16,
    w: 80,
    h: 70,
    rotation: 0,
    zIndex: nextZ(),
    assetId,
    format,
    wireframe: false,
    autoRotate: true,
    ...partial,
  }
}

export function makeDrawingBlock(assetId: string, partial: Partial<DrawingBlock> = {}): DrawingBlock {
  return {
    id: createId(),
    type: 'drawing',
    // Deliberately not full-slide by default: a brand-new (often mostly
    // transparent) drawing added from the toolbar would otherwise cover the
    // whole canvas at the highest z-index and silently swallow clicks meant
    // for every other block underneath it. Present mode's "save annotation"
    // flow passes its own full-slide x/y/w/h explicitly, since that one is
    // meant to capture the whole slide.
    x: 15,
    y: 10,
    w: 70,
    h: 80,
    rotation: 0,
    zIndex: nextZ(),
    assetId,
    ...partial,
  }
}

export function makeFileBlock(assetId: string, fileKind: FileKind, partial: Partial<FileBlock> = {}): FileBlock {
  return {
    id: createId(),
    type: 'file',
    x: 10,
    y: 10,
    w: 80,
    h: 80,
    rotation: 0,
    zIndex: nextZ(),
    assetId,
    fileKind,
    page: 1,
    ...partial,
  }
}

export function makeIconBlock(iconName: string, partial: Partial<IconBlock> = {}): IconBlock {
  return {
    id: createId(),
    type: 'icon',
    x: 40,
    y: 35,
    w: 20,
    h: 20 * (1280 / 720),
    rotation: 0,
    zIndex: nextZ(),
    iconName,
    color: '#211f1a',
    ...partial,
  }
}

export function makeMathBlock(partial: Partial<MathBlock> = {}): MathBlock {
  return {
    id: createId(),
    type: 'math',
    x: 20,
    y: 35,
    w: 60,
    h: 30,
    rotation: 0,
    zIndex: nextZ(),
    latex: '',
    fontSize: 32,
    color: '#211f1a',
    ...partial,
  }
}

export function makeFlowerGraphBlock(partial: Partial<FlowerGraphBlock> = {}): FlowerGraphBlock {
  return {
    id: createId(),
    type: 'flowerGraph',
    x: 20,
    y: 5,
    w: 60,
    h: 90,
    rotation: 0,
    zIndex: nextZ(),
    levels: defaultFlowerLevels(),
    ...partial,
  }
}

export function makeSlide(partial: Partial<Slide> = {}): Slide {
  return {
    id: createId(),
    order: 0,
    transition: 'fade' as TransitionType,
    background: '#ffffff',
    blocks: [],
    ...partial,
  }
}

export function cloneBlock(block: Block): Block {
  // Nudge the copy so it's visibly distinct from the original instead of
  // landing in a perfectly overlapping stack.
  return {
    ...block,
    id: createId(),
    zIndex: nextZ(),
    x: Math.min(block.x + 3, 100 - block.w),
    y: Math.min(block.y + 3, 100 - block.h),
  }
}
