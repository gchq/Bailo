import SearchIcon from '@mui/icons-material/Search'
import { Box, Chip, InputBase, List, ListItem, ListItemButton, ListItemText, Popover, Stack } from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import { ChangeEvent, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import useDebounce from 'src/hooks/useDebounce'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryKindLabel } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

const Search = styled('div')(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover, &:focus': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  paddingRight: theme.spacing(1),
  '& .MuiInputBase-input': {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '16ch',
      '&:hover, &:focus': {
        width: '25ch',
      },
    },
  },
}))

export default function EntrySearch() {
  const [modelFilter, setModelFilter] = useState('')
  const debouncedFilter = useDebounce(modelFilter, 250)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const theme = useTheme()
  const {
    models: entries,
    isModelsLoading: isEntriesLoading,
    isModelsError: isEntriesError,
  } = useListModels(undefined, [], '', [], [], debouncedFilter)

  const modelList = useMemo(
    () =>
      entries.map((entry) => (
        <Box key={entry.id} sx={{ maxWidth: '400px' }}>
          <Link href={`/${entry.kind}/${entry.id}`} noLinkStyle>
            <ListItem
              disablePadding
              secondaryAction={<Chip label={toTitleCase(EntryKindLabel[entry.kind])} size='small' />}
            >
              <ListItemButton>
                <ListItemText
                  primary={entry.name}
                  secondary={entry.description}
                  slotProps={{
                    primary: {
                      sx: {
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        color: theme.palette.primary.main,
                        mr: 6,
                      },
                    },

                    secondary: {
                      sx: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', mr: 6 },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          </Link>
        </Box>
      )),
    [entries, theme.palette.primary.main],
  )
  const searchMenuOpen = useMemo(() => !!anchorEl, [anchorEl])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setModelFilter(event.target.value)
    if (event.target.value.length >= 3) {
      setAnchorEl(event.currentTarget)
    }
  }

  if (isEntriesError) {
    return <MessageAlert message={isEntriesError.info.message} severity='error' slimView />
  }

  return (
    <Stack>
      <Search sx={{ pl: 1 }}>
        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
          <SearchIcon />
          <StyledInputBase
            placeholder='Search'
            inputProps={{ 'aria-label': 'search for a data card or model' }}
            value={modelFilter}
            onChange={handleChange}
          />
        </Stack>
      </Search>
      {searchMenuOpen && (
        <Popover
          open={searchMenuOpen}
          onClose={() => setAnchorEl(null)}
          anchorEl={anchorEl}
          disableAutoFocus
          disableEnforceFocus
          sx={{ maxHeight: '400px', minWidth: '272px' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 152,
          }}
        >
          <Box sx={{ minWidth: '272px', borderTopLeftRadius: 20 }}>
            {isEntriesLoading && (
              <Box sx={{ p: 4 }}>
                <Loading />
              </Box>
            )}
            {!isEntriesLoading && (
              <List dense disablePadding>
                {modelList}
              </List>
            )}
            {!isEntriesLoading && modelList.length === 0 && (
              <Box sx={{ p: 4 }}>
                <EmptyBlob text='No data cards/models found' />
              </Box>
            )}
          </Box>
        </Popover>
      )}
    </Stack>
  )
}
