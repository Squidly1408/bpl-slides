/** The app's mark. Renders the actual favicon file (public/favicon.svg) so
 * there's exactly one logo asset for the whole app to stay in sync with —
 * update the favicon and every place this component appears follows,
 * instead of a separate hand-drawn shape that could (and did) drift out of
 * sync with it. It's a self-contained white badge, so unlike a themed fill
 * colour it reads correctly on any background without extra logic. */
export default function Logo({ size = 32, title = 'BPL Slides' }: { size?: number; title?: string }) {
  return <img src="/favicon.svg" width={size} height={size} alt={title} />
}
