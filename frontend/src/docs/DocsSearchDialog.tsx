import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import DatasetIcon from '@mui/icons-material/Dataset'
import LinkIcon from '@mui/icons-material/Link'
import SearchIcon from '@mui/icons-material/Search'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import {
  Box,
  ButtonBase,
  Chip,
  Dialog,
  DialogContent,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { KeyboardEvent, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import { Transition } from 'src/common/Transition'
import {
  DocsSearchCategory,
  DocsSearchCategoryOption,
  DocsSearchDialogProps,
  DocsSearchDisplayRow as DisplayRow,
  DocsSearchFilter as SearchFilter,
  DocsSearchPageRow as PageRow,
  DocsSearchResult,
  DocsSearchResultSection as ResultSection,
} from 'types/docs'

import { useDocsSearchIndex } from './useDocsSearchIndex'

type SearchCategory = SearchFilter

const CATEGORY_OPTIONS: DocsSearchCategoryOption[] = [
  { value: 'all', label: 'All' },

  { value: 'models', label: 'Models' },
  { value: 'datacards', label: 'Datacards' },
  { value: 'docs', label: 'Documentation' },
]

const DEFAULT_SECTION_ORDER: DocsSearchCategory[] = ['models', 'datacards', 'docs']
const HELP_SECTION_ORDER: DocsSearchCategory[] = ['docs', 'models', 'datacards']

const SECTION_TITLES: Record<DocsSearchCategory, string> = {
  docs: 'User documentation',
  datacards: 'Datacards',
  models: 'Models',
}

function groupResults(results: DocsSearchResult[], category: DocsSearchCategory): DisplayRow[] {
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
      const [pageTitle, ...breadcrumbParts] = result.breadcrumb.split(' - ')

      page = {
        kind: 'page',
        key: `docs:page:${result.slug || '__root__'}`,
        category: 'docs',
        slug: result.slug,
        title: result.kind === 'page' ? result.title : pageTitle || result.slug,
        breadcrumb: result.kind === 'page' ? result.breadcrumb : breadcrumbParts.join(' - '),
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

const ShortcutButton = styled(ButtonBase)(({ theme }) => ({
  color: theme.palette.common.black,
  backgroundColor: 'inherit',
  border: `1px solid ${alpha(theme.palette.common.black, 0.5)}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  font: 'inherit',
  lineHeight: 1,
  whiteSpace: 'nowrap',

  '&:hover': {
    color: theme.palette.common.black,
    borderColor: theme.palette.common.black,
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },

  '&:focus-visible': {
    outline: `2px solid ${theme.palette.common.black}`,
  },
}))

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

export default function DocsSearchDialog({ open, onClose }: DocsSearchDialogProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const theme = useTheme()
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up('sm'))

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const shouldScrollHighlightedResult = useRef(false)

  const { results, isLoading, isError } = useDocsSearchIndex(query, open, category)

  const sectionOrder = router.pathname === '/help' ? HELP_SECTION_ORDER : DEFAULT_SECTION_ORDER

  const sections = useMemo<ResultSection[]>(() => {
    const grouped: Record<DocsSearchCategory, DocsSearchResult[]> = {
      docs: [],
      datacards: [],
      models: [],
    }

    for (const result of results) {
      grouped[result.category].push(result)
    }

    return sectionOrder.flatMap((sectionCategory) => {
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
  }, [results, sectionOrder])

  const displayRows = useMemo(() => sections.flatMap((section) => section.rows), [sections])
  const rowIndexes = useMemo(() => new Map(displayRows.map((row, index) => [row.key, index])), [displayRows])
  const hasQuery = query.trim().length > 0
  const usesEntrySearch = category === 'all' || category === 'models' || category === 'datacards'
  const entriesUnavailable = isError && usesEntrySearch

  const closeDialog = useCallback(() => {
    onClose()
    setQuery('')
    setCategory('all')
    setHighlightedIndex(0)
  }, [onClose])

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
      router.push(getRowHref(row))
    },
    [closeDialog, router],
  )

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query, category])

  useEffect(() => {
    setHighlightedIndex((current) => (displayRows.length === 0 ? 0 : Math.min(current, displayRows.length - 1)))
  }, [displayRows.length])

  useEffect(() => {
    if (!open || displayRows.length === 0 || !shouldScrollHighlightedResult.current) {
      return
    }

    shouldScrollHighlightedResult.current = false
    document.getElementById(`docs-search-result-${highlightedIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [displayRows.length, highlightedIndex, open])

  const updateHighlightedIndexFromKeyboard = (update: (current: number) => number) => {
    shouldScrollHighlightedResult.current = true
    setHighlightedIndex(update)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        updateHighlightedIndexFromKeyboard((current) =>
          displayRows.length === 0 ? 0 : Math.min(current + 1, displayRows.length - 1),
        )
        break

      case 'ArrowUp':
        event.preventDefault()
        updateHighlightedIndexFromKeyboard((current) => Math.max(current - 1, 0))
        break

      case 'Home':
        event.preventDefault()
        updateHighlightedIndexFromKeyboard(() => 0)
        break

      case 'End':
        event.preventDefault()
        updateHighlightedIndexFromKeyboard(() => Math.max(displayRows.length - 1, 0))
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
    ? `No matches for "${query.trim()}" in ${category === 'all' ? 'any category' : SECTION_TITLES[category]}.`
    : `No ${category === 'all' ? 'searchable content' : SECTION_TITLES[category].toLowerCase()} available.`

  return (
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
            overflow: 'hidden',
          },
        },
      }}
    >
      <VisuallyHidden id='docs-search-dialog-title'>Search documentation, datacards and models</VisuallyHidden>
      <Box
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
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
                  <ShortcutButton type='button' aria-label='Close search' onClick={closeDialog}>
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
          useFlexGap
          sx={{
            px: 1.5,
            pb: 1.5,
            flexWrap: 'wrap',
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
                component='button'
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
          maxHeight: 'min(60vh, 720px)',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        {entriesUnavailable && (
          <Box
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
            <Loading />
          </Box>
        ) : displayRows.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyBlob text={emptyMessage} />
          </Box>
        ) : (
          <List dense disablePadding id='docs-search-results' aria-label='Search results'>
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
                <List disablePadding aria-label={section.title}>
                  {section.rows.map((row) => {
                    const index = rowIndexes.get(row.key) ?? 0
                    const isHeading = row.kind === 'heading'
                    const title = isHeading ? row.result.title : row.title
                    const breadcrumb = isHeading ? undefined : row.breadcrumb
                    const snippetHtml = row.result?.snippetHtml
                    const selected = index === highlightedIndex
                    const resultIcon = isHeading ? (
                      <LinkIcon fontSize='small' />
                    ) : row.category === 'models' ? (
                      <SmartToyIcon fontSize='small' />
                    ) : row.category === 'datacards' ? (
                      <DatasetIcon fontSize='small' />
                    ) : (
                      <ArticleOutlined fontSize='small' />
                    )

                    return (
                      <ListItemButton
                        key={row.key}
                        id={`docs-search-result-${index}`}
                        selected={selected}
                        onMouseEnter={() => {
                          shouldScrollHighlightedResult.current = false
                          setHighlightedIndex(index)
                        }}
                        onClick={() => navigateToRow(row)}
                        sx={{
                          alignItems: 'flex-start',
                          pl: isHeading ? 5 : 2,
                          scrollMarginTop: 40,
                        }}
                      >
                        <Box
                          sx={{
                            pt: 0.5,
                            pr: 1.5,
                            color: 'secondary.main',
                          }}
                        >
                          {resultIcon}
                        </Box>
                        <ListItemText
                          sx={{ minWidth: 0 }}
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
                                <Typography
                                  component='span'
                                  variant='caption'
                                  color='textSecondary'
                                  sx={{
                                    overflowWrap: 'anywhere',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                  }}
                                >
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
                                color='textSecondary'
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
  )
}
