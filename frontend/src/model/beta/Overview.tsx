import { Container } from '@mui/material'
import { useMemo } from 'react'
import { ModelInterface } from 'types/v2/types'

import FormEditPage from './overview/FormEditPage'
import TemplatePage from './overview/TemplatePage'

type OverviewPage = 'form' | 'template'

type OverviewProps = {
  model: ModelInterface
}

export default function Overview({ model }: OverviewProps) {
  const page: OverviewPage = useMemo(() => (model.card && model.card.schemaId ? 'form' : 'template'), [model.card])

  return (
    <Container sx={{ my: 2 }}>
      {page === 'template' && <TemplatePage model={model} />}
      {page === 'form' && <FormEditPage model={model} />}
    </Container>
  )
}
