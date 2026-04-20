import PageWithTabs from 'src/common/PageWithTabs'
import OverviewMetrics from 'src/metrics/OverviewMetrics'
import PolicyMetrics from 'src/metrics/PolicyMetrics'

export default function Metrics() {
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
      <PageWithTabs title='Bailo Metrics' tabs={tabs} />
    </>
  )
}
