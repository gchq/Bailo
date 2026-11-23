import { type TypographyProps } from '@mui/material'
import Box, { type BoxProps } from '@mui/material/Box'
import { grey } from '@mui/material/colors'
import Link from '@mui/material/Link'
import { type Theme, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import ReactMarkdown, { type MarkdownToJSX, RuleType } from 'markdown-to-jsx'
import { compiler } from 'markdown-to-jsx/react'
import { createElement, type HTMLAttributes, type ReactNode, useMemo } from 'react'

// Lets user HTML escape its container, e.g. a fixed full-screen overlay
const blockedHtmlAttributes = new Set(['style', 'class', 'classname'])

type MarkdownRenderRule = Required<MarkdownToJSX.Options>['renderRule']
type MarkdownCreateElement = Required<MarkdownToJSX.Options>['createElement']

export const removeUnsafeHtmlAttributes: MarkdownRenderRule = (next, node) => {
  if ((node.type === RuleType.htmlBlock || node.type === RuleType.htmlSelfClosing) && node.attrs) {
    node.attrs = Object.fromEntries(
      Object.entries(node.attrs).filter(([name]) => !blockedHtmlAttributes.has(name.toLowerCase())),
    )
  }

  return next()
}

/** Some HTML blocks (e.g. `<pre>` containing tags) bypass `renderRule` as raw HTML, so compile that HTML instead. */
function createElementWithoutRawHtml(options: MarkdownToJSX.Options): MarkdownCreateElement {
  return function createSafeElement(type, props, ...children) {
    // markdown-to-jsx types props as `IntrinsicAttributes`, although HTML elements receive full HTML attributes
    const { dangerouslySetInnerHTML, ...safeProps } = props as HTMLAttributes<HTMLElement>
    const rawHtml = dangerouslySetInnerHTML?.__html

    if (typeof rawHtml !== 'string') {
      return createElement(type, props, ...children)
    }

    return createElement<HTMLAttributes<HTMLElement>>(type, safeProps, compiler(rawHtml, { ...options, wrapper: null }))
  }
}

export type MarkdownDisplayProps = {
  children: string
  id?: string
  inline?: boolean
}

type MarkdownHeadingProps = {
  level: number
  children: ReactNode
  id?: string
  className?: string
}

const headingOptions = {
  1: {
    component: 'h1' as const,
    variant: 'h4' as const,
  },
  2: {
    component: 'h2' as const,
    variant: 'h5' as const,
  },
  3: {
    component: 'h3' as const,
    variant: 'h6' as const,
  },
  4: {
    component: 'h4' as const,
    variant: 'subtitle1' as const,
  },
}

export function MarkdownHeading({ level, children, id, className }: MarkdownHeadingProps) {
  const heading = headingOptions[level as keyof typeof headingOptions]

  if (!heading) {
    const component = level === 5 ? 'h5' : 'h6'
    return createElement(component, { id, className }, children)
  }

  return (
    <Typography
      id={id}
      className={className}
      gutterBottom
      variant={heading.variant}
      component={heading.component}
      sx={{
        wordWrap: 'break-word',
        ...(level === 4 ? { pb: 2 } : {}),
      }}
    >
      {children}
    </Typography>
  )
}

export function MarkdownParagraph({ children, ...props }: TypographyProps) {
  return (
    <Typography component='p' sx={{ wordWrap: 'break-word', py: 1 }} {...props}>
      {children}
    </Typography>
  )
}

export function MarkdownBlockquote({ children, ...props }: BoxProps) {
  return (
    <Box
      component='blockquote'
      sx={(theme) => ({
        fontStyle: 'italic',
        background: grey.A200,
        borderLeft: '2px solid',
        borderLeftColor: theme.palette.markdownBorder.main,
        pt: 2,
        pl: 1,
        pb: 0.5,
        pr: 1,
        ml: 2,
        mb: 2,
        wordWrap: 'break-word',
      })}
      {...props}
    >
      {children}
    </Box>
  )
}

export function createMarkdownOptions(theme: Theme, inline = false) {
  const options = {
    forceInline: inline,
    renderRule: removeUnsafeHtmlAttributes,
    overrides: {
      h1: {
        component: ({ children, id, className }: TypographyProps) => (
          <MarkdownHeading level={1} id={id} className={className}>
            {children}
          </MarkdownHeading>
        ),
      },
      h2: {
        component: ({ children, id, className }: TypographyProps) => (
          <MarkdownHeading level={2} id={id} className={className}>
            {children}
          </MarkdownHeading>
        ),
      },
      h3: {
        component: ({ children, id, className }: TypographyProps) => (
          <MarkdownHeading level={3} id={id} className={className}>
            {children}
          </MarkdownHeading>
        ),
      },
      h4: {
        component: ({ children, id, className }: TypographyProps) => (
          <MarkdownHeading level={4} id={id} className={className}>
            {children}
          </MarkdownHeading>
        ),
      },
      p: {
        component: (props: TypographyProps) => <MarkdownParagraph {...props} />,
      },
      blockquote: {
        component: (props: BoxProps) => <MarkdownBlockquote {...props} />,
      },
      span: {
        component: (props: TypographyProps) => (
          <Typography component='span' sx={{ wordWrap: 'break-word' }} {...props} />
        ),
      },
      a: {
        component: (props: React.ComponentProps<typeof Link>) => <Link sx={{ wordWrap: 'break-word' }} {...props} />,
      },
      li: {
        component: (props: TypographyProps) => (
          <Box component='li' sx={{ mt: 1 }}>
            <Typography component='span' sx={{ wordWrap: 'break-word' }} {...props} />
          </Box>
        ),
      },
      pre: {
        component: (props: React.HTMLAttributes<HTMLPreElement>) => (
          <pre
            style={{
              overflowX: 'auto',
              backgroundColor: theme.palette.container.main,
              wordWrap: 'break-word',
            }}
            {...props}
          />
        ),
      },
      table: {
        component: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
          <div style={{ overflowX: 'auto' }}>
            <table {...props} />
          </div>
        ),
      },
    },
  }

  return { ...options, createElement: createElementWithoutRawHtml(options) }
}

export default function MarkdownDisplay({ children, id, inline = false }: MarkdownDisplayProps) {
  const theme = useTheme()

  const options = useMemo(() => createMarkdownOptions(theme, inline), [inline, theme])

  return (
    <Box
      component={inline ? 'span' : 'div'}
      id={id}
      sx={{
        display: inline ? 'inline' : 'block',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
      }}
    >
      <ReactMarkdown options={options}>{children}</ReactMarkdown>
    </Box>
  )
}
