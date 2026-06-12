export interface NavigationLink {
  href: string
  label: string
  primary?: boolean
}

const navigationLinks: NavigationLink[] = [
  { href: '/docs', label: 'Documentation', primary: true },
  { href: '/api/docs', label: 'API Reference', primary: true },
  { href: '/docs/python', label: 'Python Documentation', primary: true },
  { href: 'https://pypi.org/project/bailo/', label: 'Python SDK' },
  { href: '/accessibility/statement', label: 'Accessibility' },
  { href: 'https://github.com/gchq/bailo', label: 'Github' },
]

export default navigationLinks
