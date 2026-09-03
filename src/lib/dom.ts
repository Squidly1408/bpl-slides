/** True when the event target is a text-editing control — global keyboard shortcuts (delete, nudge, undo) should back off and let native input behaviour happen instead. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}
