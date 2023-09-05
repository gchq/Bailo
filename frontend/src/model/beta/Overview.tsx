import { useEffect, useState } from 'react'

import FormEditPage from './overview/FormEditPage'
import TemplatePage from './overview/TemplatePage'

export default function Overview({ model }: { model: any }) {
  const [showTemplatePage, setShowTemplatePage] = useState(false)
  const [showFormPage, setShowFormPage] = useState(false)

  useEffect(() => {
    if (!model.card || !model.card.schemaId) {
      displayTemplatePage()
    } else {
      displayFormPage()
    }
  }, [model])

  function displayTemplatePage() {
    setShowTemplatePage(true)
    setShowFormPage(false)
  }

  function displayFormPage() {
    setShowTemplatePage(false)
    setShowFormPage(true)
  }

  return (
    <>
      {showTemplatePage && <TemplatePage model={model} />}
      {showFormPage && <FormEditPage model={model} />}
    </>
  )
}
