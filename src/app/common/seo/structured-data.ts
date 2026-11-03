import { SOCIAL_LINKS } from '@app/common/social-links/social-links.component';
import { OG_IMAGE, SITE_NAME, SITE_URL } from './page-meta.strategy';

/**
 * The home page's JSON-LD graph: `WebSite` is Google's main input for the site name, and `ProfilePage` says the page is
 * about one person. https://developers.google.com/search/docs/appearance/structured-data/profile-page
 */
export const HOME_STRUCTURED_DATA: object[] = [
  { '@type': 'WebSite', 'name': SITE_NAME, 'url': `${SITE_URL}/` },
  {
    '@type': 'ProfilePage',
    'url': `${SITE_URL}/`,
    'mainEntity': {
      '@type': 'Person',
      'name': SITE_NAME,
      'url': `${SITE_URL}/`,
      'jobTitle': 'Full-stack TypeScript developer',
      'image': OG_IMAGE.url,
      'sameAs': SOCIAL_LINKS.map(link => link.url),
    },
  },
];
