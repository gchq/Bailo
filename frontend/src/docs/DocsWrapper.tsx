import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { grey } from '@mui/material/colors'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import { styled, useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { Fragment, ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'

import { directory, DirectoryTree, flatDirectory } from '../../pages/docs/directory'
import Title from '../common/Title'
import Copyright from '../Copyright'

type DocsWrapperProps = {
  children?: ReactNode
}
enum DirectionalNavigation {
  FORWARD = 1,
  BACKWARD = -1,
}

const paddingIncrement = 2

const StyledList = styled(List)(({ theme }) => ({
  paddingTop: 0,
  paddingBottom: 0,
  '&& .Mui-selected, && .Mui-selected:hover': {
    '&, & .MuiListItemIcon-root': {
      color: theme.palette.secondary.main,
    },
  },
}))

export default function DocsWrapper({ children }: DocsWrapperProps): ReactElement {
  const theme = useTheme()
  const { pathname, push } = useRouter()
  const ref = useRef(null)

  useEffect(() => {
    if (ref && pathname) {
      const section = document.getElementById(pathname.replaceAll('/', '-')) as HTMLElement
      if (!section) {
        return
      }
      section.scrollIntoView({ block: 'center' })
    }
  }, [ref, pathname])

  const createDocElement = useCallback(
    (doc: DirectoryTree, paddingLeft = paddingIncrement) => {
      let children: Array<any> = []
      if (doc.children) {
        // eslint-disable-next-line react-hooks/immutability
        children = doc.children.map((child) => createDocElement(child, paddingLeft + paddingIncrement))
      }

      if (doc.title === 'Root') {
        return <>{children}</>
      }

      const path = `/docs/${doc.slug}`
      const isSelected = pathname === path

      const headerFontSize =
        {
          1: theme.typography.h6.fontSize,
          2: theme.typography.subtitle1.fontSize,
        }[doc.level] ?? theme.typography.body2.fontSize

      return (
        <Fragment key={doc.slug}>
          {doc.header && doc.slug ? (
            <ListItem dense sx={{ pl: 1 + paddingLeft }} id={path.replaceAll('/', '-')}>
              <ListItemText
                primary={doc.title}
                slotProps={{
                  primary: { sx: { fontSize: headerFontSize, fontWeight: 'bold' } },
                }}
              />
            </ListItem>
          ) : (
            <ListItem dense sx={{ pl: paddingLeft }} id={path.replaceAll('/', '-')}>
              <Link passHref href={path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                <ListItemButton dense selected={isSelected} sx={{ pl: 1 }}>
                  <ListItemText
                    primary={doc.title}
                    slotProps={{
                      primary: {
                        sx: { fontWeight: doc.slug ? 'normal' : 'bold', fontSize: doc.header ? headerFontSize : '' },
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          )}
          {children}
        </Fragment>
      )
    },
    [pathname, theme.typography.body2.fontSize, theme.typography.h6.fontSize, theme.typography.subtitle1.fontSize],
  )

  const docList = () => {
    return <StyledList>{createDocElement(directory)}</StyledList>
  }

  const currentIndex = useMemo(
    () => flatDirectory.findIndex((item) => item.slug === pathname.replace(/^(\/docs\/)/, '')),
    [pathname],
  )

  function changePage(newIndex: number) {
    const newPage = flatDirectory[newIndex]
    push(`/docs/${newPage.slug}`)
  }

  function changePageToDocsHome() {
    push('/docs')
  }

  function getNewIndex(currentIndex: number, direction: DirectionalNavigation) {
    let increment = 0 + direction
    let index: undefined | number = undefined
    while (!index && currentIndex + increment >= 0 && currentIndex + increment < flatDirectory.length) {
      if (!('header' in flatDirectory[currentIndex + increment])) {
        index = currentIndex + increment
      }
      increment += direction
    }

    return index === undefined ? 0 : index
  }

  return (
    <>
      <Title text='Documentation' />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Box
          sx={[
            {
              position: { xs: 'relative', sm: 'fixed' },
              height: { xs: '250px', sm: 'calc(100vh - 80px)' },
            },
            (theme) => ({
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
              overflow: 'auto',
              py: 2,
            }),
          ]}
        >
          {docList()}
        </Box>
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            paddingLeft: { sm: '350px' },
            height: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Container
              maxWidth='lg'
              sx={{
                'a:link': {
                  color: theme.palette.primary.main,
                },
                'a:visited': {
                  color: theme.palette.primary.main,
                },
                blockquote: {
                  fontStyle: 'italic',
                  background: grey.A200,
                  borderLeft: `2px solid ${grey[900]}`,
                  px: 1,
                  py: 0.5,
                },
              }}
            >
              {children}
            </Container>
            <Box sx={{ width: '100%', pl: 4, pr: 4, mt: 'auto' }}>
              <Divider flexItem />
              {flatDirectory.length > 0 && (
                <Box sx={{ pt: 2, mt: 'auto', pl: 4, pr: 4 }}>
                  <Stack
                    direction={{ sm: 'column', md: 'row' }}
                    sx={{
                      justifyContent: 'space-around',
                    }}
                  >
                    {currentIndex === 0 && (
                      <Button startIcon={<ArrowBack />} onClick={() => changePageToDocsHome()}>
                        Home
                      </Button>
                    )}
                    {currentIndex > 0 && (
                      <Button
                        startIcon={<ArrowBack />}
                        onClick={() => changePage(getNewIndex(currentIndex, DirectionalNavigation.BACKWARD))}
                      >
                        {flatDirectory[getNewIndex(currentIndex, DirectionalNavigation.BACKWARD)].title}
                      </Button>
                    )}
                    {currentIndex < flatDirectory.length - 1 && (
                      <Button
                        endIcon={<ArrowForward />}
                        onClick={() => changePage(getNewIndex(currentIndex, DirectionalNavigation.FORWARD))}
                      >
                        {flatDirectory[getNewIndex(currentIndex, DirectionalNavigation.FORWARD)].title}
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
            <Copyright sx={{ pb: 2, pt: 4 }} />
          </Box>
        </Box>
      </Stack>
    </>
  )
}
