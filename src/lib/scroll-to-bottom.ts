/**
 * Scroll the list a bottom sentinel sits in to its end — and only that list.
 *
 * `scrollIntoView` is the obvious call and the wrong one: it scrolls EVERY
 * scrollable ancestor until the element is visible, the page included, so
 * opening a thread halfway down a page dragged the whole page to the bottom.
 * This finds the nearest scrolling ancestor and moves that alone.
 */
export function scrollToBottom(
  sentinel: HTMLElement | null,
  behavior: ScrollBehavior = "auto",
): void {
  let node = sentinel?.parentElement ?? null;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") {
      node.scrollTo({ top: node.scrollHeight, behavior });
      return;
    }
    node = node.parentElement;
  }
}
