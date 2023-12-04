import { useRouter } from 'next/router'
import PageWithTabs from 'src/common/PageWithTabs'
import SchemaTab from 'src/schemas/SchemaTab'
import Wrapper from 'src/Wrapper.beta'

export default function SchemasPage() {
  return (
    <Wrapper title='Schemas' page='schemas' fullWidth>
      <Schemas />
    </Wrapper>
  )
}

function Schemas() {
  const router = useRouter()
  return (
    <>
      <PageWithTabs
        title='Schemas'
        tabs={[
          { title: 'Schemas', path: 'overview', view: <SchemaTab /> },
          { title: 'Designer (beta)', path: 'releases', view: <></>, disabled: true },
        ]}
        displayActionButton
        actionButtonTitle='Upload a new schema'
        actionButtonOnClick={() => router.push('/beta/schemas/new')}
      />
    </>
  )
}
