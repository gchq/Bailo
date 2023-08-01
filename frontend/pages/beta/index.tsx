import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Link as MuiLink,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material/'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { Fragment, useEffect, useState } from 'react'

import { useListModels } from '../../actions/model'
import { ListModelType } from '../../data/model'
import ChipSelector from '../../src/common/ChipSelector'
import EmptyBlob from '../../src/common/EmptyBlob'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import Wrapper from '../../src/Wrapper.beta'
import { MarketPlaceModelGroup, MarketPlaceModelSelectType, ModelInterface } from '../../types/types'
import useDebounce from '../../utils/hooks/useDebounce'

export default function ExploreModels() {
  const [group, setGroup] = useState<ListModelType>('all')
  // TODO - fetch model tags from API
  const [filter, setFilter] = useState('')
  const [selectedLibrary, setSelectedLibrary] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const debouncedFilter = useDebounce(filter, 250)

  const { models, isModelsError, mutateModels } = useListModels(group, debouncedFilter)

  const theme = useTheme()
  const router = useRouter()

  useEffect(() => {
    switch (selectedType) {
      case MarketPlaceModelSelectType.MY_MODELS:
        setGroup(MarketPlaceModelGroup.MY_MODELS)
        break
      case MarketPlaceModelSelectType.FAVOURITES:
        setGroup(MarketPlaceModelGroup.FAVOURITES)
        break
      default:
        setGroup(MarketPlaceModelGroup.ALL)
        mutateModels()
    }
  }, [selectedType, mutateModels])

  const error = MultipleErrorWrapper(`Unable to load marketplace page`, {
    isModelsError,
  })
  if (error) return error

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value)
  }

  const handleNewModelClicked = () => {
    router.push('/beta/model/new/model')
  }

  const onFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Wrapper title='Explore Models' page='marketplace'>
      <Stack direction='row' spacing={2}>
        <Stack spacing={2}>
          <Button variant='contained' onClick={() => handleNewModelClicked()}>
            Add new model
          </Button>
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
            <ChipSelector
              label='Tasks'
              // TODO fetch all model tags
              tags={['Task 1', 'Task 2']}
              selectedTags={selectedTask}
              setSelectedTags={setSelectedTask}
              size='small'
            />
          </Box>
          <Box>
            <ChipSelector
              label='Libraries'
              // TODO fetch all model libraries
              tags={['Library 1', 'Library 2']}
              setSelectedTags={setSelectedLibrary}
              selectedTags={selectedLibrary}
              size='small'
            />
          </Box>
          <Box>
            <ChipSelector
              label='Other'
              tags={[MarketPlaceModelSelectType.MY_MODELS, MarketPlaceModelSelectType.FAVOURITES]}
              setSelectedTags={setSelectedType}
              selectedTags={selectedType}
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
                models.map((model: ModelInterface, index: number) => {
                  return (
                    <Fragment key={model.id}>
                      <Link style={{ textDecoration: 'none' }} href={`beta/model/${model.id}`} passHref>
                        <MuiLink
                          variant='h5'
                          sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.primary.main }}
                        >
                          {model.name}
                        </MuiLink>
                      </Link>
                      <Typography variant='body1' sx={{ marginBottom: 2 }}>
                        {model.description}
                      </Typography>
                      <Stack direction='row' spacing={1} sx={{ marginBottom: 2 }}>
                        {/* TODO Implement model tags */}
                        {/* {model.tags.map((tag: string) => (
                          <Chip color='secondary' key={`chip-${tag}`} label={tag} size='small' variant='outlined' />
                        ))} */}
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
