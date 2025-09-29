import { Container } from '@mui/material'
import { useMemo } from 'react'
import FormEditPage from 'src/entry/overview/FormEditPage'
import TemplatePage from 'src/entry/overview/TemplatePage'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKind } from 'types/types'

const OverviewPage = {
  FORM: 'form',
  TEMPLATE: 'template',
} as const

type OverviewPageKeys = (typeof OverviewPage)[keyof typeof OverviewPage]

type OverviewProps = {
  entry: EntryInterface
  readOnly?: boolean
}

export default function Overview({ entry, readOnly = false }: OverviewProps) {
  const page: OverviewPageKeys = useMemo(
    () => (entry.card && entry.card.schemaId ? OverviewPage.FORM : OverviewPage.TEMPLATE),
    [entry.card],
  )

  return entry.kind === EntryKind.MIRRORED_MODEL && !entry.card ? (
    <>
      {entry.kind === EntryKind.MIRRORED_MODEL && (
        <MessageAlert message={`Mirrored from ${entry.settings.mirror?.sourceModelId} (read-only)`} severity='info' />
      )}
      <MessageAlert
        severity='warning'
        message='This mirrored model has no model card. Please export the model card from the source model.'
      />
    </>
  ) : (
    <Container sx={{ my: 2 }}>
      {page === OverviewPage.TEMPLATE && <TemplatePage entry={entry} />}
      {page === OverviewPage.FORM && <FormEditPage entry={entry} readOnly={readOnly} />}
    </Container>
  )
}
