import { Box, Container, Stack } from '@mui/material'
import { useMemo } from 'react'
import OrganisationAndStateDetails from 'src/entry/model/OrganisationStateCollaboratorsDetails'
import FormEditPage from 'src/entry/overview/FormEditPage'
import TemplatePage from 'src/entry/overview/TemplatePage'
import MessageAlert from 'src/MessageAlert'
import { KeyedMutator } from 'swr'
import { EntryInterface } from 'types/types'

const OverviewPage = {
  FORM: 'form',
  TEMPLATE: 'template',
} as const

type OverviewPageKeys = (typeof OverviewPage)[keyof typeof OverviewPage]

type OverviewProps = {
  entry: EntryInterface
  readOnly?: boolean
  mutateEntry: KeyedMutator<{ model: EntryInterface }>
}

export default function Overview({ entry, readOnly = false, mutateEntry }: OverviewProps) {
  const page: OverviewPageKeys = useMemo(
    () => (entry.card && entry.card.schemaId ? OverviewPage.FORM : OverviewPage.TEMPLATE),
    [entry.card],
  )

  return readOnly && !entry.card ? (
    <MessageAlert
      severity='warning'
      message='This mirrored model has no model card. Please export the model card from the source model.'
    />
  ) : (
    <Box sx={{ my: 2 }}>
      <Stack spacing={4} direction={{ sm: 'column', md: 'row' }} sx={{ width: '100%' }}>
        <Box sx={{ p: 2 }}>
          <OrganisationAndStateDetails entry={entry} />
        </Box>
        <Box width='100%'>
          <Container sx={{ py: 2, m: 'auto' }} maxWidth='xl'>
            {page === OverviewPage.TEMPLATE && <TemplatePage entry={entry} />}
            {page === OverviewPage.FORM && <FormEditPage entry={entry} readOnly={readOnly} mutateEntry={mutateEntry} />}
          </Container>
        </Box>
      </Stack>
    </Box>
  )
}
