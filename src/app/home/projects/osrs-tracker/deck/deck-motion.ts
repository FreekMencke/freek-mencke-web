import {
  CardPlace,
  DeckLayout,
  deckLayout,
  DeckMetrics,
  deckMetrics,
  DeckView,
  throwDirection,
  toBack,
  toTop,
} from './deck-layout';
import { advanceSpring, makeSpring, Spring, tune } from './spring';

export interface DeckState {
  /** The card on top, by its place in the markup */
  readonly top: number;
  readonly view: DeckView;
  /** Whether a person has moved the deck yet */
  readonly touched: boolean;
}

interface Flight {
  readonly kind: 'out' | 'over';
  readonly direction: number;
  readonly aimAt: number;
  since: number;
  windUp: number;
}

interface DeckCard {
  readonly index: number;
  readonly el: HTMLElement;
  readonly desk: HTMLElement;
  readonly phone: HTMLElement;
  readonly shadeDesk: HTMLElement;
  readonly shadePhone: HTMLElement;
  readonly veils: readonly HTMLElement[];
  readonly lifts: readonly HTMLElement[];
  readonly x: Spring;
  readonly scale: Spring;
  readonly spin: Spring;
  readonly tiltX: Spring;
  readonly tiltY: Spring;
  readonly veil: Spring;
  readonly lift: Spring;
  readonly flip: Spring;
  place: CardPlace;
  flight: Flight | null;
  pending: { at: number; stiffness: number; ratio: number } | null;
  flipPending: { at: number; to: number } | null;
  landing: boolean;
  layer: number;
  shownLayer?: number;
  shownVeil?: string;
  shownLift?: string;
}

interface Drag {
  readonly id: number;
  readonly startX: number;
  readonly card: DeckCard;
  readonly pressed: DeckCard | undefined;
  moved: boolean;
  lastX: number;
  lastTime: number;
  speed: number;
  dx: number;
}

const SPRINGS = ['x', 'scale', 'spin', 'tiltX', 'tiltY', 'veil', 'lift', 'flip'] as const;
// Above every card at rest, so a card in the air passes over the pile
const IN_THE_AIR = 3000;
// How far past the point where it's clear a card aims, so it's still moving when it gets there and doesn't stop
const AIM_PAST = 0.95;

const clamp = (low: number, high: number, value: number): number => Math.min(high, Math.max(low, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Everything that moves the deck. The cards are springs, stepped once a frame and only while something is moving, and
 * every transform is written straight to the element: this runs at 60 frames a second and Angular needn't know.
 */
export class DeckMotion {
  private readonly cards: readonly DeckCard[];
  private readonly listeners = new AbortController();
  private readonly resizes: ResizeObserver;
  private readonly reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  private firstSight: IntersectionObserver | null = null;

  private order: DeckCard[];
  private view: DeckView = 'desk';
  private viewChosen = false;
  private touched = false;
  private span = 0;
  private fit = '';
  private sizes!: Record<DeckView, DeckMetrics>;
  private pile: DeckLayout['pile'] = { left: 0, right: 0 };
  private clock = 0;
  private flights = 0;
  private fan = 0;
  private hovered: DeckCard | null = null;
  private drag: Drag | null = null;
  private frame: number | null = null;
  private lastFrame = 0;

  constructor(
    private readonly stage: HTMLElement,
    elements: readonly HTMLElement[],
    private readonly report: (state: DeckState) => void,
  ) {
    const place: CardPlace = { x: 0, scale: 1, depth: 0, layer: 1000, veil: 0 };
    this.cards = elements.map((el, index) => ({
      index,
      el,
      desk: el.querySelector<HTMLElement>('.side--desk')!,
      phone: el.querySelector<HTMLElement>('.side--phone')!,
      shadeDesk: el.querySelector<HTMLElement>('.side--desk .shade')!,
      shadePhone: el.querySelector<HTMLElement>('.side--phone .shade')!,
      veils: [...el.querySelectorAll<HTMLElement>('.veil')],
      lifts: [...el.querySelectorAll<HTMLElement>('.lifted')],
      x: makeSpring(0, 190, 0.7, 0.05),
      scale: makeSpring(1, 280, 0.68, 0.0002),
      spin: makeSpring(0, 150, 0.62, 0.01),
      tiltX: makeSpring(0, 120, 0.8, 0.01),
      tiltY: makeSpring(0, 120, 0.8, 0.01),
      veil: makeSpring(0, 200, 1, 0.001),
      lift: makeSpring(0, 220, 1, 0.001),
      flip: makeSpring(0, 95, 0.74, 0.0005),
      place,
      flight: null,
      pending: null,
      flipPending: null,
      landing: false,
      layer: 1000,
    }));
    this.order = [...this.cards];

    this.listen();
    this.measure();
    this.resizes = new ResizeObserver(() => this.measure());
    this.resizes.observe(stage);
    this.watchForFirstSight();
  }

  destroy(): void {
    this.listeners.abort();
    this.resizes.disconnect();
    this.firstSight?.disconnect();
    if (this.frame !== null) cancelAnimationFrame(this.frame);
  }

  private get reduced(): boolean {
    return this.reducedQuery.matches;
  }

  // ---------- what the deck can do ----------

  /** Over the fan and round its far edge: the back of the deck is on that side, so the card goes where it ends up */
  next(): void {
    this.toss(1);
  }

  /** The same path in reverse */
  previous(): void {
    this.pull(this.order[this.order.length - 1]);
  }

  /** Every card turns over, the top one first: a page's desktop screen is on one side, its phone screen on the other */
  setView(view: DeckView): void {
    if (view === this.view) return;
    this.view = view;
    this.viewChosen = true;
    this.interacted();
    const to = view === 'phone' ? 1 : 0;
    if (this.reduced) {
      this.cards.forEach(card => {
        card.flip.target = to;
      });
      this.instead(this.order[0]);
      return;
    }
    this.order.forEach((card, depth) => {
      card.flipPending = { at: this.clock + depth * 0.05, to };
    });
    this.settle({ start: 0.02, stagger: 0.04, stiffness: 140, ratio: 0.78 });
    this.changed();
  }

  private toss(direction: number, velocity?: number): void {
    this.interacted();
    const top = this.order[0];
    this.order = toBack(this.order);
    if (this.reduced) {
      this.instead(this.order[0]);
      return;
    }
    this.storeLayout();
    const flung = velocity !== undefined;
    if (flung) top.x.velocity = velocity;
    this.launch(top, 'out', direction, flung);
    this.settle({
      start: flung ? 0.03 : 0.11,
      stagger: 0.04,
      stiffness: 170,
      ratio: 0.64,
      topStiffness: 210,
      topRatio: 0.68,
    });
    this.changed();
  }

  private pull(card: DeckCard): void {
    const from = this.order.indexOf(card);
    if (from <= 0) return;
    this.interacted();
    this.order = toTop(this.order, from);
    if (this.reduced) {
      this.instead(card);
      return;
    }
    this.storeLayout();
    this.launch(card, 'over', 1, false);
    this.settle({ start: 0.22, stagger: 0.026, stiffness: 165, ratio: 0.66 });
    this.changed();
  }

  /** Under reduced motion nothing travels: the new top card only fades in */
  private instead(card: DeckCard): void {
    this.storeLayout();
    this.snapAll();
    card.el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
    this.changed();
  }

  private interacted(): void {
    this.touched = true;
    this.firstSight?.disconnect();
    this.firstSight = null;
  }

  private changed(): void {
    this.report({ top: this.order[0].index, view: this.view, touched: this.touched });
  }

  // ---------- where every card rests ----------

  private storeLayout(): void {
    const { places, pile } = deckLayout(this.order.length, this.sizes[this.view], this.span);
    this.pile = pile;
    this.order.forEach((card, depth) => {
      card.place = places[depth];
    });
  }

  private toRest(card: DeckCard): void {
    const { x, depth, scale, veil, layer } = card.place;
    const hovered = card === this.hovered;
    card.x.target = x + depth * this.fan + (hovered ? this.sizes[this.view].nudge : 0);
    card.scale.target = scale;
    card.veil.target = hovered ? veil * 0.35 : veil;
    card.spin.target = 0;
    card.lift.target = 0;
    if (card.layer < IN_THE_AIR) card.layer = layer;
  }

  /** Everyone not in the air goes to their place: the first soonest, the deepest last, so a ripple runs down the edges */
  private settle(options: {
    start?: number;
    stagger?: number;
    stiffness?: number;
    ratio?: number;
    topStiffness?: number;
    topRatio?: number;
  }): void {
    const { start = 0, stagger = 0, stiffness = 190, ratio = 0.7 } = options;
    const { topStiffness = stiffness, topRatio = ratio } = options;
    this.storeLayout();
    this.order.forEach((card, depth) => {
      if (card.flight || card.landing || (this.drag?.moved && card === this.drag.card)) return;
      // At once for everyone: staggered, two cards can hold the same layer for a moment and swap places
      if (card.layer < IN_THE_AIR) card.layer = card.place.layer;
      card.pending = {
        at: this.clock + start + stagger * depth,
        stiffness: depth ? stiffness : topStiffness,
        ratio: depth ? ratio : topRatio,
      };
    });
    this.wake();
  }

  /** Moves the cards at rest to where they should be now, no ripple */
  private adjust(stiffness: number, ratio: number): void {
    this.order.forEach(card => {
      if (card.flight || card.landing || card.pending) return;
      tune(card.x, stiffness, ratio);
      this.toRest(card);
    });
    this.wake();
  }

  // ---------- flights ----------

  /**
   * A card leaves the pile by sliding clear of it: only with nothing overlapping can it change layers without that
   * showing. The wind-up is the anticipation: a card thrown by the hand already has its speed, so it skips it.
   */
  private launch(card: DeckCard, kind: Flight['kind'], direction: number, flung: boolean): void {
    card.pending = null;
    const { width, peek } = this.sizes[this.view];
    const aimAt = direction < 0 ? this.pile.left - width * AIM_PAST : this.pile.right + width * AIM_PAST;
    const windUp = kind === 'out' && !flung ? 0.09 : 0;
    card.flight = { kind, direction, aimAt, since: this.clock, windUp };
    card.lift.target = 1;
    card.tiltX.target = 0;
    card.tiltY.target = 0;
    if (windUp) {
      tune(card.x, 420, 1);
      card.x.target = card.x.value - direction * peek * 0.16;
    } else {
      tune(card.x, kind === 'out' ? 125 : 150, 0.9);
      card.x.target = aimAt;
    }
    if (kind === 'out') {
      card.scale.target = 1.025;
      card.layer = IN_THE_AIR + ++this.flights * 10;
    } else {
      card.layer -= 5;
    }
  }

  private advanceFlight(card: DeckCard): void {
    const flight = card.flight;
    if (!flight) return;
    if (flight.windUp) {
      if (this.clock - flight.since < flight.windUp) return;
      flight.windUp = 0;
      flight.since = this.clock;
      tune(card.x, 125, 0.9);
      card.x.target = flight.aimAt;
    }
    const half = (this.sizes[this.view].width * card.scale.value) / 2;
    const clear = flight.direction > 0 ? card.x.value - half >= this.pile.right : card.x.value + half <= this.pile.left;
    if (!clear && this.clock - flight.since < 1) return;
    card.flight = null;
    if (flight.kind === 'out') {
      // Under the pile, and back along behind it
      card.layer = card.place.layer;
      tune(card.x, 110, 0.92);
      tune(card.scale, 120, 1);
      this.toRest(card);
    } else {
      // Out from behind the pile, so now over the top of it
      card.layer = IN_THE_AIR + ++this.flights * 10;
      tune(card.x, 150, 0.76);
      tune(card.scale, 180, 0.72);
      this.toRest(card);
      card.lift.target = 1;
      card.landing = true;
    }
  }

  private advanceLanding(card: DeckCard): void {
    if (!card.landing || Math.abs(card.x.value - card.x.target) > this.sizes[this.view].width * 0.05) return;
    card.landing = false;
    card.lift.target = 0;
    card.layer = card.place.layer;
    // It knocks the pile as it comes down
    const knock = card.x.velocity;
    this.order.slice(1).forEach((other, i) => {
      other.x.velocity += knock * 0.07 * (1 - i * 0.16);
      other.spin.velocity += knock * 0.012 * (1 - i * 0.16);
    });
  }

  // ---------- the frame ----------

  private render(card: DeckCard): void {
    const turning = Math.sin(clamp(0, 1, card.flip.value) * Math.PI);
    const z = turning * 70 + card.lift.value * 24;
    // It leans a little into its speed, as something pushed across a table does
    const sway = this.reduced ? 0 : clamp(-1.6, 1.6, card.x.velocity * 0.001);
    const angle = card.flip.value * 180 + card.tiltY.value;
    card.el.style.transform =
      `translate3d(${card.x.value.toFixed(2)}px, 0, 0) perspective(${(this.span * 2).toFixed(0)}px) ` +
      `translateZ(${z.toFixed(2)}px) rotateZ(${(card.spin.value + sway).toFixed(3)}deg) ` +
      `rotateX(${card.tiltX.value.toFixed(3)}deg) rotateY(${angle.toFixed(3)}deg) scale(${card.scale.value.toFixed(4)})`;
    if (card.shownLayer !== card.layer) {
      card.el.style.zIndex = String(card.layer);
      card.shownLayer = card.layer;
    }
    const veil = clamp(0, 1, card.veil.value).toFixed(3);
    if (card.shownVeil !== veil) {
      card.veils.forEach(el => {
        el.style.opacity = veil;
      });
      card.shownVeil = veil;
    }
    const lift = clamp(0, 1, Math.max(card.lift.value, turning * 0.7)).toFixed(3);
    if (card.shownLift !== lift) {
      card.lifts.forEach(el => {
        el.style.opacity = lift;
      });
      card.shownLift = lift;
    }
    // Whichever side faces us, the edge turned away from us is the dark one
    const onDesk = Math.abs(angle) <= 90;
    const facing = onDesk ? angle : angle - 180;
    const shade = onDesk ? card.shadeDesk : card.shadePhone;
    const other = onDesk ? card.shadePhone : card.shadeDesk;
    shade.style.opacity = Math.min(Math.abs(facing) / 60, 1).toFixed(3);
    shade.style.transform = facing < 0 ? 'none' : 'scaleX(-1)';
    if (other.style.opacity !== '0') other.style.opacity = '0';
  }

  private advance(seconds: number): boolean {
    this.clock += seconds;
    let moving = false;
    for (const card of this.cards) {
      if (card.pending && card.pending.at <= this.clock) {
        tune(card.x, card.pending.stiffness, card.pending.ratio);
        this.toRest(card);
        card.pending = null;
      }
      if (card.flipPending && card.flipPending.at <= this.clock) {
        card.flip.target = card.flipPending.to;
        card.flipPending = null;
      }
      for (const name of SPRINGS) {
        if (advanceSpring(card[name], seconds)) moving = true;
      }
      this.advanceFlight(card);
      this.advanceLanding(card);
      this.render(card);
      if (card.pending || card.flipPending || card.flight || card.landing) moving = true;
    }
    return moving;
  }

  private wake(): void {
    if (this.frame !== null) return;
    this.lastFrame = performance.now();
    this.frame = requestAnimationFrame(now => this.onFrame(now));
  }

  private onFrame(now: number): void {
    this.frame = null;
    const seconds = clamp(0, 0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (this.advance(seconds)) this.frame = requestAnimationFrame(next => this.onFrame(next));
  }

  private snapAll(): void {
    this.cards.forEach(card => {
      card.pending = null;
      card.flight = null;
      card.landing = false;
      if (card.flipPending) {
        card.flip.target = card.flipPending.to;
        card.flipPending = null;
      }
      card.layer = card.place.layer;
      this.toRest(card);
      card.tiltX.target = 0;
      card.tiltY.target = 0;
      for (const name of SPRINGS) {
        card[name].value = card[name].target;
        card[name].velocity = 0;
      }
      this.render(card);
    });
  }

  // ---------- the hand ----------

  private listen(): void {
    const { signal } = this.listeners;
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (event: HTMLElementEventMap[K]) => void,
    ): void => this.stage.addEventListener(type, listener, { signal });
    on('pointerdown', event => this.press(event));
    on('pointermove', event => this.move(event));
    on('pointerup', event => this.letGo(event, false));
    on('pointercancel', event => this.letGo(event, true));
    on('pointerleave', event => this.leave(event));
    on('keydown', event => {
      if (event.target !== this.stage) return;
      if (event.key === 'ArrowLeft') this.previous();
      else if (event.key === 'ArrowRight') this.next();
      else return;
      event.preventDefault();
    });
  }

  private cardAt(event: Event): DeckCard | undefined {
    const el = (event.target as Element).closest('.card');
    return this.cards.find(card => card.el === el);
  }

  private press(event: PointerEvent): void {
    // One hand at a time: a second finger taking over would leave the first one's card stuck where it was dragged to
    if (event.button || this.drag) return;
    // From the press, not the first move: let go outside the stage and it still hears about it
    this.stage.setPointerCapture(event.pointerId);
    const top = this.order[0];
    const pressed = this.cardAt(event);
    this.drag = {
      id: event.pointerId,
      startX: event.clientX,
      card: top,
      pressed,
      moved: false,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      speed: 0,
      dx: 0,
    };
    if (pressed === top && !this.reduced) {
      // It comes up to meet the hand
      top.lift.target = 0.55;
      top.scale.target = 1.012;
      this.wake();
    }
  }

  private move(event: PointerEvent): void {
    if (!this.drag) {
      this.hover(event);
      return;
    }
    if (event.pointerId !== this.drag.id) return;
    const drag = this.drag;
    const top = drag.card;
    const dx = event.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < 6) return;
      drag.moved = true;
      this.stage.classList.add('is-dragging');
      top.pending = null;
      top.layer = IN_THE_AIR + ++this.flights * 10;
      top.tiltX.target = 0;
      top.tiltY.target = 0;
      this.setHovered(null);
      tune(top.x, 900, 1);
    }
    const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
    drag.speed = lerp(drag.speed, ((event.clientX - drag.lastX) / elapsed) * 1000, 0.55);
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    drag.dx = dx;
    top.x.target = top.place.x + dx;
    if (!this.reduced) {
      top.spin.target = clamp(-1.5, 1.5, dx / 240);
      top.lift.target = 0.8;
      // The rest start moving up as it comes off them, so letting go only finishes what the hand began
      const { places } = deckLayout(this.order.length, this.sizes[this.view], this.span);
      const coming = clamp(0, 1, Math.abs(dx) / (this.sizes[this.view].width * 0.55));
      this.order.slice(1).forEach(card => {
        const from = card.place;
        const to = places[from.depth - 1];
        card.x.target = lerp(from.x, to.x, coming * 0.5);
        card.scale.target = lerp(from.scale, to.scale, coming * 0.7);
        card.veil.target = lerp(from.veil, to.veil, coming * 0.8);
      });
    }
    this.wake();
  }

  private letGo(event: PointerEvent, cancelled: boolean): void {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    const { card: top, pressed, moved, dx, speed } = this.drag;
    this.stage.classList.remove('is-dragging');
    this.drag = null;
    if (!moved) {
      top.lift.target = 0;
      top.scale.target = top.place.scale;
      if (!cancelled && pressed && pressed !== top) {
        this.setHovered(null);
        this.pull(pressed);
      }
      this.wake();
      return;
    }
    const direction = cancelled ? 0 : throwDirection({ dx, speed, width: this.sizes[this.view].width });
    if (direction) {
      this.toss(direction, clamp(-3600, 3600, speed));
    } else if (this.reduced) {
      this.storeLayout();
      this.snapAll();
    } else {
      // Not far enough: back where it was, with a little give
      tune(top.x, 240, 0.6);
      top.layer = top.place.layer;
      this.settle({ stiffness: 240, ratio: 0.62 });
    }
  }

  private hover(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || this.reduced) return;
    const card = this.cardAt(event);
    const top = this.order[0];
    this.setFan(this.sizes[this.view].spread);
    this.setHovered(card && card !== top ? card : null);
    if (card === top && !card.flight) this.leanTowards(event);
    else this.stand(top);
    this.wake();
  }

  private leave(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || this.drag) return;
    this.setHovered(null);
    this.setFan(0);
    this.stand(this.order[0]);
    this.wake();
  }

  private setHovered(card: DeckCard | null): void {
    if (card === this.hovered) return;
    this.hovered = card;
    this.adjust(200, 0.72);
  }

  private setFan(value: number): void {
    if (value === this.fan) return;
    this.fan = value;
    this.adjust(170, 0.74);
  }

  private leanTowards(event: PointerEvent): void {
    const top = this.order[0];
    const box = this.stage.getBoundingClientRect();
    const width = this.sizes[this.view].width;
    const across = (event.clientX - box.left - top.x.value) / width;
    const down = (event.clientY - box.top - box.height / 2) / box.height;
    top.tiltY.target = clamp(-0.5, 0.5, across) * 5;
    top.tiltX.target = clamp(-0.5, 0.5, down) * -4;
  }

  private stand(card: DeckCard): void {
    card.tiltX.target = 0;
    card.tiltY.target = 0;
  }

  // ---------- sizes ----------

  /** The sizes come from the stylesheet, so the page before and after this code runs agree on them */
  private measure(): void {
    const span = this.stage.clientWidth;
    const fit = getComputedStyle(this.stage).getPropertyValue('--fit').trim();
    if (span === this.span && fit === this.fit) return;
    this.span = span;
    this.fit = fit;
    const narrow = fit === 'narrow';
    this.sizes = deckMetrics({
      span,
      narrow,
      deskWidth: this.cards[0].desk.offsetWidth,
      phoneWidth: this.cards[0].phone.offsetWidth,
      cards: this.cards.length,
    });
    if (!this.viewChosen) {
      this.view = narrow ? 'phone' : 'desk';
      this.cards.forEach(card => {
        card.flip.target = narrow ? 1 : 0;
      });
    }
    this.storeLayout();
    this.snapAll();
    this.changed();
  }

  /**
   * The one thing that moves by itself: once, on first sight, the squared-up deck fans out to show it is a deck. Only
   * when it's out of sight to begin with: a deck already on screen stays as it is rather than jump to square.
   */
  private watchForFirstSight(): void {
    if (this.reduced) return;
    let checked = false;
    this.firstSight = new IntersectionObserver(
      entries => {
        // The last entry: fonts arriving can move the deck twice before the first callback
        const { intersectionRatio } = entries[entries.length - 1];
        if (!checked) {
          checked = true;
          if (intersectionRatio > 0) {
            this.firstSight?.disconnect();
            this.firstSight = null;
          } else {
            this.squareUp();
          }
          return;
        }
        if (intersectionRatio < 0.3) return;
        this.firstSight?.disconnect();
        this.firstSight = null;
        this.settle({ start: 0.05, stagger: 0.055, stiffness: 120, ratio: 0.7 });
      },
      { threshold: [0, 0.3] },
    );
    this.firstSight.observe(this.stage);
  }

  private squareUp(): void {
    const topX = this.order[0].place.x;
    this.order.slice(1).forEach((card, i) => {
      card.x.value = card.x.target = topX + (i + 1) * 2;
      this.render(card);
    });
  }
}
