export interface NavigationLink {
  href: string
  label: string
  showInHero?: boolean
}

const navigationLinks: NavigationLink[] = [
  { href: '/docs', label: 'Documentation', showInHero: true },
  { href: '/api/docs', label: 'API Reference', showInHero: true },
  { href: '/docs/python/index.html', label: 'Python Documentation', showInHero: true },
  { href: 'https://pypi.org/project/bailo/', label: 'Python SDK' },
  { href: '/accessibility/statement', label: 'Accessibility' },
  { href: 'https://github.com/gchq/bailo', label: 'Github' },
]

export default navigationLinks
