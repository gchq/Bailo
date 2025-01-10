import SearchIcon from '@mui/icons-material/Search'
import { Box, InputBase, List, ListItemText, Popover, Stack } from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { EntrySearchResult, useListModels } from 'actions/model'
import { ChangeEvent, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import useDebounce from 'src/hooks/useDebounce'
import MessageAlert from 'src/MessageAlert'

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
  } = useListModels(undefined, [], '', [], debouncedFilter)

  interface KindGroupedEntry {
    id: string
    name: string
    description: string
    tags: Array<string>
  }

  function reducerFunction(accumulator: Array<KindGroupedEntry>, currentValue: EntrySearchResult) {
    const { kind, ...rest } = currentValue

    if (!accumulator[kind]) {
      accumulator[kind] = []
    }

    accumulator[kind].push(rest)
    // console.log(accumulator)
    return accumulator
  }

  function groupEntriesByKind(resultArray: EntrySearchResult[]): Array<KindGroupedEntry> {
    //console.log(resultArray)
    const test = resultArray.reduce(reducerFunction, [])
    // console.log(test)
    return test
  }

  const modelList = useMemo(
    () =>
      groupEntriesByKind(entries).map((entry) => (
        <Box key={entry.id} sx={{ maxWidth: '300px' }}>
          <ListItemText primary={'test'} />
          {/* <Link href={`/${entry[0]}`} noLinkStyle>
            <ListItemButton>
              <ListItemText
                primary={`${entry[0].name}`}
                secondary={entry[0].description}
                primaryTypographyProps={{
                  style: {
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    color: theme.palette.primary.main,
                  },
                }}
                secondaryTypographyProps={{
                  style: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
                }}
              />
            </ListItemButton>
          </Link> */}
        </Box>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
