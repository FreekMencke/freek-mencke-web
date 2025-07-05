import { provideServerRendering } from '@angular/ssr';
import { mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],
});
