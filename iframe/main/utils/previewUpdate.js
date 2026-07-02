export const PREVIEW_UPDATE_EVENT = 'ajaxModifierMatchUrlPreviewUpdate'

export function notifyMatchUrlPreviewUpdate () {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PREVIEW_UPDATE_EVENT))
  }
}
