import { Box, Container, Stack } from '@mui/material'
import { useMemo } from 'react'
import OrganisationAndStateDetails from 'src/entry/model/OrganisationStateCollaboratorsDetails'
import FormEditPage from 'src/entry/overview/FormEditPage'
import TemplatePage from 'src/entry/overview/TemplatePage'
import MessageAlert from 'src/MessageAlert'
import { KeyedMutator } from 'swr'
import { EntryInterface, EntryKind } from 'types/types'

const OverviewPage = {
  FORM: 'form',
  TEMPLATE: 'template',
} as const

type OverviewPageKeys = (typeof OverviewPage)[keyof typeof OverviewPage]

type OverviewProps = {
  entry: EntryInterface
  mutateEntry: KeyedMutator<{ model: EntryInterface }>
}

export default function Overview({ entry, mutateEntry }: OverviewProps) {
  const page: OverviewPageKeys = useMemo(
    () =>
      (entry.card || entry.mirroredCard) && (entry.card.schemaId || entry.mirroredCard?.schemaId)
        ? OverviewPage.FORM
        : OverviewPage.TEMPLATE,
    [entry.card, entry.mirroredCard],
  )

  return entry.kind === EntryKind.MIRRORED_MODEL && !entry.mirroredCard?.metadata ? (
    <>
      <MessageAlert
        severity='warning'
        message='This mirrored model has no model card. Please export the model card from the source model.'
      />
    </>
  ) : (
    <Container maxWidth='xl'>
      <Stack spacing={4} direction={{ sm: 'column', md: 'row' }} sx={{ width: '100%' }}>
        <Box sx={{ pt: 2 }}>
          <OrganisationAndStateDetails entry={entry} />
        </Box>
        <Box width='100%'>
          <Container sx={{ py: 2, m: 'auto' }} maxWidth='xl'>
            {entry.kind === EntryKind.MIRRORED_MODEL && (
              <MessageAlert
                message={`Mirrored from ${entry.settings.mirror?.sourceModelId}. Some parts of this form will be read-only.`}
                severity='info'
              />
            )}
            {page === OverviewPage.TEMPLATE && <TemplatePage entry={entry} />}
            {page === OverviewPage.FORM && <FormEditPage entry={entry} mutateEntry={mutateEntry} />}
          </Container>
        </Box>
      </Stack>
    </Container>
  )
}
