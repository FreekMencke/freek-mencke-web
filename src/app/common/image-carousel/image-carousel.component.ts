import { animate, style, transition, trigger } from '@angular/animations';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'image-carousel',
  templateUrl: './image-carousel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  host: { style: 'display: contents' },
  animations: [
    trigger('slide', [
      transition('void => previous', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0%)' })),
      ]),
      transition('previous => void', [
        style({ transform: 'translateX(0%)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(100%)' })),
      ]),
      transition('void => next', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0%)' })),
      ]),
      transition('next => void', [
        style({ transform: 'translateX(0%)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(-100%)' })),
      ]),
    ]),
  ],
})
export class ImageCarouselComponent {
  readonly document = inject(DOCUMENT);

  readonly images: InputSignal<{ src: string; alt: string }[]> = input<{ src: string; alt: string }[]>([]);

  readonly currentIndex: WritableSignal<number> = signal(0);
  readonly isAnimating: WritableSignal<boolean> = signal(false);
  readonly animationState: WritableSignal<'next' | 'previous' | null> = signal(null);
  readonly isOverlayVisible: WritableSignal<boolean> = signal(false);

  next() {
    if (this.isAnimating()) return;

    this.isAnimating.set(true);
    this.animationState.set('next');

    requestAnimationFrame(() =>
      // requestAnimationFrame so the animation has time to use the updated animationState
      this.currentIndex.set((this.currentIndex() + 1) % this.images().length),
    );
  }

  previous() {
    if (this.isAnimating()) return;

    this.isAnimating.set(true);
    this.animationState.set('previous');

    requestAnimationFrame(() =>
      // requestAnimationFrame so the animation has time to use the updated animationState
      this.currentIndex.set((this.currentIndex() - 1 + this.images().length) % this.images().length),
    );
  }

  toggleOverlay() {
    this.isOverlayVisible.set(!this.isOverlayVisible());
    this.document.documentElement.classList.toggle('overflow-hidden');
  }
}
