import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AboutComponent } from './about/about.component';
import { FremenServerComponent } from './fremen-server/fremen-server.component';
import { HeroComponent } from './hero/hero.component';
import { ProjectsComponent } from './projects/projects.component';

@Component({
  selector: 'home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, ProjectsComponent, FremenServerComponent, AboutComponent],
  host: { style: 'display: contents' },
  template: `
    <hero />
    <main>
      <projects />
      <fremen-server />
    </main>
    <about />
  `,
})
export default class HomeComponent {}
