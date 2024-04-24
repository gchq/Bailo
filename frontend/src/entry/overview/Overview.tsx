import { Container } from '@mui/material'
import { useMemo } from 'react'
import FormEditPage from 'src/entry/overview/FormEditPage'
import TemplatePage from 'src/entry/overview/TemplatePage'
import { EntryInterface } from 'types/types'

const OverviewPage = {
  FORM: 'form',
  TEMPLATE: 'template',
} as const

type OverviewPageKeys = (typeof OverviewPage)[keyof typeof OverviewPage]

type OverviewProps = {
  entry: EntryInterface
}

export default function Overview({ entry }: OverviewProps) {
  const page: OverviewPageKeys = useMemo(
    () => (entry.card && entry.card.schemaId ? OverviewPage.FORM : OverviewPage.TEMPLATE),
    [entry.card],
  )

  return (
    <Container sx={{ my: 2 }}>
      {page === OverviewPage.TEMPLATE && <TemplatePage entry={entry} />}
      {page === OverviewPage.FORM && <FormEditPage entry={entry} />}
    </Container>
  )
}
