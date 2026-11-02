import { ChangeDetectionStrategy, Component } from '@angular/core';

/** What OSRS Tracker is built with, as a small piece of the cluster map further down: its boxes link to their rows there */
@Component({
  selector: 'osrs-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './osrs-stack.component.css',
  template: `
    <div class="stack" role="group" aria-label="What OSRS Tracker is built with">
      <div class="bound"><p>On my cluster</p></div>
      <a class="box box--live angular" href="#part-osrs-tracker-web">
        <b>Angular</b>
        <span>The website you open at osrs-tracker.net</span>
        <span class="sr-only">, jumps to its row under What runs on it</span>
      </a>
      <i class="arrow angular-to-nest" aria-hidden="true"></i>
      <a class="box box--live nest" href="#part-osrs-tracker-api">
        <b>NestJS</b>
        <span>The API behind it</span>
        <span class="sr-only">, jumps to its row under What runs on it</span>
      </a>
      <i class="arrow nest-to-mongo" aria-hidden="true"></i>
      <a class="box mongo" href="#part-mongodb">
        <b>MongoDB</b>
        <span>Where every player’s history is kept</span>
        <span class="sr-only">, jumps to its row under What runs on it</span>
      </a>
      <i class="arrow arrow--back" aria-hidden="true"><span>via a queue</span></i>
      <div class="box box--out">
        <b>AWS Lambda</b>
        <span>Collects the daily snapshots</span>
        <span class="sr-only">, and sends them to MongoDB via a queue</span>
      </div>
    </div>
  `,
})
export class OsrsStackComponent {}
