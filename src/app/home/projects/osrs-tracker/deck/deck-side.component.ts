import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DeckView } from './deck-layout';

/**
 * One side of a card: a page's screen at one size, in both of OSRS Tracker's themes, of which only one shows. The
 * shadow, the veil and the shade are DeckMotion's to set.
 *
 * Plain images, not NgOptimizedImage: its priority means loading eagerly, which fetches an image without a box too, and
 * which of the top card's four is the one on screen depends on the theme and the width. Lazy ones only load once they
 * have a box, so fetchpriority can mark all four and only the one showing is fetched.
 */
@Component({
  selector: 'deck-side',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './deck-side.component.css',
  host: {
    'class': 'side',
    '[class.side--desk]': "kind() === 'desk'",
    '[class.side--phone]': "kind() === 'phone'",
    '[class.is-current]': 'current()',
    '[class.is-wanted]': 'wanted()',
    '[attr.aria-hidden]': '!exposed()',
  },
  template: `
    <i class="lifted"></i>
    <div class="screen">
      <div class="shots">
        <img
          class="shot shot--light"
          loading="lazy"
          decoding="async"
          [attr.fetchpriority]="lead() ? 'high' : null"
          [src]="path() + '.webp'"
          [width]="width()"
          [height]="height()"
          [alt]="alt()"
        />
        <img
          class="shot shot--dark"
          loading="lazy"
          decoding="async"
          [attr.fetchpriority]="lead() ? 'high' : null"
          [src]="path() + '-dark.webp'"
          [width]="width()"
          [height]="height()"
          [alt]="alt()"
        />
      </div>
      <i class="veil"></i>
      <i class="shade"></i>
    </div>
  `,
})
export class DeckSideComponent {
  readonly kind = input.required<DeckView>();
  readonly slug = input.required<string>();
  readonly alt = input.required<string>();
  /** Whether it's on the card the deck starts with, which can be the biggest thing on the screen at load */
  readonly lead = input(false);
  /** The side showing now: only it takes the pointer, as the browser still hit-tests a side turned away */
  readonly current = input(false);
  /** Whether it may load its screen, when it isn't the one the width starts on */
  readonly wanted = input(false);
  /** The one side a screen reader should find: the top card's, and the one showing */
  readonly exposed = input(false);

  protected readonly path = computed(
    () => `/projects/osrs-tracker/deck/${this.kind() === 'phone' ? 'phone-' : ''}${this.slug()}`,
  );
  protected readonly width = computed(() => (this.kind() === 'phone' ? 780 : 2160));
  protected readonly height = computed(() => (this.kind() === 'phone' ? 1688 : 1350));
}
