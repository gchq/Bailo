import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import LinkIcon from '@mui/icons-material/Link'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  ButtonBase,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { KeyboardEvent, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Transition } from 'src/common/Transition'
import useIsMac from 'src/hooks/useIsMac'

import { DocsSearchResult, SearchFilter, useDocsSearchIndex } from './useDocsSearchIndex'

type SearchCategory = SearchFilter
type ResultCategory = Exclude<SearchCategory, 'all'>

type PageRow = {
  kind: 'page'
  key: string
  category: ResultCategory
  slug: string
  title: string
  breadcrumb: string
  result?: DocsSearchResult
}

type HeadingRow = {
  kind: 'heading'
  key: string
  category: 'docs'
  result: DocsSearchResult
}

type DisplayRow = PageRow | HeadingRow

type ResultSection = {
  category: ResultCategory
  title: string
  rows: DisplayRow[]
}

const CATEGORY_OPTIONS: Array<{
  value: SearchCategory
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'docs', label: 'Docs' },
  { value: 'datacards', label: 'Datacards' },
  { value: 'models', label: 'Models' },
]

const SECTION_ORDER: ResultCategory[] = ['docs', 'models', 'datacards']

const SECTION_TITLES: Record<ResultCategory, string> = {
  docs: 'User documentation',
  datacards: 'Datacards',
  models: 'Models',
}

function groupResults(results: DocsSearchResult[], category: ResultCategory): DisplayRow[] {
  if (category !== 'docs') {
    return results.map((result) => ({
      kind: 'page',
      key: result.key,
      category,
      slug: result.slug,
      title: result.title,
      breadcrumb: result.breadcrumb,
      result,
    }))
  }

  const rows: DisplayRow[] = []
  const pages = new Map<string, PageRow>()

  for (const result of results) {
    let page = pages.get(result.slug)

    if (!page) {
      const [pageTitle, ...breadcrumbParts] = result.breadcrumb.split(' — ')

      page = {
        kind: 'page',
        key: `docs:page:${result.slug || '__root__'}`,
        category: 'docs',
        slug: result.slug,
        title: result.kind === 'page' ? result.title : pageTitle || result.slug,
        breadcrumb: result.kind === 'page' ? result.breadcrumb : breadcrumbParts.join(' — '),
        result: result.kind === 'page' ? result : undefined,
      }

      pages.set(result.slug, page)
      rows.push(page)
    } else if (result.kind === 'page') {
      page.title = result.title
      page.breadcrumb = result.breadcrumb
      page.result = result
    }

    if (result.kind === 'heading') {
      rows.push({
        kind: 'heading',
        key: result.key,
        category: 'docs',
        result,
      })
    }
  }

  return rows
}

function getRowHref(row: DisplayRow): string {
  if (row.kind === 'heading') {
    return row.result.href
  }

  return row.result?.href ?? `/docs/${row.slug}`
}

const Search = styled('div')(({ theme }) => ({
  width: '100%',
  cursor: 'pointer',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),

  '&:hover, &:focus-within': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  width: '100%',
  color: 'inherit',
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

    '&:hover': {
      color: foreground,
      borderColor: foreground,
      backgroundColor:
        color === 'black' ? alpha(theme.palette.common.black, 0.08) : alpha(theme.palette.common.white, 0.15),
    },

    '&:focus-visible': {
      outline: `2px solid ${foreground}`,
      outlineOffset: 2,
    },
  }
})

const VisuallyHidden = styled('span')({
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
})

export default function DocsSearch(): ReactElement {
  const router = useRouter()
  const isMac = useIsMac()
  const theme = useTheme()
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up('sm'))

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  const { results, isLoading, isError } = useDocsSearchIndex(query, open, category)

  const sections = useMemo<ResultSection[]>(() => {
    const grouped: Record<ResultCategory, DocsSearchResult[]> = {
      docs: [],
      datacards: [],
      models: [],
    }

    for (const result of results) {
      grouped[result.category].push(result)
    }

    return SECTION_ORDER.flatMap((sectionCategory) => {
      const rows = groupResults(grouped[sectionCategory], sectionCategory)

      return rows.length > 0
        ? [
            {
              category: sectionCategory,
              title: SECTION_TITLES[sectionCategory],
              rows,
            },
          ]
        : []
    })
  }, [results])

  const displayRows = useMemo(() => sections.flatMap((section) => section.rows), [sections])

  const rowIndexes = useMemo(() => new Map(displayRows.map((row, index) => [row.key, index])), [displayRows])

  const hasQuery = query.trim().length > 0

  const usesEntrySearch = category === 'all' || category === 'models' || category === 'datacards'

  const entriesUnavailable = isError && usesEntrySearch

  const openDialog = useCallback(() => {
    setOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setOpen(false)
    setQuery('')
    setCategory('all')
    setHighlightedIndex(0)
  }, [])

  const selectCategory = useCallback((nextCategory: SearchCategory) => {
    setCategory(nextCategory)
    setHighlightedIndex(0)

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  const navigateToRow = useCallback(
    (row: DisplayRow) => {
      closeDialog()
      void router.push(getRowHref(row))
    },
    [closeDialog, router],
  )

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openDialog()
      }
    }

    window.addEventListener('keydown', handleShortcut)

    return () => {
      window.removeEventListener('keydown', handleShortcut)
    }
  }, [openDialog])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query, category])

  useEffect(() => {
    setHighlightedIndex((current) => (displayRows.length === 0 ? 0 : Math.min(current, displayRows.length - 1)))
  }, [displayRows.length])

  useEffect(() => {
    if (!open || displayRows.length === 0) {
      return
    }

    document.getElementById(`docs-search-result-${highlightedIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [displayRows.length, highlightedIndex, open])

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDialog()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex((current) => (displayRows.length === 0 ? 0 : Math.min(current + 1, displayRows.length - 1)))
        break

      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex((current) => Math.max(current - 1, 0))
        break

      case 'Home':
        event.preventDefault()
        setHighlightedIndex(0)
        break

      case 'End':
        event.preventDefault()
        setHighlightedIndex(Math.max(displayRows.length - 1, 0))
        break

      case 'Enter': {
        const selected = displayRows[highlightedIndex]

        if (selected) {
          event.preventDefault()
          navigateToRow(selected)
        }

        break
      }
    }
  }

  const emptyMessage = hasQuery
    ? `No matches for “${query.trim()}” in ${category === 'all' ? 'any category' : SECTION_TITLES[category]}.`
    : `No ${category === 'all' ? 'searchable content' : SECTION_TITLES[category].toLowerCase()} available.`

  const loadingMessage =
    category === 'docs'
      ? 'Loading documentation…'
      : category === 'all'
        ? 'Loading search results…'
        : `Loading ${SECTION_TITLES[category].toLowerCase()}…`

  return (
    <Box>
      {isSmOrLarger ? (
        <Search
          role='button'
          tabIndex={0}
          onClick={openDialog}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup='true'
          aria-expanded={open ? 'true' : undefined}
          aria-label='Open search'
        >
          <StyledInputBase
            readOnly
            placeholder='Search...'
            sx={{ px: 1 }}
            startAdornment={<SearchIcon sx={{ m: 0.5 }} />}
            endAdornment={
              <ShortcutButton
                type='button'
                aria-label={`Open search (${isMac ? 'Command K' : 'Control K'})`}
                onClick={(event) => {
                  event.stopPropagation()
                  openDialog()
                }}
              >
                {isMac ? '⌘K' : 'Ctrl + K'}
              </ShortcutButton>
            }
            inputProps={{
              'aria-label': 'Search documentation, datacards and models',
              spellCheck: false,
            }}
          />
        </Search>
      ) : (
        <Tooltip title='Search'>
          <IconButton
            onClick={openDialog}
            sx={{
              color: 'white',
              backgroundColor: alpha(theme.palette.common.white, 0.15),
              '&:hover, &:focus': {
                backgroundColor: alpha(theme.palette.common.white, 0.25),
              },
              textTransform: 'capitalize',
              height: 'max-content',
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      )}
      <Dialog
        disableRestoreFocus
        open={open}
        onClose={closeDialog}
        slots={{ transition: Transition }}
        fullWidth
        maxWidth='lg'
        scroll='paper'
        aria-labelledby='docs-search-dialog-title'
        slotProps={{
          paper: {
            sx: {
              alignSelf: 'flex-start',
              mt: { xs: 4, sm: 8 },
            },
          },
        }}
      >
        <VisuallyHidden id='docs-search-dialog-title'>Search documentation, datacards and models</VisuallyHidden>
        <Box
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Box sx={{ p: 1.5 }}>
            <TextField
              inputRef={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='What are you looking for?'
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
                  endAdornment: isSmOrLarger ? (
                    <ShortcutButton type='button' color='black' aria-label='Close search' onClick={closeDialog}>
                      Esc
                    </ShortcutButton>
                  ) : undefined,
                },
              }}
            />
          </Box>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              px: 1.5,
              pb: 1.5,
              overflowX: 'auto',
            }}
            aria-label='Filter search results'
          >
            {CATEGORY_OPTIONS.map((option) => {
              const selected = category === option.value

              return (
                <Chip
                  key={option.value}
                  label={option.label}
                  clickable
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  aria-pressed={selected}
                  onClick={() => selectCategory(option.value)}
                />
              )
            })}
          </Stack>
        </Box>
        <DialogContent
          sx={{
            p: 0,
            maxHeight: 'min(60vh, 480px)',
          }}
        >
          {entriesUnavailable && (
            <Box
              role='alert'
              sx={(theme) => ({
                px: 2,
                py: 1,
                color: theme.palette.warning.dark,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
              })}
            >
              <Typography variant='caption'>
                Models and datacards could not be loaded. Documentation search remains available.
              </Typography>
            </Box>
          )}
          {isLoading && displayRows.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant='body2' color='text.secondary'>
                {loadingMessage}
              </Typography>
            </Box>
          ) : displayRows.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant='body2' color='text.secondary'>
                {emptyMessage}
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding id='docs-search-results' role='listbox' aria-label='Search results'>
              {sections.map((section) => (
                <Box
                  component='li'
                  key={section.category}
                  sx={{
                    display: 'block',
                    listStyle: 'none',
                  }}
                >
                  <Typography
                    component='div'
                    variant='overline'
                    color='text.secondary'
                    sx={(theme) => ({
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      display: 'block',
                      px: 2,
                      py: 1,
                      backgroundColor: theme.palette.background.paper,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    {section.title}
                  </Typography>
                  <List disablePadding role='group' aria-label={section.title}>
                    {section.rows.map((row) => {
                      const index = rowIndexes.get(row.key) ?? 0
                      const isHeading = row.kind === 'heading'

                      const title = isHeading ? row.result.title : row.title

                      const breadcrumb = isHeading ? undefined : row.breadcrumb

                      const snippetHtml = row.result?.snippetHtml

                      const selected = index === highlightedIndex

                      return (
                        <ListItemButton
                          key={row.key}
                          id={`docs-search-result-${index}`}
                          selected={selected}
                          role='option'
                          aria-selected={selected}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => navigateToRow(row)}
                          sx={{
                            alignItems: 'flex-start',
                            pl: isHeading ? 5 : 2,
                          }}
                        >
                          <Box
                            sx={{
                              pt: 0.5,
                              pr: 1.5,
                              color: 'secondary.main',
                            }}
                          >
                            {isHeading ? <LinkIcon fontSize='small' /> : <ArticleOutlined fontSize='small' />}
                          </Box>
                          <ListItemText
                            primary={
                              <Box
                                component='span'
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <Typography component='span' variant='body2' sx={{ fontWeight: isHeading ? 500 : 600 }}>
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
                                      color: 'inherit',
                                      borderRadius: '2px',
                                      backgroundColor: alpha(theme.palette.primary.main, 0.25),
                                    },
                                  })}
                                  dangerouslySetInnerHTML={{
                                    __html: snippetHtml,
                                  }}
                                />
                              ) : null
                            }
                          />
                        </ListItemButton>
                      )
                    })}
                  </List>
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
