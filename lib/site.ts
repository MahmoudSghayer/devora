// Brand constants + placeholders the client will replace before launch.
// Search "TODO(devora)" to find everything that needs real values.

export const SITE = {
  name: 'devora',
  domain: 'devora.design',
  // TODO(devora): confirm the real inbox address.
  email: 'hello@devora.design',
} as const;

// TODO(devora): replace "#" with the real profile URLs.
export const SOCIALS = [
  {label: 'Instagram', href: '#'},
  {label: 'X / Twitter', href: '#'},
  {label: 'LinkedIn', href: '#'},
  {label: 'Behance', href: '#'},
] as const;

// The two case-study clients (real live sites — not placeholders).
export const CASES = [
  {
    domain: 'zawiya.studio',
    href: 'https://zawiya.studio',
    image: '/images/zawiya.png',
  },
  {
    domain: 'aldarb.co',
    href: 'https://aldarb.co',
    image: '/images/aldarb.png',
  },
] as const;
