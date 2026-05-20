import { useContext } from 'react'
import Forbidden from 'src/common/Forbidden'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import CurrentUserContext from 'src/contexts/currentUserContext'
import Link from 'src/Link'
import OverviewMetrics from 'src/metrics/OverviewMetrics'
import PolicyMetrics from 'src/metrics/PolicyMetrics'

export default function Metrics() {
  const currentUser = useContext(CurrentUserContext)

  if (!currentUser.systemRoles.includes('compliance')) {
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
