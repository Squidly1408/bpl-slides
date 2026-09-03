/** The app's mark: a rounded badge with an open aperture/ring — "seeing the
 * whole picture" — plus a focal dot. Kept in sync with public/icon-*.png /
 * gen-icons.mjs (favicon + PWA install icons). */
export default function Logo({ size = 32, color = 'var(--color-primary)', title = 'BPL Slides' }: { size?: number; color?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={title}>
      <rect width="32" height="32" rx="8" fill={color} />
      <circle cx="16" cy="16" r="8.4" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="33 18.8" transform="rotate(-55 16 16)" />
      <circle cx="16" cy="16" r="2.6" fill="#ffffff" />
    </svg>
  )
}
