import { LucideChevronLeft, LucideChevronRight, LucideMonitor, LucideSmartphone } from '@lucide/angular';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DeckView } from './deck-layout';

/** Under the deck: the switch between desktop and phone screens, what's on top, and the way through by button */
@Component({
  selector: 'deck-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideChevronLeft, LucideChevronRight, LucideMonitor, LucideSmartphone],
  styleUrl: './deck-controls.component.css',
  host: { '[class.is-ready]': 'view() !== null' },
  template: `
    <div
      class="switch"
      role="group"
      aria-label="Show the screens on"
      (pointerenter)="wantsBothSides.emit()"
      (focusin)="wantsBothSides.emit()"
    >
      <i class="thumb" [class.on-phone]="view() === 'phone'"></i>
      <button type="button" [attr.aria-pressed]="view() === 'desk'" (click)="viewChange.emit('desk')">
        <svg lucideMonitor class="size-4" />
        Desktop
      </button>
      <button type="button" [attr.aria-pressed]="view() === 'phone'" (click)="viewChange.emit('phone')">
        <svg lucideSmartphone class="size-4" />
        Phone
      </button>
    </div>
    <p class="caption">
      <span role="status">{{ caption() }}</span>
      <small class="hint" [class.is-spent]="touched()">Flick the top card away, or pull one out by its edge</small>
    </p>
    <div class="arrows">
      <button type="button" aria-label="Previous card" (click)="previous.emit()">
        <svg lucideChevronLeft class="size-4.5" />
      </button>
      <button type="button" aria-label="Next card" (click)="next.emit()">
        <svg lucideChevronRight class="size-4.5" />
      </button>
    </div>
  `,
})
export class DeckControlsComponent {
  /** null until the code that moves the deck has started: until then there's nothing for these to do */
  readonly view = input.required<DeckView | null>();
  readonly caption = input.required<string>();
  /** Whether a person has moved the deck: they don't need telling how any more */
  readonly touched = input.required<boolean>();

  readonly viewChange = output<DeckView>();
  readonly previous = output();
  readonly next = output();
  readonly wantsBothSides = output();
}
