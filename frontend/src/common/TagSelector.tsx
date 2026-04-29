import { Close, Done, Edit } from '@mui/icons-material'
import { Chip, Grid, TextField, Typography } from '@mui/material'
import Autocomplete, { autocompleteClasses, AutocompleteCloseReason } from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Popper from '@mui/material/Popper'
import { styled, useTheme } from '@mui/material/styles'
import { useGetPopularEntryTags } from 'actions/entry'
import { useContext } from 'react'
import * as React from 'react'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import { RestrictedActionKeys } from 'types/types'

interface PopperComponentProps {
  anchorEl?: any
  disablePortal?: boolean
  open: boolean
}

interface EntryTagSelectorProps {
  onChange: (newTag: string[]) => void
  tags: string[]
  errorText?: string
  restrictedToAction?: RestrictedActionKeys
}

const StyledAutocompletePopper = styled('div')(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    margin: 0,
    color: 'inherit',
    fontSize: 13,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
    backgroundColor: '#fff',
    ...theme.applyStyles('dark', {
      backgroundColor: '#1c2128',
    }),
    [`& .${autocompleteClasses.option}`]: {
      minHeight: 'auto',
      alignItems: 'flex-start',
      padding: 8,
      borderBottom: '1px solid #eaecef',
      ...theme.applyStyles('dark', {
        borderBottom: '1px solid #30363d',
      }),
      '&[aria-selected="true"]': {
        backgroundColor: 'transparent',
      },
      [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]: {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: 'relative',
  },
}))

function PopperComponent(props: PopperComponentProps) {
  const { disablePortal: _disablePortal, anchorEl: _anchorEl, open: _open, ...other } = props
  return <StyledAutocompletePopper {...other} />
}

const StyledPopper = styled(Popper)(({ theme }) => ({
  border: '1px solid #e1e4e8',
  boxShadow: `0 8px 24px ${'rgba(149, 157, 165, 0.2)'}`,
  color: '#24292e',
  backgroundColor: '#fff',
  borderRadius: 6,
  width: 300,
  zIndex: theme.zIndex.modal,
  fontSize: 13,
  ...theme.applyStyles('dark', {
    border: '1px solid #30363d',
    boxShadow: '0 8px 24px rgb(1, 4, 9)',
    color: '#c9d1d9',
    backgroundColor: '#1c2128',
  }),
}))

const Button = styled(ButtonBase)(({ theme }) => ({
  fontSize: 13,
  width: '100%',
  textAlign: 'left',
  paddingBottom: 8,
  fontWeight: 600,
  color: '#586069',
  ...theme.applyStyles('dark', {
    color: '#8b949e',
  }),
  '&:hover,&:focus': {
    color: '#0366d6',
    ...theme.applyStyles('dark', {
      color: '#58a6ff',
    }),
  },
  '& span': {
    width: '100%',
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}))

export default function TagSelector({ onChange, tags, errorText = '', restrictedToAction }: EntryTagSelectorProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [pendingValue, setPendingValue] = React.useState<string[]>([])
  const { userPermissions } = useContext(UserPermissionsContext)
  const { tags: popularTags, isTagsError } = useGetPopularEntryTags()
  const theme = useTheme()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setPendingValue(tags)
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    onChange(pendingValue)
    if (anchorEl) {
      anchorEl.focus()
    }
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'tag-selector' : undefined

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ fontSize: 13 }}>
        <Button
          disabled={restrictedToAction && !userPermissions[restrictedToAction].hasPermission}
          disableRipple
          aria-describedby={id}
          onClick={handleClick}
          style={{ fontWeight: 'bold', color: theme.palette.primary.main, width: 'auto' }}
        >
          {restrictedToAction && userPermissions[restrictedToAction].hasPermission ? (
            <Box>
              <span>Update Tags: </span>
              <Edit />
            </Box>
          ) : (
            <span>Tags: </span>
          )}
        </Button>
        <Grid
          container
          spacing={1}
          sx={{
            alignItems: 'center',
          }}
        >
          {tags.map((label) => (
            <Grid key={label}>
              <Chip variant='filled' label={label} key={label} />
            </Grid>
          ))}
        </Grid>
      </Box>
      <StyledPopper id={id} open={open} anchorEl={anchorEl} placement='bottom-start'>
        <ClickAwayListener onClickAway={handleClose}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={(t) => ({
                borderBottom: '1px solid #30363d',
                padding: '8px 10px',
                fontWeight: 600,
                ...t.applyStyles('light', {
                  borderBottom: '1px solid #eaecef',
                }),
              })}
            >
              Add a new tag or select an existing popular tag
            </Box>
            <Autocomplete
              freeSolo
              disableClearable={true}
              open
              multiple
              onClose={(event: React.ChangeEvent<object>, reason: AutocompleteCloseReason) => {
                if (reason === 'escape') {
                  handleClose()
                }
              }}
              value={pendingValue}
              onChange={(event, newValue, reason) => {
                if (
                  event.type === 'keydown' &&
                  ((event as React.KeyboardEvent).key === 'Backspace' ||
                    (event as React.KeyboardEvent).key === 'Delete') &&
                  reason === 'removeOption'
                ) {
                  return
                }
                setPendingValue(newValue)
              }}
              disableCloseOnSelect
              renderValue={() => null}
              noOptionsText='No tags'
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props
                return (
                  <li key={key} {...optionProps}>
                    <Box
                      component={Done}
                      sx={{ width: 17, height: 17, mr: '5px', ml: '-2px' }}
                      style={{
                        visibility: selected ? 'visible' : 'hidden',
                      }}
                    />
                    <Box
                      component='span'
                      sx={{
                        width: 14,
                        height: 14,
                        flexShrink: 0,
                        borderRadius: '3px',
                        mr: 1,
                        mt: '2px',
                      }}
                    />
                    <Box
                      sx={(t) => ({
                        flexGrow: 1,
                        '& span': {
                          color: '#8b949e',
                          ...t.applyStyles('light', {
                            color: '#586069',
                          }),
                        },
                      })}
                    >
                      {option}
                      <br />
                    </Box>
                    <Box
                      component={Close}
                      sx={{ opacity: 0.6, width: 18, height: 18 }}
                      style={{
                        visibility: selected ? 'visible' : 'hidden',
                      }}
                    />
                  </li>
                )
              }}
              options={[...new Set([...popularTags, ...tags, ...pendingValue])]}
              renderInput={(params) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '95%', height: '95%', mx: 'auto', pt: 1 }}>
                  <TextField {...params} size='small' autoFocus placeholder='Filter existing or create new tag' />
                </Box>
              )}
              slots={{
                popper: PopperComponent,
              }}
            />
            <Typography variant='caption' color={theme.palette.error.main}>
              {errorText}
              {isTagsError?.info.message}
            </Typography>
          </Box>
        </ClickAwayListener>
      </StyledPopper>
    </Box>
  )
}
