import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AboutComponent } from './about/about.component';
import { LandingComponent } from './landing/landing.component';
import { ProjectsComponent } from './projects/projects.component';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LandingComponent, ProjectsComponent, AboutComponent],
  host: { style: 'display: contents' },
})
export default class HomeComponent {}
