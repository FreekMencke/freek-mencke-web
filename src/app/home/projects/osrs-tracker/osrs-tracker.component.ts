import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DeckComponent } from './deck/deck.component';
import { OsrsStackComponent } from './osrs-stack.component';

interface Milestone {
  year: string;
  text: string;
  /** The website years, on the accent part of the line */
  web: boolean;
}

/** The featured project: what it does, a deck of its screens, what it's built with, and its story as a timeline */
@Component({
  selector: 'osrs-tracker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeckComponent, OsrsStackComponent],
  styleUrl: './osrs-tracker.component.css',
  host: { class: 'block' },
  template: `
    <article>
      <div class="mx-auto max-w-page px-page">
        <header class="head mx-auto max-w-shots">
          <h3 class="text-display font-light text-balance">OSRS Tracker logs players daily.</h3>
          <div>
            <p class="max-w-152 text-lg/7.5 text-pretty">
              Look up any Old School RuneScape player and it logs their XP, boss kills and clue scrolls every day from
              then on. Add friends to favourites to see who’s actually grinding. It tracks Grand Exchange prices too.
            </p>
            <p class="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-lg/7.5">
              <a class="link" href="https://osrs-tracker.net/" target="_blank" rel="noopener">Open OSRS Tracker</a>
              <a class="link" href="https://github.com/osrs-tracker" target="_blank" rel="noopener">Source on GitHub</a>
            </p>
          </div>
        </header>
      </div>

      <osrs-deck class="deck" />

      <div class="mx-auto max-w-page px-page">
        <osrs-stack class="stack mx-auto max-w-wide" />

        <figure class="story mx-auto max-w-wide">
          <ol class="timeline">
            @for (milestone of milestones; track milestone.year) {
              <li [class.web]="milestone.web">
                <strong class="block text-sm/5 font-semibold tracking-wide tabular-nums">{{ milestone.year }}</strong>
                <span class="mt-1 block text-sm/6 text-muted">{{ milestone.text }}</span>
              </li>
            }
          </ol>
          <figcaption class="mx-auto mt-10 max-w-152 text-lg/7.5 sm:text-center">
            I pulled the plug on the Android app while it was still growing: the backend cost too much and needed too
            much babysitting, mostly because I’d designed it badly. The website is built properly this time.
          </figcaption>
        </figure>
      </div>
    </article>
  `,
})
export class OsrsTrackerComponent {
  protected readonly milestones: Milestone[] = [
    { year: '2016', text: 'Grand Exchange Price Tracker, an Android app', web: false },
    { year: '2018', text: 'Grows into OSRS Tracker', web: false },
    { year: '2019', text: 'Pulled the plug, still growing', web: false },
    { year: '2023', text: 'Back, as a website', web: true },
    { year: '2026', text: 'Ten years old', web: true },
  ];
}
