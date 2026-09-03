/**
 * Best-guess current Australian school term, used only to pre-fill the "Term
 * & year" field when creating a project — students can (and should) correct
 * it, since exact term dates vary by state and school.
 */
export function currentTermLabel(date: Date = new Date()): string {
  const month = date.getMonth() // 0-11
  const year = date.getFullYear()
  const term = month <= 2 ? 1 : month <= 5 ? 2 : month <= 8 ? 3 : 4
  return `Term ${term} ${year}`
}
