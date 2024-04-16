import { useRouter } from 'next/router'
import { useMemo } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import SchemaTab from 'src/schemas/SchemaTab'

export default function SchemasPage() {
  return (
    <>
      <Title title='Schemas' />
      <Schemas />
    </>
  )
}

function Schemas() {
  const router = useRouter()

  const tabs = useMemo(
    () => [
      { title: 'Schemas', path: 'overview', view: <SchemaTab /> },
      { title: 'Designer (beta)', path: 'releases', view: <></>, disabled: true },
    ],
    [],
  )

  return (
    <>
      <PageWithTabs
        title='Schemas'
        tabs={tabs}
        displayActionButton
        actionButtonTitle='Upload a new schema'
        actionButtonOnClick={() => router.push('/schemas/new')}
      />
    </>
  )
}
