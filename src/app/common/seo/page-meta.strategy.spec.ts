import { provideLocationMocks } from '@angular/common/testing';
import { Component, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageMeta, PageMetaStrategy } from './page-meta.strategy';

@Component({ template: '' })
class PageComponent {}

describe('PageMetaStrategy', () => {
  let router: Router;
  let document: Document;

  const content = (selector: string): string | null | undefined =>
    document.head.querySelector(`meta[${selector}]`)?.getAttribute('content');
  const canonical = (): string | null | undefined =>
    document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideLocationMocks(),
        provideRouter([
          {
            path: '',
            pathMatch: 'full',
            title: 'Home - Freek Mencke',
            component: PageComponent,
            data: { meta: { description: 'The home page', canonicalPath: '/' } satisfies PageMeta },
          },
          { path: 'bare', title: 'Bare', component: PageComponent },
        ]),
        { provide: TitleStrategy, useClass: PageMetaStrategy },
      ],
    });
    router = TestBed.inject(Router);
    document = TestBed.inject(DOCUMENT);
  });

  it("sets the title, description, canonical and social tags from the route's title and meta", async () => {
    await router.navigateByUrl('/?utm_source=x#about');

    expect(document.title).toBe('Home - Freek Mencke');
    expect(content('name="description"')).toBe('The home page');
    expect(canonical()).toBe('https://freekmencke.com/');
    expect(content('property="og:url"')).toBe('https://freekmencke.com/');
    expect(content('property="og:title"')).toBe('Home - Freek Mencke');
    expect(content('property="og:image"')).toBe('https://freekmencke.com/og.png?v=1');
    expect(content('property="og:image:width"')).toBe('1200');
    expect(content('property="og:image:height"')).toBe('630');
    expect(content('property="og:image:alt"')).toBeTruthy();
    expect(content('name="twitter:card"')).toBe('summary_large_image');
  });

  // Otherwise a page without meta keeps the previous page's canonical and tags
  it('removes the tags on a page without meta', async () => {
    await router.navigateByUrl('/');
    await router.navigateByUrl('/bare');

    expect(document.title).toBe('Bare');
    expect(content('name="description"')).toBeUndefined();
    expect(content('property="og:url"')).toBeUndefined();
    expect(content('property="og:image"')).toBeUndefined();
    expect(content('property="og:image:alt"')).toBeUndefined();
    expect(canonical()).toBeUndefined();
  });
});
