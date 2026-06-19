import { FileUpload } from '@mui/icons-material'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import SchemaCompare from 'src/schemas/SchemaCompare'
import SchemaMigrationList from 'src/schemas/SchemaMigrationList'
import SchemaTab from 'src/schemas/SchemaTab'

export default function SchemasPage() {
  return (
    <>
      <Title text='Schemas' />
      <Schemas />
    </>
  )
}

function Schemas() {
  const router = useRouter()

  const tabs = useMemo(
    () => [
      { title: 'Schemas', path: 'overview', view: <SchemaTab /> },
      { title: 'Compare', path: 'compare', view: <SchemaCompare /> },
      { title: 'Migrations', path: 'migrations', view: <SchemaMigrationList /> },
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
        actionButtonIcon={<FileUpload />}
      />
    </>
  )
}
