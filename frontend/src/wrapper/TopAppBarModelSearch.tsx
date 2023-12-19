import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Divider,
  InputBase,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import { ChangeEvent, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import useDebounce from 'utils/hooks/useDebounce'

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '16ch',
      '&:focus': {
        width: '25ch',
      },
    },
  },
}))

export default function TopAppBarModelSearch() {
  const [modelFilter, setModelFilter] = useState('')
  const debouncedFilter = useDebounce(modelFilter, 250)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { models, isModelsLoading, isModelsError } = useListModels([], '', [], debouncedFilter)

  const searchMenuOpen = anchorEl !== null

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setModelFilter(event.target.value)
    if (event.target.value.length >= 3) {
      setAnchorEl(event.currentTarget)
    }
  }

  if (isModelsError) {
    return <MessageAlert message={isModelsError.info.message} severity='error' />
  }

  return (
    <Stack>
      <Search>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder='Search for a model'
          inputProps={{ 'aria-label': 'search' }}
          value={modelFilter}
          onChange={handleChange}
        />
      </Search>
      {searchMenuOpen && !isModelsLoading && (
        <Popover
          open={searchMenuOpen}
          onClose={() => setAnchorEl(null)}
          anchorEl={anchorEl as HTMLElement}
          disableAutoFocus={true}
          disableEnforceFocus={true}
          autoFocus={false}
          sx={{ maxHeight: '250px' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <>
            <Typography fontWeight='bold' sx={{ p: 2 }}>{`Models found: ${models.length}`}</Typography>
            <Divider />
            <List>
              {models.map((model) => (
                <Box key={model.id} sx={{ maxWidth: '300px' }}>
                  <Link href={`/beta/model/${model.id}`}>
                    <ListItemButton>
                      <ListItemText
                        primary={model.id}
                        secondary={model.description}
                        primaryTypographyProps={{
                          style: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
                        }}
                        secondaryTypographyProps={{
                          style: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
                        }}
                      />
                    </ListItemButton>
                  </Link>
                </Box>
              ))}
            </List>
          </>
        </Popover>
      )}
    </Stack>
  )
}
