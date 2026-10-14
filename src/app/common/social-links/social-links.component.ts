import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface SocialLink {
  name: string;
  url: string;
}

/** Where else to find me, as words: in the hero and again in the footer */
@Component({
  selector: 'social-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm/5 font-medium" [attr.aria-label]="label()">
      @for (link of links; track link.name) {
        <a [href]="link.url" target="_blank" rel="noopener">{{ link.name }}</a>
      }
    </nav>
  `,
})
export class SocialLinksComponent {
  /** Each nav on a page needs its own label */
  readonly label = input.required<string>();

  protected readonly links: SocialLink[] = [
    { name: 'GitHub', url: 'https://github.com/FreekMencke' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/freekmencke/' },
    { name: 'YouTube', url: 'https://www.youtube.com/@Frakerd' },
    { name: 'X', url: 'https://x.com/freekmencke' },
    { name: 'Medium', url: 'https://medium.com/@freek_mencke' },
  ];
}
