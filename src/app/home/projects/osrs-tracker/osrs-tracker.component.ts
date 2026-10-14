import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Milestone {
  year: string;
  text: string;
  /** The website years, on the accent part of the line */
  web: boolean;
}

/**
 * The featured project: its home page with two of its pages (an item, a player) over the corners, its story as a
 * timeline. The screenshots are OSRS Tracker's light theme in both page themes: its navy dark theme clashes with the
 * green.
 */
@Component({
  selector: 'osrs-tracker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  styleUrl: './osrs-tracker.component.css',
  host: { class: 'block' },
  template: `
    <article>
      <header class="text-center">
        <h3 class="text-display font-light tracking-wide">OSRS Tracker</h3>
        <p class="mt-3 text-sm/5 text-muted">Angular, NestJS, MongoDB, AWS Lambda</p>
      </header>

      <div class="shots mx-auto mt-12 max-w-shots">
        <img
          class="home"
          ngSrc="/projects/osrs-tracker/home.webp"
          width="2160"
          height="1200"
          alt="OSRS Tracker's home page"
        />
        <img
          class="detail"
          ngSrc="/projects/osrs-tracker/item.webp"
          width="1400"
          height="819"
          alt="The Abyssal whip's price page"
        />
        <img
          class="detail player"
          ngSrc="/projects/osrs-tracker/player.webp"
          width="1400"
          height="857"
          alt="The stats page of the player The Fraking"
        />
      </div>

      <div class="mx-auto mt-12 max-w-152 space-y-4 text-lg/7.5">
        <p>
          Look up any Old School RuneScape player and OSRS Tracker logs their XP, boss kills and clue scrolls every day
          from then on. Add your friends to your favourites to see who's actually grinding.
        </p>
        <p>
          It also tracks Grand Exchange prices, counts how many people are playing right now, and keeps every news post
          Jagex has published.
        </p>
      </div>
      <p class="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-lg/7.5">
        <a class="link" href="https://osrs-tracker.freekmencke.com/" target="_blank" rel="noopener"
          >Open OSRS Tracker</a
        >
        <a class="link" href="https://github.com/osrs-tracker" target="_blank" rel="noopener">Source on GitHub</a>
      </p>

      <figure class="mx-auto mt-18 max-w-wide">
        <ol class="timeline">
          @for (milestone of milestones; track milestone.year) {
            <li [class.web]="milestone.web">
              <strong class="block text-sm/5 font-semibold tracking-wide">{{ milestone.year }}</strong>
              <span class="mt-1 block text-sm/6 text-muted">{{ milestone.text }}</span>
            </li>
          }
        </ol>
        <figcaption class="mx-auto mt-12 max-w-152 text-center text-lg/7.5">
          I pulled the plug on the Android app while it was still growing: the backend cost too much and needed too much
          babysitting, mostly because I'd designed it badly. The website is built properly this time.
        </figcaption>
      </figure>
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
