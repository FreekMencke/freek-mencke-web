import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { BarStore } from '@app/common/root-layout/bar-store';
import { SocialLinksComponent } from '@app/common/social-links/social-links.component';

/**
 * The green field: the name, the tagline typed out in two sentences, who I am and the socials. The typing is CSS only:
 * each sentence types its length in characters (`--c`, 50ms each) after its delay (`--d`), the cursor moves on when the
 * first is done (1750ms = 600ms + 23 × 50ms), and the page rests on the finished text.
 */
@Component({
  selector: 'hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SocialLinksComponent],
  styleUrl: './hero.component.css',
  host: { class: 'block' },
  template: `
    <header id="top" class="field -mt-bar-phone px-page pt-bar-phone sm:-mt-bar sm:pt-bar">
      <div class="hero flex flex-col items-center pb-12 text-center sm:pb-24">
        <h1 class="wordmark mt-12 sm:mt-24" aria-label="Freek Mencke">
          <span class="first">Freek </span><span class="last">Mencke</span>
        </h1>

        <p class="tagline mt-6 font-mono">
          <span class="line">
            <span class="type" style="--c: 23; --d: 600ms">Doing the coding thing.</span>
            <span class="cursor first-cursor" aria-hidden="true"></span>
          </span>
          &ngsp;
          <span class="line">
            <span class="type" style="--c: 19; --d: 2050ms">Creating cool shit.</span>
            <span class="cursor" aria-hidden="true"></span>
          </span>
        </p>

        <p class="mt-14 max-w-152 text-lg/7.5 font-light text-balance text-field-muted sm:mt-20">
          Full-stack TypeScript developer from Belgium. Angular for a private bank by day, my own Kubernetes cluster by
          night.
        </p>

        <social-links class="mt-6 text-field-muted" label="Elsewhere" />
      </div>
    </header>
  `,
})
export class HeroComponent {
  constructor() {
    const barStore = inject(BarStore);
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      // The bar turns solid once the field has scrolled out from under it. The hero's top padding is the bar's height,
      // top safe area included (pt-bar).
      const barHeight = getComputedStyle(host.firstElementChild!).paddingTop;
      const observer = new IntersectionObserver(([entry]) => barStore.setOverField(entry.isIntersecting), {
        rootMargin: `-${barHeight} 0px 0px 0px`,
      });
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
