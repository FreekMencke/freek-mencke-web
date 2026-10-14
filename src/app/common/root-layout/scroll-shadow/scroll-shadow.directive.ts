import { afterNextRender, DestroyRef, Directive, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, throttleTime } from 'rxjs';

@Directive({
  selector: '[scrollShadow]',
  host: { '[class.shadow-xl]': 'scrolled()' },
})
export class ScrollShadowDirective {
  readonly destroyRef = inject(DestroyRef);

  readonly scrolled: WritableSignal<boolean> = signal(false);

  constructor() {
    afterNextRender({
      read: () =>
        fromEvent(window, 'scroll')
          .pipe(throttleTime(100, undefined, { trailing: true }), takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.scrolled.set(window.scrollY > 0)),
    });
  }
}
