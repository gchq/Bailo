import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import SchemaTab from 'src/schemas/SchemaTab'

export default function SchemasPage() {
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  if (isCurrentUserLoading) return <Loading />

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <Forbidden
        errorMessage='If you think this is in error please contact the Bailo administrators.'
        noMargin
        hideNavButton
      />
    )
  }

  const error = MultipleErrorWrapper(`Unable to load schema page`, {
    isCurrentUserError,
  })
  if (error) return error

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
