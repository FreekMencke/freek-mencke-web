import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ImageCarouselComponent } from '../../common/image-carousel/image-carousel.component';

@Component({
  selector: 'projects',
  templateUrl: './projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImageCarouselComponent],
})
export class ProjectsComponent {}
