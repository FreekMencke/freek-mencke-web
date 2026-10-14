import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SocialLinksComponent } from '@app/common/social-links/social-links.component';

/** The page's end: who I am, on the hero's green, so the page opens and closes on it */
@Component({
  selector: 'about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SocialLinksComponent],
  host: { class: 'block' },
  template: `
    <footer id="about" class="field mt-section" aria-labelledby="about-title">
      <div class="mx-auto flex max-w-page flex-col items-center px-page pt-section-sm pb-10 text-center">
        <h2 id="about-title" class="sr-only">About me</h2>
        <p class="max-w-147 text-statement font-light text-balance">
          I'm Freek, a full-stack TypeScript developer from Belgium.
        </p>
        <p class="mt-6 max-w-xl text-lg/7.5 text-balance text-field-muted">
          By day I build Angular apps for a private bank. By night I build whatever I feel like and host it on a server
          in my house. When I'm not coding, I'm reading, gaming or messing around with my 3D printer.
        </p>
        <social-links class="mt-10" label="Elsewhere, again" />
        <p class="mt-18 text-sm/5 text-field-muted">© {{ year }} Freek Mencke</p>
      </div>
    </footer>
  `,
})
export class AboutComponent {
  /** The year of the build: the page is pre-rendered */
  protected readonly year = new Date().getFullYear();
}
