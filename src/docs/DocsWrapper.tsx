import React, { Fragment, ReactElement, ReactNode, useCallback, useContext, useMemo } from 'react'
import { Box, Container, List, ListItem, ListItemButton, ListItemText, styled, useTheme } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Wrapper from '@/src/Wrapper'
import Copyright from '@/src/Copyright'
import { lightTheme } from '@/src/theme'
import DocsMenuContext from '@/src/contexts/docsMenuContext'
import isDocHeading from '@/utils/isDocHeading'
import { DocFileOrHeading } from '@/types/interfaces'

type DocsWrapperProps = {
  children?: ReactNode
}

const paddingIncrement = 2

export default function DocsWrapper({ children }: DocsWrapperProps): ReactElement {
  const theme = useTheme() || lightTheme
  const { pathname } = useRouter()
  const { docsMenuContent, errorMessage } = useContext(DocsMenuContext)

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

  return (
    <Wrapper title='Documentation' page='docs'>
      {/* Banner height + Toolbar height == 96px */}
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
              }}
            >
              <StyledList>{docsMenu}</StyledList>
            </Box>
            <Box flex={1} overflow='auto'>
              <Box display='flex' flexDirection='column' height='100%'>
                <Container maxWidth='lg'>{children}</Container>
                <Copyright sx={{ pb: 2, pt: 4, mt: 'auto' }} />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Wrapper>
  )
}
