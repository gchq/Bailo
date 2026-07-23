import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import LinkIcon from '@mui/icons-material/Link'
import SearchIcon from '@mui/icons-material/Search'
import { ButtonBase, InputBase } from '@mui/material'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { alpha, styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/router'
import { KeyboardEvent, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Transition } from 'src/common/Transition'
import useIsMac from 'src/hooks/useIsMac'

import { DocsSearchResult, useDocsSearchIndex } from './useDocsSearchIndex'

/**
 * Build the URL for a given search result, including the heading hash if present.
 */
function resultHref(result: DocsSearchResult): string {
  const base = `/docs/${result.slug}`
  return result.hash ? `${base}#${result.hash}` : base
}

/**
 * Build the URL for a page slug (no hash).
 */
function pageHref(slug: string): string {
  return `/docs/${slug}`
}

/**
 * A single row rendered in the results list. Either a page header (top-level,
 * navigates to the page itself) or a heading child (indented, navigates to an
 * anchor within the parent page).
 */
type DisplayRow =
  | {
      kind: 'page-header'
      key: string
      slug: string
      title: string
      breadcrumb: string
      /** Optional page-level DocsSearchResult if the page itself matched. */
      result?: DocsSearchResult
    }
  | {
      kind: 'heading-child'
      key: string
      result: DocsSearchResult
    }

/**
 * Group flat search results by their parent page slug. Each group starts with a
 * `page-header` row (using the page-level result if present, otherwise synthesised
 * from a heading's breadcrumb) followed by any heading children in the order they
 * were returned by the search index.
 */
function groupResults(results: DocsSearchResult[]): DisplayRow[] {
  const rows: DisplayRow[] = []
  const groupIndexBySlug = new Map<string, number>()

  for (const result of results) {
    let headerIndex = groupIndexBySlug.get(result.slug)
    if (headerIndex === undefined) {
      // First time we see this page — synthesise a header.
      let headerTitle: string
      let headerBreadcrumb: string
      if (result.kind === 'page') {
        headerTitle = result.title
        headerBreadcrumb = result.breadcrumb
      } else {
        // For headings, the parent page title is prepended to breadcrumb as
        // "<Page title> — <breadcrumb>" (see useDocsSearchIndex.ts).
        const [pageTitle, ...rest] = result.breadcrumb.split(' — ')
        headerTitle = pageTitle || result.slug
        headerBreadcrumb = rest.join(' — ')
      }
      headerIndex = rows.length
      rows.push({
        kind: 'page-header',
        key: `page:${result.slug || '__root__'}`,
        slug: result.slug,
        title: headerTitle,
        breadcrumb: headerBreadcrumb,
        result: result.kind === 'page' ? result : undefined,
      })
      groupIndexBySlug.set(result.slug, headerIndex)
      if (result.kind === 'page') {
        continue
      }
    } else if (result.kind === 'page') {
      // Page result arrived after a heading for the same slug — attach it to
      // the existing header row so clicking the header opens the page.
      const existing = rows[headerIndex]
      if (existing.kind === 'page-header' && !existing.result) {
        existing.result = result
        existing.title = result.title
        existing.breadcrumb = result.breadcrumb
      }
      continue
    }

    if (result.kind === 'heading') {
      rows.push({
        kind: 'heading-child',
        key: result.key,
        result,
      })
    }
  }

  return rows
}

const Search = styled('div')(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover, &:focus': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: '100%',
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  paddingRight: theme.spacing(1),
  '& .MuiInputBase-input': {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      width: '25ch',
    },
  },
}))

const ShortcutButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== 'color',

  name: 'ShortcutButton',
  slot: 'Root',

  overridesResolver: (props, styles) => [
    styles.root,
    props.color === 'white' && styles.white,
    props.color === 'black' && styles.black,
  ],
})(({ theme, color = 'white' }) => {
  const foreground = color === 'black' ? theme.palette.common.black : theme.palette.common.white

  return {
    color: foreground,
    backgroundColor: 'inherit',
    border: `1px solid ${alpha(foreground, 0.5)}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 1),
    font: 'inherit',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    cursor: 'pointer',

    '&:hover': {
      color: foreground,
      backgroundColor:
        color === 'black' ? alpha(theme.palette.common.black, 0.08) : alpha(theme.palette.common.white, 0.15),
      borderColor: foreground,
    },

    '&:focus-visible': {
      outline: `2px solid ${foreground}`,
      outlineOffset: 2,
    },
  }
})

export default function DocsSearch(): ReactElement {
  const router = useRouter()
  const { search } = useDocsSearchIndex()
  const isMac = useIsMac()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo<DocsSearchResult[]>(() => {
    const trimmed = query.trim()
    if (trimmed.length === 0) {
      return []
    }
    return search(trimmed)
  }, [query, search])

  const displayRows = useMemo<DisplayRow[]>(() => groupResults(results), [results])

  // Reset highlight whenever the displayed rows change.
  useEffect(() => {
    setHighlightedIndex(0)
  }, [displayRows])

  // Global Ctrl/Cmd+K shortcut. Opens the dialog.
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')
      if (isShortcut) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Clear the query when the dialog closes so the next open starts fresh.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setHighlightedIndex(0)
    }
  }, [open])

  // Scroll the currently highlighted row into view whenever the highlight changes.
  useEffect(() => {
    if (!open || displayRows.length === 0) {
      return
    }
    const element = document.getElementById(`docs-search-result-${highlightedIndex}`)
    element?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, displayRows, open])

  const closeDialog = useCallback(() => setOpen(false), [])

  const navigateToRow = useCallback(
    (row: DisplayRow) => {
      closeDialog()
      if (row.kind === 'page-header') {
        router.push(row.result ? resultHref(row.result) : pageHref(row.slug))
      } else {
        router.push(resultHref(row.result))
      }
    },
    [closeDialog, router],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((i) => (displayRows.length === 0 ? 0 : Math.min(i + 1, displayRows.length - 1)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      const selected = displayRows[highlightedIndex]
      if (selected) {
        event.preventDefault()
        navigateToRow(selected)
      }
    }
  }

  const hasQuery = query.trim().length > 0

  return (
    <Box>
      <Search onClick={() => setOpen(true)} aria-haspopup='true' aria-expanded={open ? 'true' : undefined}>
        <StyledInputBase
          placeholder='Search documentation...'
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          sx={{ pl: 1, pr: 1 }}
          startAdornment={<SearchIcon sx={{ m: 0.5 }} />}
          endAdornment={
            <ShortcutButton type='button' aria-label={`Open search (${isMac ? 'Command K' : 'Control K'})`}>
              {isMac ? '⌘K' : 'Ctrl + K'}
            </ShortcutButton>
          }
          inputProps={{
            'aria-label': 'Search for a data card or model',
            spellCheck: false,
          }}
        />
      </Search>
      <Dialog
        disableRestoreFocus
        open={open}
        onClose={closeDialog}
        slots={{ transition: Transition }}
        keepMounted={false}
        fullWidth
        maxWidth='lg'
        scroll='paper'
        aria-labelledby='docs-search-dialog-title'
        slotProps={{
          paper: {
            sx: {
              // Pin the dialog towards the top so results have room to grow.
              alignSelf: 'flex-start',
              mt: { xs: 4, sm: 8 },
            },
          },
        }}
      >
        <Box sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}`, p: 1.5 })}>
          <TextField
            id='docs-search-dialog-title'
            inputRef={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Search documentation...'
            fullWidth
            autoComplete='off'
            autoFocus
            spellCheck={false}
            variant='standard'
            slotProps={{
              input: {
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <ShortcutButton
                    type='button'
                    color='black'
                    aria-label={`Close search Escape`}
                    onClick={() => setOpen(false)}
                  >
                    Esc
                  </ShortcutButton>
                ),
              },
            }}
          />
        </Box>
        <DialogContent dividers={false} sx={{ p: 0, maxHeight: 'min(60vh, 480px)' }}>
          {!hasQuery ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant='body2' color='text.secondary'>
                Start typing to search the documentation.
              </Typography>
              <Typography variant='caption' sx={{ mt: 1, color: 'text.disabled', display: 'block' }}>
                Use ↑ ↓ to navigate, Enter to open, Esc to close.
              </Typography>
            </Box>
          ) : displayRows.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant='body2' color='text.secondary'>
                No matches for &ldquo;{query.trim()}&rdquo;.
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding id='docs-search-results' role='listbox'>
              {displayRows.map((row, index) => {
                const isHighlighted = index === highlightedIndex
                const isChild = row.kind === 'heading-child'
                const snippetHtml = isChild ? row.result.snippetHtml : row.result?.snippetHtml
                const title = isChild ? row.result.title : row.title
                const breadcrumb = isChild ? undefined : row.breadcrumb
                return (
                  <ListItemButton
                    key={row.key}
                    selected={isHighlighted}
                    role='option'
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => navigateToRow(row)}
                    sx={{ alignItems: 'flex-start', pl: isChild ? 5 : 2 }}
                    id={`docs-search-result-${index}`}
                  >
                    <Box sx={{ pt: 0.5, pr: 1.5, color: 'secondary' }}>
                      {isChild ? <LinkIcon fontSize='small' /> : <ArticleOutlined fontSize='small' />}
                    </Box>
                    <ListItemText
                      primary={
                        <Box component='span' sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography component='span' variant='body2' sx={{ fontWeight: isChild ? 500 : 600 }}>
                            {title}
                          </Typography>
                          {breadcrumb && (
                            <Typography component='span' variant='caption' color='text.secondary'>
                              {breadcrumb}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        snippetHtml ? (
                          <Typography
                            component='span'
                            variant='caption'
                            color='text.secondary'
                            sx={(theme) => ({
                              display: 'block',
                              mt: 0.5,
                              mark: {
                                backgroundColor: alpha(theme.palette.primary.main, 0.25),
                                color: 'inherit',
                                borderRadius: '2px',
                              },
                            })}
                            dangerouslySetInnerHTML={{ __html: snippetHtml }}
                          />
                        ) : null
                      }
                    />
                  </ListItemButton>
                )
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
