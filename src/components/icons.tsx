import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(size: number, props: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function IconEdit({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  )
}

export function IconTrash({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconCopy({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

export function IconPlay({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l6 3.5-6 3.5v-7Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconDownload({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  )
}

export function IconUpload({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 21V9" />
      <path d="M7 14l5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  )
}

export function IconPlus({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconUndo({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M8 7L4 11l4 4" />
      <path d="M4 11h10a6 6 0 0 1 0 12h-2" />
    </svg>
  )
}

export function IconRedo({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M16 7l4 4-4 4" />
      <path d="M20 11H10a6 6 0 0 0 0 12h2" />
    </svg>
  )
}

export function IconFileText({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 12h5M9.5 15h5M9.5 9.5h2" />
    </svg>
  )
}

export function IconFolderOpen({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v1H3Z" />
      <path d="M3 8l1.5 11h15L21 10H5" />
    </svg>
  )
}

export function IconSun({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </svg>
  )
}

export function IconMoon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

export function IconType({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M5 6h14M12 6v13" />
    </svg>
  )
}

export function IconShape({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="4" y="4" width="16" height="16" rx="5" />
    </svg>
  )
}

export function IconImage({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M3 17l5.5-5.5a2 2 0 0 1 2.8 0L18 18" />
    </svg>
  )
}

export function IconVideo({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10.5l5-2.8v8.6l-5-2.8Z" />
    </svg>
  )
}

export function IconAudio({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M9 17V5.5l10-2v11.5" />
      <circle cx="6.5" cy="17" r="2.5" />
      <circle cx="16.5" cy="14.5" r="2.5" />
    </svg>
  )
}

export function IconGlobe({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5Z" />
    </svg>
  )
}

export function IconCube({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" />
      <path d="M4 8l8 4.5L20 8M12 12.5V21" />
    </svg>
  )
}

export function IconPen({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l4 4" />
      <path d="M4 20l.7-3" />
    </svg>
  )
}

export function IconBadge({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14.5 7.5 21l4.5-2.5L16.5 21 15 14.5" />
    </svg>
  )
}

export function IconBriefcase({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  )
}

export function IconChevronLeft({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function IconLink({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.6 4.9a3.5 3.5 0 0 1 5 5L15.9 11.4" />
      <path d="M13 17.5 11.4 19.1a3.5 3.5 0 1 1-5-5L8.1 12.6" />
    </svg>
  )
}

export function IconFile({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 13h5M9.5 16h5" />
    </svg>
  )
}

export function IconChevronRight({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconStarSmall({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 3.5l2.5 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.7l-5.2 2.9 1.1-5.9-4.3-4.1 5.9-.7L12 3.5Z" />
    </svg>
  )
}

export function IconSigma({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M18 5H6l6 7-6 7h12" />
    </svg>
  )
}

export function IconFlower({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 3.5c1.8 0 3 1.6 2.3 3.4L13 9.8" />
      <path d="M20.5 12c0 1.8-1.6 3-3.4 2.3L14.2 13" />
      <path d="M12 20.5c-1.8 0-3-1.6-2.3-3.4L11 14.2" />
      <path d="M3.5 12c0-1.8 1.6-3 3.4-2.3L9.8 11" />
      <path d="M17.7 6.3c1.3 1.3 1.3 3.2 0 4.4l-2.4-.7" />
      <path d="M6.3 17.7c-1.3-1.3-1.3-3.2 0-4.4l2.4.7" />
    </svg>
  )
}

export function IconHelp({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.5-1.2 1-1.2 2" />
      <path d="M12 17v.1" />
    </svg>
  )
}

export function IconTable({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17" />
      <path d="M9.5 9.5v10" />
      <path d="M15 9.5v10" />
    </svg>
  )
}
