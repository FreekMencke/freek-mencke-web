import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { PageMetaStrategy } from '@app/common/seo/page-meta.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay()),
    { provide: TitleStrategy, useClass: PageMetaStrategy },
  ],
};
