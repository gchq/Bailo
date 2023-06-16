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
import React, { Fragment, useState } from 'react'
import TagSelector from 'src/common/TagSelector'
import { MarketPlaceModelGroup, MarketPlaceModelSelectType } from 'src/types'

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
    // TODO - When tags are selected, filter the array of models based on the selection
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
            <div data-test='modelListBox'>
              {models === undefined && <EmptyBlob data-test='emptyModelListBlob' text='Error fetching models' />}
              {models &&
                models.map((model: Model, index: number) => {
                  const latestVersion = model.latestVersion as Version
                  return (
                    <Fragment key={model.uuid}>
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
                    </Fragment>
                  )
                })}

              {models?.length === 0 && <EmptyBlob data-test='emptyModelListBlob' text='No models here' />}
            </div>
          </Paper>
        </Grid>
        <Grid sm={4} xs={12}>
          <Stack>
            <Box sx={{ px: 2 }}>
              <TagSelector label='Tags' multiple tags={['test', 'lol']} onChange={updateSelectedTags} size='small' />
            </Box>
            <Box sx={{ p: 2 }}>
              <TagSelector
                label='Other'
                tags={[MarketPlaceModelSelectType.MY_MODELS, MarketPlaceModelSelectType.FAVOURITES]}
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
