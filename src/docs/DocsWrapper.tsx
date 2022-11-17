import React, { Fragment, ReactElement, ReactNode, useCallback, useContext, useMemo } from 'react'
import { useTheme, styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Wrapper from '@/src/Wrapper'
import Copyright from '@/src/Copyright'
import DocsMenuContext from '@/src/contexts/docsMenuContext'
import isDocHeading from '@/utils/type-guards/isDocHeading'
import { DocFileOrHeading, DocsMenuContent } from '@/types/interfaces'
import Stack from '@mui/system/Stack'
import Button from '@mui/material/Button'
import ArrowForward from '@mui/icons-material/ArrowForward'
import ArrowBack from '@mui/icons-material/ArrowBack'
import Divider from '@mui/material/Divider'

type DocsWrapperProps = {
  children?: ReactNode
}

const paddingIncrement = 2

export default function DocsWrapper({ children }: DocsWrapperProps): ReactElement {
  const theme = useTheme()
  const { pathname, push } = useRouter()
  const { docsMenuContent, errorMessage } = useContext(DocsMenuContext)

  const flattenPages = useCallback((array: DocsMenuContent) => {
    let result: DocsMenuContent = []
    array.forEach((item) => {
      result.push(item)
      if (isDocHeading(item)) {
        result = result.concat(flattenPages(item.children))
      }
    })
    return result.filter((item) => !isDocHeading(item) || item.hasIndex)
  }, [])

  const flattenedPages = useMemo(() => flattenPages(docsMenuContent), [docsMenuContent, flattenPages])

  const StyledList = styled(List)({
    paddingTop: 0,
    paddingBottom: 0,
    '&& .Mui-selected, && .Mui-selected:hover': {
      '&, & .MuiListItemIcon-root': {
        color: theme.palette.secondary.main,
      },
    },
  })

  const createDocElement = useCallback(
    (doc: DocFileOrHeading, paddingLeft = paddingIncrement) => {
      if (isDocHeading(doc)) {
        const childDocElements = doc.children.map((childDoc) =>
          createDocElement(childDoc, paddingLeft + paddingIncrement)
        )
        const headingText = <ListItemText primary={doc.title} primaryTypographyProps={{ fontWeight: 'bold' }} />

        return (
          <Fragment key={doc.slug}>
            {doc.hasIndex ? (
              <Link passHref href={`/docs/${doc.slug}`}>
                <ListItemButton dense selected={pathname === `/docs/${doc.slug}`} sx={{ pl: paddingLeft }}>
                  {headingText}
                </ListItemButton>
              </Link>
            ) : (
              <ListItem dense sx={{ pl: paddingLeft }}>
                {headingText}
              </ListItem>
            )}
            {childDocElements}
          </Fragment>
        )
      }
      return (
        <Link passHref href={`/docs/${doc.slug}`} key={doc.slug}>
          <ListItemButton dense selected={pathname === `/docs/${doc.slug}`} sx={{ pl: paddingLeft }}>
            <ListItemText primary={doc.title} />
          </ListItemButton>
        </Link>
      )
    },
    [pathname]
  )

  const docsMenu = useMemo(
    () => docsMenuContent.map((doc) => createDocElement(doc)),
    [docsMenuContent, createDocElement]
  )

  const reducedPath = useMemo(() => pathname.replace(/^(\/docs\/)/, ''), [pathname])

  const currentIndex = useMemo(
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
    <Wrapper title='Documentation' page='docs'>
      {/* Banner height + Toolbar height = 96px */}
      <Box display='flex' width='100%' height='calc(100vh - 96px)'>
        {errorMessage ? (
          <Box mx='auto' mt={4}>
            {errorMessage}
          </Box>
        ) : (
          <>
            <Box
              sx={{
                minWidth: 200,
                backgroundColor: theme.palette.background.paper,
                borderRight: `1px solid ${theme.palette.divider}`,
                overflow: 'auto',
                py: 2,
              }}
            >
              <StyledList>{docsMenu}</StyledList>
            </Box>
            <Box flex={1} overflow='auto'>
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
                <Box sx={{ width: '100%', pl: 4, pr: 4, mt: 'auto' }}>
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
        )}
      </Box>
    </Wrapper>
  )
}
