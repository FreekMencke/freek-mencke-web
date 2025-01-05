import { afterNextRender, DestroyRef, Directive, ElementRef, inject, Renderer2 } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, throttleTime } from 'rxjs';

@Directive({
  selector: '[scrollShadow]',
})
export class ScrollShadowDirective {
  readonly destroyRef = inject(DestroyRef);
  readonly elementRef = inject(ElementRef);
  readonly renderer = inject(Renderer2);

  constructor() {
    afterNextRender({
      read: () =>
        fromEvent(window, 'scroll')
          .pipe(throttleTime(100, undefined, { trailing: true }), takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (window.scrollY > 0) this.renderer.addClass(this.elementRef.nativeElement, 'shadow-xl');
            else this.renderer.removeClass(this.elementRef.nativeElement, 'shadow-xl');
          }),
    });
  }
}
