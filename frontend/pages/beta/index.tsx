import SearchIcon from '@mui/icons-material/Search'
import { Box, Chip, IconButton, InputBase, Link as MuiLink, Paper, Stack, Tab, Tabs, Typography } from '@mui/material/'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import React, { Fragment, useState } from 'react'

import { ListModelType, useListModels } from '../../data/model'
import ChipSelector from '../../src/common/ChipSelector'
import EmptyBlob from '../../src/common/EmptyBlob'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import { MarketPlaceModelGroup, MarketPlaceModelSelectType } from '../../src/types'
import Wrapper from '../../src/Wrapper'
import { Model, Version } from '../../types/types'
import useDebounce from '../../utils/hooks/useDebounce'

export default function ExploreModels() {
  const [group, setGroup] = useState<ListModelType>('all')
  // TODO - fetch model tags from API
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

  const updateSelectedTasks = (selectedTags: string) => {
    // TODO - When tasks are selected, filter the array of models based on the selection
    console.log(selectedTags)
  }

  const updateSelectedLibraries = (selectedTags: string) => {
    // TODO - When libraries are selected, filter the array of models based on the selection
    console.log(selectedTags)
  }

  const updateSelectedType = (selectedType: string) => {
    if (selectedType) {
      switch (selectedType) {
        case MarketPlaceModelSelectType.MY_MODELS:
          setGroup(MarketPlaceModelGroup.MY_MODELS)
          break
        case MarketPlaceModelSelectType.FAVOURITES:
          setGroup(MarketPlaceModelGroup.FAVOURITES)
          break
        default:
          setGroup(MarketPlaceModelGroup.ALL)
      }
      mutateModels()
    }
  }

  return (
    <Wrapper title='Explore Models' page='marketplace'>
      <Stack direction='row' spacing={2}>
        <Stack>
          <Paper
            component='form'
            onSubmit={onFilterSubmit}
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              maxWidth: '400px',
              marginBottom: 3,
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder='Filter Models'
              value={filter}
              onChange={handleFilterChange}
            />
            <IconButton color='primary' type='submit' sx={{ p: '10px' }} aria-label='filter'>
              <SearchIcon />
            </IconButton>
          </Paper>
          <Box>
            <ChipSelector label='Tasks' tags={['Task 1', 'Task 2']} onChange={updateSelectedTasks} size='small' />
          </Box>
          <Box>
            <ChipSelector
              label='Libraries'
              tags={['Library 1', 'Library 2']}
              onChange={updateSelectedLibraries}
              size='small'
            />
          </Box>
          <Box>
            <ChipSelector
              label='Other'
              tags={[MarketPlaceModelSelectType.MY_MODELS, MarketPlaceModelSelectType.FAVOURITES]}
              onChange={updateSelectedType}
              size='small'
            />
          </Box>
        </Stack>
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ py: 2, px: 4 }}>
            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} data-test='indexPageTabs'>
              <Tabs value={'bailo'}>
                <Tab label={`Models ${models ? `(${models.length})` : ''}`} value='bailo' />
              </Tabs>
            </Box>
            <div data-test='modelListBox'>
              {(!models || models.length === 0) && <EmptyBlob data-test='emptyModelListBlob' text='No models here' />}
              {models &&
                models.map((model: Model, index: number) => {
                  const latestVersion = model.latestVersion as Version
                  return (
                    <Fragment key={model.uuid}>
                      <Link style={{ textDecoration: 'none' }} href={`/model/${model.uuid}`} passHref>
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
                    </Fragment>
                  )
                })}
            </div>
          </Paper>
        </Box>
      </Stack>
    </Wrapper>
  )
}
