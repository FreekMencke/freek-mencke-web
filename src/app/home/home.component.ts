import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AboutComponent } from './about/about.component';
import { HeroComponent } from './hero/hero.component';
import { ProjectsComponent } from './projects/projects.component';

@Component({
  selector: 'home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, ProjectsComponent, AboutComponent],
  host: { style: 'display: contents' },
  template: `
    <hero />
    <main>
      <projects />
    </main>
    <about />
  `,
})
export default class HomeComponent {}
