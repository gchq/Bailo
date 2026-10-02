/**
 * Scrolls to the element with the given id, e.g. a question in a form, when it is on the page. Matches where the
 * browser puts an element when its anchor is followed, so that the two cannot disagree and jump about.
 */
export function scrollToElementId(id: string) {
  document.getElementById(id)?.scrollIntoView?.({ block: 'start' })
}
