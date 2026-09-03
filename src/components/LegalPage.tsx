import type { ReactNode } from 'react'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">{title}</h1>
      <p className="mb-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Last updated {updated}
      </p>
      <div className="flex flex-col gap-5 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">{heading}</h2>
      <div className="flex flex-col gap-2" style={{ color: 'var(--color-text)' }}>
        {children}
      </div>
    </section>
  )
}
