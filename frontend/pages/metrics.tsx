import { useGetCurrentUser } from 'actions/user'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import OverviewMetrics from 'src/metrics/OverviewMetrics'
import PolicyMetrics from 'src/metrics/PolicyMetrics'

export default function Metrics() {
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <Forbidden
        errorMessage='If you think this is in error please contact the Bailo administrators.'
        noMargin
        hideNavButton
      />
    )
  }

  const tabs = [
    { title: 'Overview', path: 'overview', view: <OverviewMetrics /> },
    {
      title: 'Policy',
      path: 'policy',
      view: <PolicyMetrics />,
    },
  ]

  const error = MultipleErrorWrapper(`Unable to load schema page`, {
    isCurrentUserError,
  })
  if (error) {
    return error
  }

  if (isCurrentUserLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text='Metrics' />
      <PageWithTabs title='Metrics' tabs={tabs} />
    </>
  )
}
