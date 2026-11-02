import { describe, expect, it } from 'vitest';
import { deckLayout, DeckMetrics, deckMetrics } from './deck-layout';

const metrics: DeckMetrics = { width: 100, peek: 20, falloff: 0.5, scaleStep: 0.1, nudge: 0, spread: 0 };

describe('deckLayout', () => {
  it('shows an edge of every card past the one above it, and centres the fan', () => {
    const { places, pile } = deckLayout(3, metrics, 200);

    expect(places.map(place => place.x)).toEqual([85, 110, 125]);
    expect(places.map(place => place.scale)).toEqual([1, 0.9, 0.8]);
    expect(pile).toEqual({ left: 35, right: 165 });
  });

  it('keeps the top card on top and the deeper ones further back', () => {
    const { places } = deckLayout(7, metrics, 200);

    expect(places.map(place => place.layer)).toEqual([1000, 990, 980, 970, 960, 950, 940]);
    expect(places.map(place => +place.veil.toFixed(2))).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.4, 0.4]);
  });
});

describe('deckMetrics', () => {
  // Seven phone cards at 358px wide don't fit at the peek a wider screen gets
  it('tightens the fan so it fits a narrow stage', () => {
    const { phone } = deckMetrics({ span: 358, narrow: true, deskWidth: 279, phoneWidth: 215, cards: 7 });
    const { pile } = deckLayout(7, phone, 358);

    expect(phone.peek).toBeCloseTo(36.98, 2);
    expect(pile.left).toBeCloseTo(0, 5);
    expect(pile.right).toBeCloseTo(358, 5);
  });

  it('leaves the fan as it is where there is room', () => {
    const { desk } = deckMetrics({ span: 1312, narrow: false, deskWidth: 830, phoneWidth: 279, cards: 7 });

    expect(desk.peek).toBeCloseTo(104.96, 2);
  });

  it('moves a phone card less under the pointer than a desktop one, for what shows of it', () => {
    const { desk, phone } = deckMetrics({ span: 1312, narrow: false, deskWidth: 830, phoneWidth: 279, cards: 7 });

    expect(desk.nudge).toBeCloseTo(25.19, 2);
    expect(phone.nudge).toBeCloseTo(11.16, 2);
  });
});
