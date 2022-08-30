import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useTheme from '@mui/styles/useTheme'
import Link from 'next/link'
import { useState } from 'react'
import { ListModelType, useListModels } from '../data/model'
import EmptyBlob from '../src/common/EmptyBlob'
import MultipleErrorWrapper from '../src/errors/MultipleErrorWrapper'
import { lightTheme } from '../src/theme'
import Wrapper from '../src/Wrapper'
import { Model } from '../types/interfaces'
import useDebounce from '../utils/useDebounce'

export default function ExploreModels() {
  const [group, setGroup] = useState<ListModelType>('all')
  const [filter, setFilter] = useState('')
  const debouncedFilter = useDebounce(filter, 250)

  const { models, isModelsError, mutateModels } = useListModels(group, debouncedFilter)

  const theme: any = useTheme() || lightTheme

  const error = MultipleErrorWrapper(`Unable to load marketplace page`, {
    isModelsError,
  })
  if (error) return error

  const handleGroupChange = (_event: React.SyntheticEvent, newValue: ListModelType) => {
    setGroup(newValue)
    mutateModels()
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value)
  }

  const onFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Wrapper title='Explore Models' page='marketplace'>
      <Paper
        component='form'
        onSubmit={onFilterSubmit}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '70%',
          maxWidth: '400px',
          margin: 'auto',
          marginRight: 0,
          marginBottom: 3,
        }}
      >
        <InputBase sx={{ ml: 1, flex: 1 }} placeholder='Filter Models' value={filter} onChange={handleFilterChange} />
        <IconButton color='primary' type='submit' sx={{ p: '10px' }} aria-label='filter'>
          <SearchIcon />
        </IconButton>
      </Paper>
      <Box>
        <Paper sx={{ py: 2, px: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={group}
              onChange={handleGroupChange}
              aria-label='basic tabs example'
              textColor={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
              indicatorColor='secondary'
            >
              <Tab label='All Models' value='all' />
              <Tab label='My Models' value='user' />
              <Tab label='Favourites' value='favourites' />
            </Tabs>
          </Box>
          <Box sx={{ marginBottom: 2 }} />

          {models &&
            models.map((model: Model, index: number) => (
              <Box key={model.uuid}>
                <Link href={`/model/${model.uuid}`} passHref>
                  <MuiLink
                    variant='h5'
                    sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                  >
                    {model.currentMetadata.highLevelDetails.name}
                  </MuiLink>
                </Link>

                <Typography variant='body1' sx={{ marginBottom: 2 }}>
                  {model.currentMetadata.highLevelDetails.modelInASentence}
                </Typography>

                <Stack direction='row' spacing={1} sx={{ marginBottom: 2 }}>
                  {model.currentMetadata.highLevelDetails.tags.map((tag: string) => (
                    <Chip
                      color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
                      sx={{ backgroundColor: theme.palette.mode === 'light' ? 'primary' : 'secondary' }}
                      key={`chip-${tag}`}
                      label={tag}
                      size='small'
                      variant='outlined'
                    />
                  ))}
                </Stack>

                {index !== models.length - 1 && (
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }} />
                )}
              </Box>
            ))}

          {models?.length === 0 && <EmptyBlob text='No models here' />}
        </Paper>
      </Box>
    </Wrapper>
  )
}
