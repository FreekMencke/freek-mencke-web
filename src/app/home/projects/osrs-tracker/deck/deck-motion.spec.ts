import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeckMotion, DeckState } from './deck-motion';

// The parts DeckMotion reads off each card, as deck-side.component.ts renders them
function card(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'card';
  for (const [view, width] of [
    ['desk', 600],
    ['phone', 200],
  ] as const) {
    const side = document.createElement('div');
    side.className = `side--${view}`;
    Object.defineProperty(side, 'offsetWidth', { value: width });
    for (const part of ['lifted', 'veil', 'shade']) {
      const i = document.createElement('i');
      i.className = part;
      side.append(i);
    }
    el.append(side);
  }
  el.animate = vi.fn();
  return el;
}

function pointer(type: string, clientX: number, timeStamp: number): PointerEvent {
  const event = new PointerEvent(type, { pointerId: 1, pointerType: 'touch', clientX, bubbles: true });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  return event;
}

describe('DeckMotion', () => {
  let stage: HTMLElement;
  let cards: HTMLElement[];
  let frames: FrameRequestCallback[];
  let states: DeckState[];
  let motion: DeckMotion;

  function start(reduced: boolean): void {
    vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
    motion = new DeckMotion(stage, cards, state => states.push(state));
  }

  /** Runs the frames asked for so far, a frame's time later, and says how many more those ask for */
  function runFrames(): number {
    const now = performance.now() + 16;
    frames.splice(0).forEach(frame => frame(now));
    return frames.length;
  }

  beforeEach(() => {
    stage = document.createElement('div');
    Object.defineProperty(stage, 'clientWidth', { value: 1000 });
    // jsdom has no pointer capture
    stage.setPointerCapture = vi.fn();
    cards = [card(), card(), card()];
    stage.append(...cards);
    document.body.append(stage);
    frames = [];
    states = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    motion.destroy();
    stage.remove();
    vi.unstubAllGlobals();
  });

  // Dragged 10px of a 600px card at 100px/s: short of a throw
  function shortDrag(): void {
    cards[0].dispatchEvent(pointer('pointerdown', 500, 0));
    cards[0].dispatchEvent(pointer('pointermove', 510, 100));
    runFrames();
    cards[0].dispatchEvent(pointer('pointerup', 510, 200));
  }

  it('puts a card back at once under reduced motion, with no spring left moving', () => {
    start(true);
    const atRest = cards[0].style.transform;

    shortDrag();

    expect(cards[0].style.transform).toBe(atRest);
    expect(runFrames()).toBe(0);
  });

  it('springs a card back otherwise', () => {
    start(false);
    const atRest = cards[0].style.transform;

    shortDrag();

    expect(runFrames()).toBe(1);
    expect(cards[0].style.transform).not.toBe(atRest);
  });

  it('turns to the next card under reduced motion without moving a card through the air', () => {
    start(true);
    const atRest = cards[0].style.transform;

    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(states.at(-1)).toEqual({ top: 1, view: 'desk', touched: true });
    expect(cards[0].style.transform).not.toBe(atRest);
    expect(cards[0].style.zIndex).toBe('980');
    expect(cards[1].animate).toHaveBeenCalledOnce();
    expect(frames).toHaveLength(0);
  });
});
