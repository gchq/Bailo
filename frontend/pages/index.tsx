import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Chip,
  Container,
  FilledInput,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link as MuiLink,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material/'
import { useTheme } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ChangeEvent, Fragment, useCallback, useEffect, useState } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import useDebounce from 'src/hooks/useDebounce'
import MessageAlert from 'src/MessageAlert'
import Wrapper from 'src/Wrapper'

interface KeyAndLabel {
  key: string
  label: string
}

const searchFilterTypeLabels: KeyAndLabel[] = [{ key: 'mine', label: 'Mine' }]

export default function HomePage() {
  return (
    <Wrapper title='Explore Models' page='marketplace'>
      <Marketplace />
    </Wrapper>
  )
}

function Marketplace() {
  // TODO - fetch model tags from API
  const [filter, setFilter] = useState('')
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([])
  const [selectedTask, setSelectedTask] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const debouncedFilter = useDebounce(filter, 250)

  const { models, isModelsError, isModelsLoading } = useListModels(
    selectedTypes,
    selectedTask,
    selectedLibraries,
    debouncedFilter,
  )

  const theme = useTheme()
  const router = useRouter()

  const { filter: filterFromQuery, task: taskFromQuery, libraries: librariesFromQuery } = router.query

  useEffect(() => {
    if (filterFromQuery) setFilter(filterFromQuery as string)
    if (taskFromQuery) setSelectedTask(taskFromQuery as string)
    if (librariesFromQuery) {
      let librariesAsArray: string[] = []
      if (typeof librariesFromQuery === 'string') {
        librariesAsArray.push(librariesFromQuery)
      } else {
        librariesAsArray = [...librariesFromQuery]
      }
      setSelectedLibraries([...librariesAsArray])
    }
  }, [filterFromQuery, taskFromQuery, librariesFromQuery])

  const handleSelectedTypesOnChange = useCallback((selected: string[]) => {
    if (selected.length > 0) {
      const types: string[] = []
      selected.forEach((value) => {
        const typeToAdd = searchFilterTypeLabels.find((typeLabel) => typeLabel.label === value)
        if (typeToAdd && typeToAdd.label) {
          types.push(typeToAdd.key)
        }
      })
      setSelectedTypes(types)
    } else {
      setSelectedTypes([])
    }
  }, [])

  const updateQueryParams = useCallback(
    (key: string, value: string | string[]) => {
      router.replace({
        query: { ...router.query, [key]: value },
      })
    },
    [router],
  )

  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setFilter(e.target.value)
      updateQueryParams('filter', e.target.value)
    },
    [updateQueryParams],
  )

  const handleTaskOnChange = useCallback(
    (task: string) => {
      setSelectedTask(task)
      updateQueryParams('task', task)
    },
    [updateQueryParams],
  )

  const handleLibrariesOnChange = useCallback(
    (libraries: string[]) => {
      setSelectedLibraries(libraries as string[])
      updateQueryParams('libraries', libraries)
    },
    [updateQueryParams],
  )

  const onFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Container maxWidth='xl'>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Stack spacing={2} sx={{ maxWidth: '250px' }}>
          <Button component={Link} href='/model/new' variant='contained'>
            Add new model
          </Button>
          <FormControl
            sx={{
              display: 'flex',
              alignItems: 'center',
              maxWidth: '400px',
              marginBottom: 3,
            }}
            variant='filled'
            onSubmit={onFilterSubmit}
          >
            <InputLabel htmlFor='model-filter-input'>Filter models</InputLabel>
            <FilledInput
              sx={{ flex: 1, backgroundColor: theme.palette.background.paper }}
              id='model-filter-input'
              value={filter}
              disableUnderline
              onChange={handleFilterChange}
              endAdornment={
                <InputAdornment position='end'>
                  <IconButton color='secondary' type='submit' sx={{ p: '10px' }} aria-label='filter'>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
          <Box>
            <ChipSelector
              label='Tasks'
              // TODO fetch all model tags
              tags={[
                'Translation',
                'Image Classification',
                'Summarization',
                'Tokenisation',
                'Text to Speech',
                'Tabular Regression',
              ]}
              expandThreshold={10}
              selectedTags={selectedTask}
              onChange={handleTaskOnChange}
              size='small'
            />
          </Box>
          <Box>
            <ChipSelector
              label='Libraries'
              // TODO fetch all model libraries
              tags={['PyTorch', 'TensorFlow', 'JAX', 'Transformers', 'ONNX', 'Safetensors', 'spaCy']}
              expandThreshold={10}
              multiple
              selectedTags={selectedLibraries}
              onChange={handleLibrariesOnChange}
              size='small'
            />
          </Box>
          <Box>
            <ChipSelector
              label='Other'
              multiple
              tags={[...searchFilterTypeLabels.map((type) => type.label)]}
              onChange={handleSelectedTypesOnChange}
              selectedTags={searchFilterTypeLabels
                .filter((label) => selectedTypes.includes(label.key))
                .map((type) => type.label)}
              size='small'
            />
          </Box>
        </Stack>
        <Box sx={{ overflow: 'hidden', width: '100%' }}>
          <Paper sx={{ py: 2, px: 4 }}>
            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} data-test='indexPageTabs'>
              <Tabs value={'bailo'} indicatorColor='secondary'>
                <Tab label={`Models ${models ? `(${models.length})` : ''}`} value='bailo' />
              </Tabs>
            </Box>
            {isModelsLoading && <Loading />}
            {!isModelsLoading && (
              <div data-test='modelListBox'>
                {isModelsError && <MessageAlert message={isModelsError.info.message} severity='error' />}
                {models.length === 0 && <EmptyBlob data-test='emptyModelListBlob' text='No models here' />}
                {models.map((model, index) => {
                  return (
                    <Fragment key={model.id}>
                      <Link style={{ textDecoration: 'none' }} href={`model/${model.id}`} passHref>
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
                        {model.tags.slice(0, 10).map((tag) => (
                          <Chip color='secondary' key={`chip-${tag}`} label={tag} size='small' variant='outlined' />
                        ))}
                      </Stack>
                      {index !== models.length - 1 && (
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }} />
                      )}
                    </Fragment>
                  )
                })}
              </div>
            )}
          </Paper>
        </Box>
      </Stack>
    </Container>
  )
}
