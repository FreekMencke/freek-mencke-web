export type DeckView = 'desk' | 'phone';

/** The side's width over its height, as deck-side.component.css has them too. The desktop pages lose their margins. */
export const DESK_RATIO = (2160 * 0.86) / 1350;
export const PHONE_RATIO = 780 / 1688;

export interface DeckMetrics {
  readonly width: number;
  /** How much of the second card shows past the first; each one further shows `falloff` of the one before */
  readonly peek: number;
  readonly falloff: number;
  /** How much smaller each card is than the one above it */
  readonly scaleStep: number;
  /** How far an edge slides out under the pointer */
  readonly nudge: number;
  /** How far apart each card moves with the pointer on the deck */
  readonly spread: number;
}

export interface CardPlace {
  /** The card's centre, from the left of the stage */
  readonly x: number;
  readonly scale: number;
  readonly depth: number;
  readonly layer: number;
  readonly veil: number;
}

export interface DeckLayout {
  /** By depth: the top card first */
  readonly places: readonly CardPlace[];
  readonly pile: { readonly left: number; readonly right: number };
}

export function deckMetrics(sizes: {
  span: number;
  narrow: boolean;
  deskWidth: number;
  phoneWidth: number;
  cards: number;
}): Record<DeckView, DeckMetrics> {
  const { span, narrow, deskWidth, phoneWidth, cards } = sizes;
  // However many cards there are, the fan fits the width
  const fitted = (cardWidth: number, wanted: number, falloff: number): number =>
    Math.min(wanted, (span - cardWidth) / ((1 - falloff ** (cards - 1)) / (1 - falloff)));
  const deskPeek = fitted(deskWidth, span * (narrow ? 0.075 : 0.08), 0.78);
  const phonePeek = fitted(phoneWidth, narrow ? span * 0.125 : phoneWidth * 0.6, 0.82);
  return {
    desk: {
      width: deskWidth,
      peek: deskPeek,
      falloff: 0.78,
      scaleStep: 0.028,
      nudge: deskPeek * 0.24,
      spread: deskPeek * 0.03,
    },
    // A phone card's edges show far more of it, so it answers the pointer by less
    phone: {
      width: phoneWidth,
      peek: phonePeek,
      falloff: 0.82,
      scaleStep: 0.02,
      nudge: phoneWidth * 0.04,
      spread: phoneWidth * 0.01,
    },
  };
}

export function deckLayout(cards: number, metrics: DeckMetrics, span: number): DeckLayout {
  const raw: { left: number; width: number; scale: number }[] = [];
  let right = 0;
  for (let depth = 0; depth < cards; depth++) {
    const scale = 1 - metrics.scaleStep * depth;
    const width = metrics.width * scale;
    const end = depth === 0 ? width : right + metrics.peek * metrics.falloff ** (depth - 1);
    raw.push({ left: end - width, width, scale });
    right = end;
  }
  const shift = (span - right) / 2;
  return {
    places: raw.map(({ left, width, scale }, depth) => ({
      x: left + width / 2 + shift,
      scale,
      depth,
      layer: 1000 - depth * 10,
      veil: Math.min(depth * 0.1, 0.4),
    })),
    pile: { left: shift, right: shift + right },
  };
}
