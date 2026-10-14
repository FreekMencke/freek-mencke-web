import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BarStore } from '@app/common/root-layout/bar-store';
import { SocialLinksComponent } from '@app/common/social-links/social-links.component';

/**
 * The full-screen green field: the name, the tagline typed out in two sentences, the socials and an arrow down. The
 * typing is CSS only: each sentence types its length in characters (`--c`, 50ms each) after its delay (`--d`), the cursor
 * moves on when the first is done (1750ms = 600ms + 23 × 50ms), and the page rests on the finished text.
 */
@Component({
  selector: 'hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SocialLinksComponent],
  styleUrl: './hero.component.css',
  host: { class: 'block' },
  template: `
    <header id="top" class="field -mt-bar-phone flex min-h-svh flex-col px-page pt-bar-phone pb-8 sm:-mt-bar sm:pt-bar">
      <div class="flex grow flex-col items-center justify-center gap-6 py-12 text-center">
        <h1 class="wordmark" aria-label="Freek Mencke">
          <span class="first">Freek</span><span class="last">Mencke</span>
        </h1>

        <p class="tagline font-mono">
          <span class="line">
            <span class="type" style="--c: 23; --d: 600ms; width: 23ch">Doing the coding thing.</span>
            <span class="cursor first-cursor" aria-hidden="true"></span>
          </span>
          &ngsp;
          <span class="line">
            <span class="type" style="--c: 19; --d: 2050ms; width: 19ch">Creating cool shit.</span>
            <span class="cursor" aria-hidden="true"></span>
          </span>
        </p>

        <social-links class="mt-2 text-field-muted" label="Elsewhere" />
      </div>

      <a
        class="flex flex-col items-center gap-1 self-center px-3 py-2 text-sm/5 font-medium text-field-muted hover:text-field-accent motion-safe:animate-bounce"
        routerLink="/"
        fragment="projects"
      >
        Projects
        <svg
          class="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </a>
    </header>
  `,
})
export class HeroComponent {
  constructor() {
    const barStore = inject(BarStore);
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      // The bar turns solid once the field has scrolled out from under it (64px; on phones, 8px early)
      const observer = new IntersectionObserver(([entry]) => barStore.setOverField(entry.isIntersecting), {
        rootMargin: '-64px 0px 0px 0px',
      });
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
