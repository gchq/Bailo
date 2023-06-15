import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import React, { useState } from 'react'
import TagSelector from 'src/common/TagSelector'

import { ListModelType, useListModels } from '../../data/model'
import EmptyBlob from '../../src/common/EmptyBlob'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import Wrapper from '../../src/Wrapper'
import { Model, Version } from '../../types/types'
import useDebounce from '../../utils/hooks/useDebounce'

export default function ExploreModels() {
  const [group, setGroup] = useState<ListModelType>('all')
  const [filter, setFilter] = useState('')
  const debouncedFilter = useDebounce(filter, 250)

  const { models, isModelsError, mutateModels } = useListModels(group, debouncedFilter)

  const theme = useTheme()

  const error = MultipleErrorWrapper(`Unable to load marketplace page`, {
    isModelsError,
  })
  if (error) return error

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value)
  }

  const onFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const updateSelectedTags = (selectedTags: string[]) => {
    console.log(selectedTags)
  }

  const updateSelectedType = (selectedType: string) => {
    if (selectedType) {
      switch (selectedType) {
        case 'My models':
          setGroup('user')
          break
        case 'Favourites':
          setGroup('favourites')
          break
        default:
          setGroup('all')
      }
      mutateModels()
    }
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
          marginBottom: 3,
        }}
      >
        <InputBase sx={{ ml: 1, flex: 1 }} placeholder='Filter Models' value={filter} onChange={handleFilterChange} />
        <IconButton color='primary' type='submit' sx={{ p: '10px' }} aria-label='filter'>
          <SearchIcon />
        </IconButton>
      </Paper>
      <Grid container>
        <Grid item sm={8} xs={12}>
          <Paper sx={{ py: 2, px: 4 }}>
            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} data-test='indexPageTabs'>
              <Tabs value={'bailo'}>
                <Tab label={`Models ${models ? `(${models.length})` : ''}`} value='bailo' />
              </Tabs>
            </Box>
            <Box data-test='modelListBox'>
              {models &&
                models.map((model: Model, index: number) => {
                  const latestVersion = model.latestVersion as Version
                  return (
                    <Box key={model.uuid}>
                      <Link href={`/model/${model.uuid}`} passHref legacyBehavior>
                        <MuiLink
                          variant='h5'
                          sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                        >
                          {latestVersion.metadata.highLevelDetails.name}
                        </MuiLink>
                      </Link>
                      <Typography variant='body1' sx={{ marginBottom: 2 }}>
                        {latestVersion.metadata.highLevelDetails.modelInASentence}
                      </Typography>
                      <Stack direction='row' spacing={1} sx={{ marginBottom: 2 }}>
                        {latestVersion.metadata.highLevelDetails.tags.map((tag: string) => (
                          <Chip color='primary' key={`chip-${tag}`} label={tag} size='small' variant='outlined' />
                        ))}
                      </Stack>
                      {index !== models.length - 1 && (
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }} />
                      )}
                    </Box>
                  )
                })}

              {models?.length === 0 && <EmptyBlob data-test='emptyModelListBlob' text='No models here' />}
            </Box>
          </Paper>
        </Grid>
        <Grid sm={4} xs={12}>
          <Stack>
            <Box sx={{ px: 2 }}>
              <TagSelector
                label='Tags'
                multiple
                tags={[
                  'tesft123',
                  '1232g32323',
                  'ab111hc',
                  'test12k3',
                  '123232323',
                  'asb111c',
                  'tefgst123',
                  '1232as32323',
                  'ab11asfas1c',
                  'test1asf23',
                  '123232asf323',
                  'ab11asfasfasf1c',
                ]}
                onChange={updateSelectedTags}
                size='small'
              />
            </Box>
            <Box sx={{ p: 2 }}>
              <TagSelector
                label='Other'
                tags={['My models', 'Favourites']}
                onChange={updateSelectedType}
                size='small'
              />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Wrapper>
  )
}
