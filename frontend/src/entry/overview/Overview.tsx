import { Container } from '@mui/material'
import { useMemo } from 'react'
import FormEditPage from 'src/entry/overview/FormEditPage'
import TemplatePage from 'src/entry/overview/TemplatePage'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

const OverviewPage = {
  FORM: 'form',
  TEMPLATE: 'template',
} as const

type OverviewPageKeys = (typeof OverviewPage)[keyof typeof OverviewPage]

type OverviewProps = {
  entry: EntryInterface
  readOnly?: boolean
  currentUserRoles: string[]
}

export default function Overview({ entry, currentUserRoles, readOnly = false }: OverviewProps) {
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
    <Container sx={{ my: 2 }}>
      {page === OverviewPage.TEMPLATE && <TemplatePage entry={entry} />}
      {page === OverviewPage.FORM && <FormEditPage entry={entry} currentUserRoles={currentUserRoles} readOnly />}
    </Container>
  )
}
