import FormEditPage from './overview/FormEditPage'
import TemplatePage from './overview/TemplatePage'

type OverviewPages = 'form' | 'template'
export default function Overview({ model }: { model: any }) {
  let page: OverviewPages = 'form'

  if (!model.card || !model.card.schemaId) {
    page = 'template'
  }

  return (
    <>
      {page === 'template' && <TemplatePage model={model} />}
      {page === 'form' && <FormEditPage model={model} />}
    </>
  )
}
