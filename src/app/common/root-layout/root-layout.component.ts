import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuButtonComponent } from './menu-button/menu-button.component';
import { ScrollShadowDirective } from './scroll-shadow/scroll-shadow.directive';
import { SocialMediaComponent } from './social-media/social-media.component';

@Component({
  selector: 'root-layout',
  templateUrl: './root-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SocialMediaComponent,
    MenuButtonComponent,
    ScrollShadowDirective,
  ],
})
export default class RootLayoutComponent {
  menuCollapsed: WritableSignal<boolean> = signal(true);

  routes: { path: string; fragment?: string; name: string }[] = [
    {
      path: '/',
      name: 'Home',
      fragment: 'home',
    },
    {
      path: '/',
      name: 'Projects',
      fragment: 'projects',
    },
    {
      path: '/',
      name: 'About me',
      fragment: 'about',
    },
  ];
}
