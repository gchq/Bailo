import { FileUpload } from '@mui/icons-material'
import { Box, Card, Container, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import CreateEntry from 'src/entry/CreateEntry'
import EntryCard from 'src/entry/EntryCard'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, EntryKindKeys } from 'types/types'

export default function NewEntry() {
  const [entryKind, setEntryKind] = useState<EntryKindKeys | undefined>()

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const entryCardProps = useMemo(
    () =>
      [
        {
          title: 'Create Model',
          description:
            'Creating a model allows you to create artefacts and images, write a model card and control who has access over your model. Use it when you have used training data to create a model, or are using a model from another source.',
          handleClick: () => setEntryKind(EntryKind.MODEL),
          dataTest: 'createModelButton',
        },
        {
          title: 'Create Mirrored Model',
          description:
            'Mirrored models allow models to be copied from other deployments using an external model ID. These are imported as read only models and should be updated via the source.',
          handleClick: () => setEntryKind(EntryKind.MIRRORED_MODEL),
          dataTest: 'createDataCardButton',
          disabled: !uiConfig?.modelMirror.enabled,
        },
        {
          title: 'Create Data Card',
          description:
            'Data cards allow you to track and reference the training data used to generate your models. Adding data cards to Bailo allows you to link it to any model, keep track of its storage location and other accreditation requirements.',
          handleClick: () => setEntryKind(EntryKind.DATA_CARD),
          dataTest: 'createMirroredModel',
        },
      ].filter((entryCardProp) => !entryCardProp.disabled),
    [uiConfig?.modelMirror.enabled],
  )

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (!uiConfig || isUiConfigLoading) {
    return <Loading />
  }

  return (
    <>
      <Container>
        {entryKind ? (
          <CreateEntry
            kind={entryKind === EntryKind.MIRRORED_MODEL ? EntryKind.MODEL : entryKind}
            entryKind={entryKind}
            onBackClick={() => setEntryKind(undefined)}
          />
        ) : (
          <Card sx={{ p: 4, mb: 4 }}>
            <Stack spacing={4} justifyContent='center' alignItems='center'>
              <Typography variant='h6' component='h1' color='primary'>
                Create Entry
              </Typography>
              <FileUpload color='primary' fontSize='large' />
              <Box alignItems='stretch' justifyContent='center' display='flex' flexWrap='wrap'>
                {entryCardProps.map((entryCardProp) => (
                  <EntryCard key={entryCardProp.title} {...entryCardProp} />
                ))}
              </Box>
            </Stack>
          </Card>
        )}
      </Container>
    </>
  )
}
