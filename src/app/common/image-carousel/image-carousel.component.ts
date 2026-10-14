import { animate, style, transition, trigger } from '@angular/animations';
import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  InputSignal,
  OnDestroy,
  signal,
  WritableSignal,
  DOCUMENT,
} from '@angular/core';

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
export class ImageCarouselComponent implements OnDestroy {
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
    this.document.documentElement.classList.toggle('overflow-hidden', this.isOverlayVisible());
  }

  // The overlay locks the page's scroll; leaving the page with it open would keep it locked
  ngOnDestroy(): void {
    this.document.documentElement.classList.remove('overflow-hidden');
  }
}
