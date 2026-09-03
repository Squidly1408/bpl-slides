import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        That page doesn't exist.
      </p>
      <Link to="/" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
        Back to my projects
      </Link>
    </div>
  )
}
