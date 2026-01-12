import { ArrowBack, FileCopy } from '@mui/icons-material'
import { Autocomplete, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { EntrySearchResult, useGetEntry, useListEntries } from 'actions/entry'
import { postFromTemplate } from 'actions/modelCard'
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
  const [isButtonLoading, setIsButtonLoading] = useState(false)

  const {
    entry: model,
    isEntryLoading: isModelLoading,
    isEntryError: isModelError,
    mutateEntry: mutateModel,
  } = useGetEntry(modelId, EntryKind.MODEL)
  const {
    entries: models,
    isEntriesLoading: isModelsLoading,
    isEntriesError: isModelsError,
  } = useListEntries(EntryKind.MODEL, [], '', [], [], [], [], '', true)

  const handleChange = (_event: SyntheticEvent, newValue: EntrySearchResult | null) => {
    setSelectedModel(newValue)
  }

  const handleSubmit = async () => {
    setSubmissionErrorText('')
    if (!model) {
      setSubmissionErrorText('Could not find model to create using template.')
      return
    }
    if (!selectedModel) {
      setSubmissionErrorText('You must select a template.')
      return
    }
    setIsButtonLoading(true)
    const res = await postFromTemplate(model.id, selectedModel.id)
    if (!res.ok) {
      setSubmissionErrorText(await getErrorMessage(res))
      setIsButtonLoading(false)
      return
    }

    await mutateModel()
    router.push(`/${model.kind}/${model.id}`)
  }

  if (isModelError) {
    return <ErrorWrapper message={isModelError.info.message} />
  }

  if (isModelsError) {
    return <ErrorWrapper message={isModelsError.info.message} />
  }

  return (
    <>
      <Title text='Select a model template' />
      {(isModelsLoading || isModelLoading) && <Loading />}
      <Container maxWidth='md'>
        <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
          {model && (
            <>
              <Link href={`/${model.kind}/${model.id}`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  {`Back to ${EntryKindLabel[model.kind]}`}
                </Button>
              </Link>
              <Stack spacing={2} justifyContent='center' alignItems='center'>
                <Typography variant='h5' component='h1' color='primary'>
                  Select a model to use as a template
                </Typography>
                <FileCopy fontSize='large' color='primary' />
                <Typography>
                  Only models that have been configured to allow templating can be used as a template.
                </Typography>
                <Autocomplete
                  options={models}
                  fullWidth
                  getOptionLabel={(option: EntrySearchResult) => option.name}
                  value={selectedModel}
                  onChange={handleChange}
                  renderInput={(params) => (
                    <TextField {...params} size='small' placeholder='Search for a model to use a template' />
                  )}
                />
                <Button variant='contained' disabled={!selectedModel} onClick={handleSubmit} loading={isButtonLoading}>
                  Create from template
                </Button>
                <MessageAlert message={submissionErrorText} severity='error' />
              </Stack>
            </>
          )}
        </Paper>
      </Container>
    </>
  )
}
