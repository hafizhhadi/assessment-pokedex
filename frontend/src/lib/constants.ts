/** Pokémon requested per page; the backend allows 1-50. */
export const PAGE_SIZE = 20;

/** Wait this long after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Cards that are visible without scrolling (about two rows). Their artwork loads immediately,
 * the rest loads lazily as the user scrolls. Next.js warns when the largest image on screen is lazy.
 */
export const EAGER_CARD_COUNT = 6;
