import * as React from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { DocFileOrHeading, DocHeading, DocsMenuContent } from '../types/interfaces'
import { styled, useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Stack from '@mui/system/Stack'
import Button from '@mui/material/Button'
import ArrowForward from '@mui/icons-material/ArrowForward'
import ArrowBack from '@mui/icons-material/ArrowBack'
import Copyright from './Copyright'

const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.common.black,
}))

const drawerWidth = 240
const paddingIncrement = 2

const isDocHeading = (obj: DocFileOrHeading): obj is DocHeading => !!(obj as DocHeading).children

export default function DocsMenu({ menu, children }: { menu: DocsMenuContent; children: any }) {
  const { pathname, push } = useRouter()
  const theme = useTheme()

  const flattenPages = React.useCallback((array: DocsMenuContent) => {
    let result: DocsMenuContent = []
    array.forEach((item) => {
      result.push(item)
      if (isDocHeading(item)) {
        result = result.concat(flattenPages(item.children))
      }
    })
    return result.filter((item) => !isDocHeading(item) || item.hasIndex)
  }, [])

  const flattenedPages = React.useMemo(() => flattenPages(menu), [menu, flattenPages])

  const StyledList = styled(List)({
    paddingTop: 0,
    paddingBottom: 0,
    '&& .Mui-selected, && .Mui-selected:hover': {
      '&, & .MuiListItemIcon-root': {
        color: theme.palette.secondary.main,
      },
    },
  })

  const createDocElement = React.useCallback(
    (doc: DocFileOrHeading, paddingLeft = paddingIncrement) => {
      if (isDocHeading(doc)) {
        const childDocElements = doc.children.map((childDoc) =>
          createDocElement(childDoc, paddingLeft + paddingIncrement)
        )
        const headingText = <ListItemText primary={doc.title} primaryTypographyProps={{ fontWeight: 'bold' }} />

        return (
          <React.Fragment key={doc.slug}>
            {doc.hasIndex ? (
              <StyledLink passHref href={`/docs/${doc.slug}`}>
                <ListItemButton dense selected={pathname === `/docs/${doc.slug}`} sx={{ pl: paddingLeft }}>
                  {headingText}
                </ListItemButton>
              </StyledLink>
            ) : (
              <ListItem dense sx={{ pl: paddingLeft }}>
                {headingText}
              </ListItem>
            )}
            {childDocElements}
          </React.Fragment>
        )
      }
      return (
        <StyledLink passHref href={`/docs/${doc.slug}`} key={doc.slug}>
          <ListItemButton dense selected={pathname === `/docs/${doc.slug}`} sx={{ pl: paddingLeft }}>
            <ListItemText primary={doc.title} />
          </ListItemButton>
        </StyledLink>
      )
    },
    [pathname]
  )

  const docsMenu = React.useMemo(() => menu.map((doc) => createDocElement(doc)), [menu, createDocElement])

  const reducedPath = React.useMemo(() => pathname.replace(/^(\/docs\/)/, ''), [pathname])

  const currentIndex = React.useMemo(
    () => flattenedPages.findIndex((item) => item.slug === reducedPath),
    [flattenedPages, reducedPath]
  )

  function changePage(newIndex: number) {
    const newPage = flattenedPages[newIndex]
    push(`/docs/${newPage.slug}`)
  }

  function changePageToDocsHome() {
    push('/docs')
  }

  return (
    <Box display='flex' width='100%'>
      <>
        <Box
          sx={{
            minWidth: 200,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            overflow: 'auto',
          }}
        >
          <StyledList>{docsMenu}</StyledList>
        </Box>
        <Box flex={1} overflow='auto' sx={{ background: '#f3f1f1' }}>
          <Box display='flex' flexDirection='column' height='100%'>
            <Container
              maxWidth='lg'
              sx={{
                'a:link': {
                  color: theme.palette.primary.main,
                },
                'a:visited': {
                  color: theme.palette.primary.main,
                },
              }}
            >
              {children}
            </Container>
            <Box sx={{ width: '100%', pl: 4, pr: 4, mt: 4 }}>
              <Divider flexItem />
              {flattenedPages.length > 0 && (
                <Box sx={{ pt: 2, mt: 'auto', pl: 4, pr: 4 }}>
                  <Stack direction='row' justifyContent='space-around'>
                    {currentIndex === 0 && (
                      <Button startIcon={<ArrowBack />} onClick={() => changePageToDocsHome()}>
                        Home
                      </Button>
                    )}
                    {currentIndex > 0 && (
                      <Button startIcon={<ArrowBack />} onClick={() => changePage(currentIndex - 1)}>
                        {flattenedPages[currentIndex - 1].title}
                      </Button>
                    )}
                    {currentIndex < flattenedPages.length - 1 && (
                      <Button endIcon={<ArrowForward />} onClick={() => changePage(currentIndex + 1)}>
                        {flattenedPages[currentIndex + 1].title}
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
            <Copyright sx={{ pb: 2, pt: 4 }} />
          </Box>
        </Box>
      </>
    </Box>
  )
}
