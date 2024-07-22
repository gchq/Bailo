import { ArrowBack, FileCopy } from '@mui/icons-material'
import { Autocomplete, Button, Card, Container, Stack, TextField, Typography } from '@mui/material'
import { EntrySearchResult, useGetModel, useListModels } from 'actions/model'
import { postFromTemplate } from 'actions/modelCard'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import { SyntheticEvent, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, EntryKindLabel } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

export default function ModelTemplateSelect() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query

  const [selectedModel, setSelectedModel] = useState<EntrySearchResult | null>(null)
  const [submissionErrorText, setSubmissionErrorText] = useState('')

  const {
    model: entry,
    isModelLoading: isEntryLoading,
    isModelError: isEntryError,
    mutateModel: mutateEntry,
  } = useGetModel(modelId, EntryKind.MODEL)
  const {
    models: entries,
    isModelsLoading: isEntriesLoading,
    isModelsError: isEntriesError,
  } = useListModels(EntryKind.MODEL, [], '', [], '', true)

  const handleChange = (_event: SyntheticEvent, newValue: EntrySearchResult | null) => {
    setSelectedModel(newValue ?? null)
  }

  const handleSubmit = async () => {
    setSubmissionErrorText('')
    if (!entry) {
      setSubmissionErrorText('Could not find model to create using template.')
      return
    }
    if (!selectedModel) {
      setSubmissionErrorText('You must select a template.')
      return
    }
    const res = await postFromTemplate(entry.id, selectedModel.id)

    if (!res.ok) {
      setSubmissionErrorText(await getErrorMessage(res))
    }

    await mutateEntry()
    router.push(`/${entry.kind}/${entry.id}`)
  }

  if (isEntryError) {
    return <ErrorWrapper message={isEntryError.info.message} />
  }

  if (isEntriesError) {
    return <ErrorWrapper message={isEntriesError.info.message} />
  }

  return (
    <>
      <Title text='Select a model template' />
      {(isEntriesLoading || isEntryLoading) && <Loading />}
      <Container maxWidth='md'>
        <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
          {entry && (
            <>
              <Link href={`/${entry.kind}/${entry.id}`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  {`Back to ${EntryKindLabel[entry.kind]}`}
                </Button>
              </Link>
              <Stack spacing={2} justifyContent='center' alignItems='center'>
                <Typography variant='h5' component='h1' color='primary'>
                  Choose a model to use as a template
                </Typography>
                <FileCopy fontSize='large' color='primary' />
                <Typography variant='body1'>Some models are made available to be used as templates.</Typography>
                <Autocomplete
                  options={entries}
                  sx={{ width: '100%' }}
                  getOptionLabel={(option: EntrySearchResult) => option.name}
                  value={selectedModel}
                  onChange={handleChange}
                  renderInput={(params) => (
                    <TextField {...params} size='small' placeholder='Search for an entry to use a template' />
                  )}
                />
                <div>
                  <Button variant='contained' disabled={!selectedModel} onClick={handleSubmit}>
                    Create from template
                  </Button>
                </div>
                <MessageAlert message={submissionErrorText} severity='error' />
              </Stack>
            </>
          )}
        </Card>
      </Container>
    </>
  )
}
