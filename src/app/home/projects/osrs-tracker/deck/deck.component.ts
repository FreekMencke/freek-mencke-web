import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DeckControlsComponent } from './deck-controls.component';
import { DESK_RATIO, deckLayout, deckMetrics, DeckView, PHONE_RATIO } from './deck-layout';
import { DeckMotion, DeckState } from './deck-motion';
import { DeckSideComponent } from './deck-side.component';

interface DeckPage {
  readonly slug: string;
  readonly caption: string;
  readonly altDesk: string;
  readonly altPhone: string;
}

/** Top card first. Each page's screens are in public/projects/osrs-tracker/deck/ at both sizes and in both themes. */
const PAGES: readonly DeckPage[] = [
  {
    slug: 'home',
    caption: 'The home page',
    altDesk:
      'OSRS Tracker’s home page: the search box under a headline, a tracked player’s summary card, and the latest news.',
    altPhone: 'The home page on a phone.',
  },
  {
    slug: 'player',
    caption: 'A player’s stats',
    altDesk: 'The stats page of the player The Fraking: skill levels in a grid beside a chart of XP gained over time.',
    altPhone: 'The same stats page on a phone.',
  },
  {
    slug: 'item',
    caption: 'An item’s details',
    altDesk: 'The Abyssal whip’s price page: stat cards above a price chart.',
    altPhone: 'The Abyssal whip’s price page on a phone.',
  },
  {
    slug: 'high-alch',
    caption: 'What every high alch makes',
    altDesk: 'The high-alch profit page: items listed by what a cast of High Level Alchemy makes at the latest prices.',
    altPhone: 'The high-alch profit page on a phone.',
  },
  {
    slug: 'margins',
    caption: 'What every flip makes after tax',
    altDesk: 'The margins page: items listed by what a flip makes after the 2% Grand Exchange tax.',
    altPhone: 'The margins page on a phone.',
  },
  {
    slug: 'players-online',
    caption: 'How many people are playing',
    altDesk: 'The players online page: the number playing right now, per world and over time.',
    altPhone: 'The players online page on a phone.',
  },
  {
    slug: 'news',
    caption: 'Every news post Jagex has published',
    altDesk: 'The news page: posts from Jagex, listed by month.',
    altPhone: 'The news page on a phone.',
  },
];

// Where the cards rest before any code runs, in stage widths, for the two widths the stylesheet tells apart: the same
// layout DeckMotion uses, so the pre-rendered page is already a fan and nothing jumps when it takes over.
const wideRest = deckLayout(
  PAGES.length,
  deckMetrics({
    span: 1,
    narrow: false,
    deskWidth: 0.46 * DESK_RATIO,
    phoneWidth: 0.46 * PHONE_RATIO,
    cards: PAGES.length,
  }).desk,
  1,
).places;
const narrowRest = deckLayout(
  PAGES.length,
  deckMetrics({ span: 1, narrow: true, deskWidth: 0.78, phoneWidth: 1.3 * PHONE_RATIO, cards: PAGES.length }).phone,
  1,
).places;

/** OSRS Tracker's screens as a deck of cards: DeckMotion moves it, this holds the markup and what it reports */
@Component({
  selector: 'osrs-deck',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeckControlsComponent, DeckSideComponent],
  styleUrl: './deck.component.css',
  template: `
    <div
      #stage
      class="stage"
      tabindex="0"
      role="group"
      aria-roledescription="card deck"
      aria-label="Screens from OSRS Tracker. Use the left and right arrow keys to move through them."
      [attr.data-side]="view()"
    >
      @for (card of cards; track card.slug; let index = $index) {
        <figure
          #card
          class="card"
          [class.is-top]="index === top()"
          [style.--wide-x]="card.wide.x"
          [style.--wide-scale]="card.wide.scale"
          [style.--narrow-x]="card.narrow.x"
          [style.--narrow-scale]="card.narrow.scale"
          [style.--veil]="card.wide.veil"
          [style.z-index]="card.wide.layer"
        >
          <deck-side
            kind="desk"
            [slug]="card.slug"
            [alt]="card.altDesk"
            [lead]="index === 0"
            [current]="view() === 'desk'"
            [wanted]="bothSides() || view() === 'desk'"
            [exposed]="index === top() && view() !== 'phone'"
          />
          <deck-side
            kind="phone"
            [slug]="card.slug"
            [alt]="card.altPhone"
            [lead]="index === 0"
            [current]="view() === 'phone'"
            [wanted]="bothSides() || view() === 'phone'"
            [exposed]="index === top() && view() !== 'desk'"
          />
        </figure>
      }
    </div>
    <deck-controls
      class="controls"
      [view]="view()"
      [caption]="caption()"
      [touched]="touched()"
      (viewChange)="chooseView($event)"
      (previous)="motion?.previous()"
      (next)="motion?.next()"
      (wantsBothSides)="bothSides.set(true)"
    />
  `,
})
export class DeckComponent {
  protected readonly cards = PAGES.map((page, depth) => ({
    ...page,
    wide: wideRest[depth],
    narrow: narrowRest[depth],
  }));

  /** null until DeckMotion has measured the page: the pre-rendered page leaves the choice to the stylesheet */
  protected readonly view = signal<DeckView | null>(null);
  protected readonly top = signal(0);
  protected readonly touched = signal(false);
  protected readonly bothSides = signal(false);
  protected readonly caption = computed(() => PAGES[this.top()].caption);

  protected motion: DeckMotion | null = null;

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly cardElements = viewChildren<ElementRef<HTMLElement>>('card');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const elements = this.cardElements().map(card => card.nativeElement);
      this.motion = new DeckMotion(this.stage().nativeElement, elements, state => this.show(state));
      destroyRef.onDestroy(() => this.motion?.destroy());
    });
  }

  protected chooseView(view: DeckView): void {
    this.bothSides.set(true);
    this.motion?.setView(view);
  }

  private show({ top, view, touched }: DeckState): void {
    this.top.set(top);
    this.view.set(view);
    this.touched.set(touched);
  }
}
