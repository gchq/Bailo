import SearchIcon from '@mui/icons-material/Search'
import { Box, ButtonBase, IconButton, InputBase, Tooltip, useMediaQuery } from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { KeyboardEvent, ReactElement, useCallback, useEffect, useState } from 'react'
import useIsMac from 'src/hooks/useIsMac'

import DocsSearchDialog from './DocsSearchDialog'

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

const ShortcutButton = styled(ButtonBase)(({ theme }) => ({
  color: theme.palette.common.white,
  backgroundColor: 'inherit',
  border: `1px solid ${alpha(theme.palette.common.white, 0.5)}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  font: 'inherit',
  lineHeight: 1,
  whiteSpace: 'nowrap',

  '&:hover': {
    color: theme.palette.common.white,
    borderColor: theme.palette.common.white,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
  },

  '&:focus-visible': {
    outline: `2px solid ${theme.palette.common.white}`,
  },
}))

export default function DocsSearch(): ReactElement {
  const isMac = useIsMac()
  const theme = useTheme()
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up('sm'))
  const [open, setOpen] = useState(false)

  const openDialog = useCallback(() => {
    setOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setOpen(false)
  }, [])

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

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDialog()
    }
  }

  return (
    <Box>
      {isSmOrLarger ? (
        <Search
          tabIndex={0}
          onClick={openDialog}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup='dialog'
          aria-expanded={open}
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
            aria-label='Open search'
            sx={{
              color: theme.palette.common.white,
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
      <DocsSearchDialog open={open} onClose={closeDialog} />
    </Box>
  )
}
