import { useGetCurrentUserV3 } from 'actions/user'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import OverviewMetrics from 'src/metrics/OverviewMetrics'
import PolicyMetrics from 'src/metrics/PolicyMetrics'

export default function Metrics() {
  const result = useGetCurrentUserV3()

  if (result.isCurrentUserLoading) {
    return <Loading />
  }

  if (result.isCurrentUserError) {
    const error = MultipleErrorWrapper(`Unable to load schema page`, {
      isCurrentUserError: result.isCurrentUserError,
    })
    return error
  }

  if (!result.currentUser.systemRoles.includes('compliance')) {
    return (
      <Forbidden
        errorMessage={
          <span>
            If you think this is in error please {<Link href={'/help'}>contact</Link>} the Bailo administrators.
          </span>
        }
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

  return (
    <>
      <Title text='Metrics' />
      <PageWithTabs title='Metrics' tabs={tabs} />
    </>
  )
}
