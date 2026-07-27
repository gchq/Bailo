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
            'A model enables the upload of artefacts and images, the creation and maintenance of a model card, and the management of access permissions. Models are used when training data has been used to create a model or when a model originates from a non-Bailo source.',
          handleClick: () => setCreateEntryKind(EntryKind.MODEL),
          dataTest: 'createModelButton',
          mostPopular: true,
        },
        {
          title: 'Mirrored Model',
          description:
            'Mirrored models are read-only copies of models imported from other Bailo deployments using an external source model ID. The original model card is retained from the source deployment, with additional local details able to be recorded alongside it.',
          handleClick: () => setCreateEntryKind(EntryKind.MIRRORED_MODEL),
          disabled: uiConfig.modelMirror.import.enabled === false,
        },
        {
          title: 'Untrusted Model',
          description: uiConfig.untrustedModel.untrustedModelLongDescription,
          handleClick: () => setCreateEntryKind(EntryKind.UNTRUSTED_MODEL),
          disabled: uiConfig.untrustedModel.enabled === false,
        },
      ].filter((entryCardProp) => !entryCardProp.disabled),
    [
      uiConfig.modelMirror.import.enabled,
      uiConfig.untrustedModel.enabled,
      uiConfig.untrustedModel.untrustedModelLongDescription,
    ],
  )

  const otherEntryProps = [
    {
      title: 'Data Card',
      description:
        'Data cards track and reference the training data used to generate models. They can be linked to models and used to record storage locations and accreditation-related information.',
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
