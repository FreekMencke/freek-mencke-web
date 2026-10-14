import { DOCUMENT, inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** A route's `data['meta']`. The route's `title` titles the page. */
export interface PageMeta {
  description: string;
  /** Path only, no query or fragment: '/' */
  canonicalPath: string;
}

export const SITE_NAME = 'Freek Mencke';
const SITE_URL = 'https://freekmencke.com';

/** Every tag this strategy sets apart from the description, so a page without meta can remove them all */
const SOCIAL_TAGS = [
  'property="og:title"',
  'property="og:description"',
  'property="og:url"',
  'property="og:type"',
  'property="og:site_name"',
  'name="twitter:card"',
];

/**
 * Sets the title, description, canonical link and social tags once per navigation, from the route's `title` and the
 * deepest route's `data['meta']` (a `PageMeta`). Angular calls `updateTitle` after every successful navigation, also
 * while pre-rendering.
 */
@Service()
export class PageMetaStrategy extends TitleStrategy {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot) ?? SITE_NAME;
    this.title.setTitle(title);

    const pageMeta = deepestChild(snapshot.root).data['meta'] as PageMeta | undefined;
    if (!pageMeta) {
      this.meta.removeTag('name="description"');
      SOCIAL_TAGS.forEach(selector => this.meta.removeTag(selector));
      this.canonicalLink()?.remove();
      return;
    }

    const url = SITE_URL + pageMeta.canonicalPath;
    this.meta.updateTag({ name: 'description', content: pageMeta.description });
    const tags: Record<string, string> = {
      'og:title': title,
      'og:description': pageMeta.description,
      'og:url': url,
      'og:type': 'website',
      'og:site_name': SITE_NAME,
    };
    Object.entries(tags).forEach(([property, content]) => this.meta.updateTag({ property, content }));
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.canonicalLink();
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private canonicalLink(): HTMLLinkElement | null {
    return this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  }
}

function deepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepestChild(route.firstChild) : route;
}
