import { Card, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useContext, useMemo, useState } from 'react'
import Title from 'src/common/Title'
import UiConfigContext from 'src/contexts/uiConfigContext'
import CreateEntry from 'src/entry/CreateEntry'
import EntryCard from 'src/entry/EntryCard'
import { EntryKind, EntryKindKeys } from 'types/types'
import { camelCaseToTitleCase } from 'utils/stringUtils'

export default function NewEntry() {
  const [createEntryKind, setCreateEntryKind] = useState<EntryKindKeys | undefined>()

  const uiConfig = useContext(UiConfigContext)

  const modelProps = useMemo(
    () =>
      [
        {
          title: 'Model',
          description:
            'Creating a model allows you to create artefacts and images, write a model card and control who has access over your model. Use it when you have used training data to create a model, or are using a model from another source.',
          handleClick: () => setCreateEntryKind(EntryKind.MODEL),
          dataTest: 'createModelButton',
          mostPopular: true,
        },
        {
          title: 'Mirrored Model',
          description:
            'Mirrored models allow models to be copied from other deployments using an external model ID. These are imported as read only models and should be updated via the source.',
          handleClick: () => setCreateEntryKind(EntryKind.MIRRORED_MODEL),
          disabled: uiConfig.modelMirror.import.enabled === false,
        },
        {
          title: 'Untrusted Model',
          description: uiConfig.untrustedModel.untrustedModelDescription,
          handleClick: () => setCreateEntryKind(EntryKind.UNTRUSTED_MODEL),
          disabled: uiConfig.untrustedModel.enabled === false,
        },
      ].filter((entryCardProp) => !entryCardProp.disabled),
    [
      uiConfig.modelMirror.import.enabled,
      uiConfig.untrustedModel.enabled,
      uiConfig.untrustedModel.untrustedModelDescription,
    ],
  )

  const otherEntryProps = [
    {
      title: 'Data Card',
      description:
        'Data cards allow you to track and reference the training data used to generate your models. Adding data cards to Bailo allows you to link it to any model, keep track of its storage location and other accreditation requirements.',
      handleClick: () => setCreateEntryKind(EntryKind.DATA_CARD),
      dataTest: 'createMirroredModel',
    },
  ]

  return (
    <>
      <Title text={`New ${createEntryKind ? camelCaseToTitleCase(createEntryKind) : 'Entry'}`} />
      <Container maxWidth='md'>
        {createEntryKind ? (
          <CreateEntry createEntryKind={createEntryKind} onBackClick={() => setCreateEntryKind(undefined)} />
        ) : (
          <Paper sx={{ p: 4, mb: 4 }}>
            <Stack spacing={4}>
              <Card sx={{ p: 2 }}>
                <Typography variant='h6' color='primary' sx={{ fontWeight: 'bold', mb: 2 }}>
                  Models
                </Typography>
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {modelProps.map((entryCardProp) => (
                    <EntryCard key={entryCardProp.title} {...entryCardProp} />
                  ))}
                </Stack>
              </Card>
              <Card sx={{ p: 2 }}>
                <Typography variant='h6' color='primary' sx={{ fontWeight: 'bold', mb: 2 }}>
                  Other
                </Typography>
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {otherEntryProps.map((entryCardProp) => (
                    <EntryCard key={entryCardProp.title} {...entryCardProp} />
                  ))}
                </Stack>
              </Card>
            </Stack>
          </Paper>
        )}
      </Container>
    </>
  )
}
