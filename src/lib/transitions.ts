import type { TransitionType } from '../types'

const CLASS_BY_TRANSITION: Record<TransitionType, string> = {
  none: '',
  fade: 'bpe-t-fade',
  'slide-left': 'bpe-t-slide-left',
  'slide-right': 'bpe-t-slide-right',
  'slide-up': 'bpe-t-slide-up',
  'slide-down': 'bpe-t-slide-down',
  zoom: 'bpe-t-zoom',
  flip: 'bpe-t-flip',
}

export function transitionClassName(t: TransitionType): string {
  return CLASS_BY_TRANSITION[t] ?? ''
}
