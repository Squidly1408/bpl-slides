import {
  IconAudio,
  IconBadge,
  IconBriefcase,
  IconCube,
  IconFile,
  IconFlower,
  IconGlobe,
  IconImage,
  IconLink,
  IconPen,
  IconShape,
  IconSigma,
  IconStarSmall,
  IconTable,
  IconType,
  IconVideo,
} from './icons'

export interface AddBlockHandlers {
  onAddText: () => void
  onAddShape: () => void
  onAddMedia: (kind: 'image' | 'video' | 'audio' | 'mesh' | 'file', file: File) => void
  onAddEmbed: () => void
  onAddLink: () => void
  onAddDrawing: () => void
  onAddIcon: () => void
  onAddMath: () => void
  onAddGrid: () => void
  onAddFlowerGraph: () => void
  onAddIbplcSlide: () => void
  onAddInternshipSlide: () => void
}

const MEDIA_ITEMS: { kind: 'image' | 'video' | 'audio' | 'mesh' | 'file'; label: string; accept: string; icon: (s: number) => React.ReactNode }[] = [
  { kind: 'image', label: 'Image', accept: 'image/*', icon: (s) => <IconImage size={s} /> },
  { kind: 'video', label: 'Video', accept: 'video/*', icon: (s) => <IconVideo size={s} /> },
  { kind: 'audio', label: 'Audio', accept: 'audio/*', icon: (s) => <IconAudio size={s} /> },
  { kind: 'file', label: 'PDF / Word', accept: '.pdf,.doc,.docx', icon: (s) => <IconFile size={s} /> },
  { kind: 'mesh', label: '3D model', accept: '.stl,.obj,.glb,.gltf', icon: (s) => <IconCube size={s} /> },
]

/** The "add a block" menu — a slim icon rail beside the canvas on desktop, or
 * an icon grid inside the mobile "Add" drawer. `onAction`, if given, fires
 * after any add action completes (e.g. to close the drawer it's in) — for
 * file-picker items this fires from onChange, once a file was actually
 * chosen, not on click, or closing the drawer immediately would tear down
 * the <input> before the OS file dialog resolves and drop the selection. */
export default function AddBlockMenu({
  handlers,
  variant,
  onAction,
}: {
  handlers: AddBlockHandlers
  variant: 'rail' | 'grid'
  onAction?: () => void
}) {
  const isRail = variant === 'rail'
  const itemCls = isRail
    ? 'flex flex-col items-center gap-1 rounded-lg px-1.5 py-2.5 text-[10px] leading-tight'
    : 'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs'
  const itemStyle = isRail ? {} : { borderColor: 'var(--color-border)', background: 'var(--color-surface)' }
  const iconSize = isRail ? 19 : 20

  function run(action: () => void) {
    action()
    onAction?.()
  }

  return (
    <div className={isRail ? 'flex flex-col items-center gap-1 py-2' : 'grid grid-cols-3 gap-2 sm:grid-cols-4'}>
      <button onClick={() => run(handlers.onAddText)} className={itemCls} style={itemStyle} title="Add text">
        <IconType size={iconSize} /> Text
      </button>
      <button onClick={() => run(handlers.onAddShape)} className={itemCls} style={itemStyle} title="Add shape">
        <IconShape size={iconSize} /> Shape
      </button>
      <button onClick={() => run(handlers.onAddLink)} className={itemCls} style={itemStyle} title="Add a link">
        <IconLink size={iconSize} /> Link
      </button>
      {MEDIA_ITEMS.map((item) => (
        <label key={item.kind} className={`cursor-pointer ${itemCls}`} style={itemStyle} title={`Add ${item.label.toLowerCase()}`}>
          {item.icon(iconSize)} {item.label}
          <input
            type="file"
            accept={item.accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) run(() => handlers.onAddMedia(item.kind, file))
            }}
          />
        </label>
      ))}
      <button onClick={() => run(handlers.onAddEmbed)} className={itemCls} style={itemStyle} title="Add website">
        <IconGlobe size={iconSize} /> Website
      </button>
      <button onClick={() => run(handlers.onAddDrawing)} className={itemCls} style={itemStyle} title="Add drawing">
        <IconPen size={iconSize} /> Drawing
      </button>
      <button onClick={() => run(handlers.onAddIcon)} className={itemCls} style={itemStyle} title="Add an icon (searchable, offline)">
        <IconStarSmall size={iconSize} /> Icon
      </button>
      <button onClick={() => run(handlers.onAddMath)} className={itemCls} style={itemStyle} title="Add a maths expression or a photo of maths">
        <IconSigma size={iconSize} /> Maths
      </button>
      <button onClick={() => run(handlers.onAddGrid)} className={itemCls} style={itemStyle} title="Add a data table">
        <IconTable size={iconSize} /> Table
      </button>
      <div className={isRail ? 'my-1 h-px w-8' : 'col-span-full my-1 h-px'} style={{ background: 'var(--color-border)' }} />
      <button onClick={() => run(handlers.onAddIbplcSlide)} className={itemCls} style={itemStyle} title="Insert an IBPLC slide">
        <IconBadge size={iconSize} /> IBPLC
      </button>
      <button onClick={() => run(handlers.onAddInternshipSlide)} className={itemCls} style={itemStyle} title="Insert an internship slide">
        <IconBriefcase size={iconSize} /> Internship
      </button>
      <button onClick={() => run(handlers.onAddFlowerGraph)} className={itemCls} style={itemStyle} title="Add the editable Big Picture Learning Flower">
        <IconFlower size={iconSize} /> Flower
      </button>
    </div>
  )
}
