import { FileUpload } from '@mui/icons-material'
import { Button, Card, Container, Divider, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import CreateEntry from 'src/entry/CreateEntry'
import MessageAlert from 'src/MessageAlert'
import { DisplayKind, DisplayKindKeys } from 'types/types'

interface EntryCardProps {
  title: string
  description: string
  handleClick: () => void
  dataTest?: string
  disabled?: boolean
}

function EntryCard({ title, description, dataTest, handleClick }: EntryCardProps) {
  return (
    <Card
      sx={{
        width: '300px',
        p: 2,
      }}
    >
      <Stack spacing={2}>
        <Typography component='h2' variant='h6' color='primary'>
          {title}
        </Typography>
        <Typography>{description}</Typography>
        <Button variant='contained' onClick={handleClick} sx={{ width: '100%' }} data-test={dataTest}>
          Create
        </Button>
      </Stack>
    </Card>
  )
}

export default function NewEntry() {
  const [entryKind, setEntryKind] = useState<DisplayKindKeys | undefined>()

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  if (!uiConfig || isUiConfigLoading) {
    return <Loading />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  const entryCardProps = [
    {
      title: 'Create Model',
      description:
        'Creating a model allows you to create artefacts and images, write a model card and control who has access over your model. Use it when you have used training data to create a model, or are using a model from another source.',
      handleClick: () => setEntryKind(DisplayKind.MODEL),
      dataTest: 'createModelButton',
    },
    {
      title: 'Create Mirrored Model',
      description:
        'Mirrored models allow models to be copied from other deployments using an external model ID. These are imported as read only models and should be updated via the source.',
      handleClick: () => setEntryKind(DisplayKind.MIRRORED_MODEL),
      dataTest: 'createDataCardButton',
      disabled: !uiConfig.modelMirror.enabled,
    },
    {
      title: 'Create Data Card',
      description:
        'Data cards allow you to track and reference the training data used to generate your models. Adding data cards to Bailo allows you to link it to any model, keep track of its storage location and other accreditation requirements.',
      handleClick: () => setEntryKind(DisplayKind.DATA_CARD),
      dataTest: 'createMirroredModel',
    },
  ].filter((entryCardProp) => !entryCardProp.disabled)

  return (
    <>
      <Container>
        {entryKind ? (
          <CreateEntry
            kind={entryKind === DisplayKind.MIRRORED_MODEL ? DisplayKind.MODEL : entryKind}
            displayKind={entryKind}
            onBackClick={() => setEntryKind(undefined)}
          />
        ) : (
          <Card sx={{ p: 4, mb: 4 }}>
            <Stack spacing={4} justifyContent='center' alignItems='center'>
              <Typography variant='h6' component='h1' color='primary'>
                Create Entry
              </Typography>
              <FileUpload color='primary' fontSize='large' />
              <Stack
                direction={{ sm: 'column', md: 'row' }}
                spacing={4}
                justifyContent='center'
                alignItems='center'
                divider={<Divider orientation='vertical' flexItem />}
              >
                {entryCardProps.map((entryCardProp) => (
                  <EntryCard key={entryCardProp.title} {...entryCardProp} />
                ))}
                <Typography>{entryKind}</Typography>
              </Stack>
            </Stack>
          </Card>
        )}
      </Container>
    </>
  )
}
