import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OsrsTrackerComponent } from './osrs-tracker/osrs-tracker.component';

@Component({
  selector: 'projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OsrsTrackerComponent],
  host: { class: 'block' },
  template: `
    <section id="projects" class="pt-section-sm" aria-labelledby="projects-title">
      <h2 id="projects-title" class="sr-only">Projects</h2>

      <osrs-tracker />
    </section>
  `,
})
export class ProjectsComponent {}
