/** Footer + header marketing destinations (dedicated routes). */
export const MARKETING_ROUTES = {
  features: '/features',
  howItWorks: '/how-it-works',
  integrations: '/integrations',
  faq: '/faq',
  forPhotographers: '/for-photographers',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
} as const;

export const FOOTER_LINKS = {
  product: [
    { to: MARKETING_ROUTES.features, label: 'Features' },
    { to: MARKETING_ROUTES.howItWorks, label: 'How It Works' },
    { to: MARKETING_ROUTES.integrations, label: 'Integrations' },
  ],
  resources: [
    { to: MARKETING_ROUTES.faq, label: 'Help & FAQ' },
    { to: MARKETING_ROUTES.forPhotographers, label: 'For Photographers' },
  ],
  company: [
    { to: MARKETING_ROUTES.contact, label: 'Contact Us' },
    { to: MARKETING_ROUTES.privacy, label: 'Privacy Policy' },
    { to: MARKETING_ROUTES.terms, label: 'Terms of Service' },
  ],
} as const;

/** Home-page section anchors (only valid on `/`). */
export const HOME_SECTION_HASH = {
  features: 'features',
  how: 'how',
  resources: 'resources',
  contact: 'contact',
} as const;

export type HomeSectionHash = (typeof HOME_SECTION_HASH)[keyof typeof HOME_SECTION_HASH];

export const HEADER_NAV: {
  label: string;
  page: (typeof MARKETING_ROUTES)[keyof typeof MARKETING_ROUTES];
  homeSection?: HomeSectionHash;
}[] = [
  { label: 'Features', page: MARKETING_ROUTES.features, homeSection: HOME_SECTION_HASH.features },
  { label: 'How It Works', page: MARKETING_ROUTES.howItWorks, homeSection: HOME_SECTION_HASH.how },
  { label: 'Resources', page: MARKETING_ROUTES.faq, homeSection: HOME_SECTION_HASH.resources },
  { label: 'Contact', page: MARKETING_ROUTES.contact, homeSection: HOME_SECTION_HASH.contact },
];
