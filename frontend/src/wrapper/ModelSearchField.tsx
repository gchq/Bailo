import SearchIcon from '@mui/icons-material/Search'
import { Box, InputBase, List, ListItemButton, ListItemText, Popover, Stack } from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import { ChangeEvent, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import useDebounce from 'src/hooks/useDebounce'
import Link from 'src/Link'
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

export default function ModelSearchField() {
  const [modelFilter, setModelFilter] = useState('')
  const debouncedFilter = useDebounce(modelFilter, 250)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const theme = useTheme()
  const { models, isModelsLoading, isModelsError } = useListModels([], '', [], debouncedFilter)

  const modelList = useMemo(
    () =>
      models.map((model) => (
        <Box key={model.id} sx={{ maxWidth: '300px' }}>
          <Link href={`/model/${model.id}`} noLinkStyle>
            <ListItemButton>
              <ListItemText
                primary={model.name}
                secondary={model.description}
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
          </Link>
        </Box>
      )),
    [models, theme.palette.primary.main],
  )
  const searchMenuOpen = useMemo(() => !!anchorEl, [anchorEl])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setModelFilter(event.target.value)
    if (event.target.value.length >= 3) {
      setAnchorEl(event.currentTarget)
    }
  }

  if (isModelsError) {
    return <MessageAlert message={isModelsError.info.message} severity='error' slimView />
  }

  return (
    <Stack>
      <Search>
        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
          <SearchIcon sx={{ ml: 1 }} />
          <StyledInputBase
            placeholder='Search for a model'
            inputProps={{ 'aria-label': 'search for a model' }}
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
          {isModelsLoading && <Loading />}
          {!isModelsLoading && (
            <List dense disablePadding>
              {modelList}
            </List>
          )}
          {!isModelsLoading && modelList.length === 0 && (
            <Box sx={{ p: 4, minWidth: '272px' }}>
              <EmptyBlob text='No models found' />
            </Box>
          )}
        </Popover>
      )}
    </Stack>
  )
}
