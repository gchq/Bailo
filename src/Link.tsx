import MuiLink, { LinkProps as MuiLinkProps } from '@mui/material/Link'
import { styled } from '@mui/material/styles'
import clsx from 'clsx'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import { omit } from 'lodash'

// Add support for the sx prop for consistency with the other branches.
const Anchor = styled('a')({})

interface NextLinkComposedProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    Omit<NextLinkProps, 'href' | 'as'> {
  to: NextLinkProps['href']
  linkAs?: NextLinkProps['as']
  href?: NextLinkProps['href']
}

export const NextLinkComposed = React.forwardRef<HTMLAnchorElement, NextLinkComposedProps>((props, ref) => {
  const { to, linkAs, replace, scroll, shallow, prefetch, locale, ...other } = props

  return (
    <NextLink
      passHref
      href={to}
      prefetch={prefetch}
      as={linkAs}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      locale={locale}
    >
      <Anchor ref={ref} {...omit(other, 'href')} />
    </NextLink>
  )
})

export type LinkProps = {
  activeClassName?: string
  as?: NextLinkProps['as']
  href: NextLinkProps['href']
  noLinkStyle?: boolean
} & Omit<NextLinkComposedProps, 'to' | 'linkAs' | 'href'> &
  Omit<MuiLinkProps, 'href'>

// A styled version of the Next.js Link component:
// https://nextjs.org/docs/#with-link
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { activeClassName = 'active', as: linkAs, className: classNameProps, href, noLinkStyle, ...other } = props

  const router = useRouter()
  const pathname = typeof href === 'string' ? href : href.pathname
  const className = clsx(classNameProps, {
    [activeClassName]: router.pathname === pathname && activeClassName,
  })

  const isExternal = typeof href === 'string' && (href.indexOf('http') === 0 || href.indexOf('mailto:') === 0)
  const extraProps = omit(other, 'role')

  if (isExternal) {
    if (noLinkStyle) {
      return <Anchor className={className} href={href} ref={ref} {...extraProps} />
    }

    return <MuiLink className={className} href={href} ref={ref} {...extraProps} />
  }

  if (noLinkStyle) {
    return <NextLinkComposed className={className} ref={ref} to={href} {...extraProps} />
  }

  return (
    <MuiLink component={NextLinkComposed} linkAs={linkAs} className={className} ref={ref} to={href} {...extraProps} />
  )
})

export default Link
