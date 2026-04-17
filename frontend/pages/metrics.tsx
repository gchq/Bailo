import OverviewMetrics from 'pages/metrics/OverviewMetrics'
import PolicyMetrics from 'pages/metrics/PolicyMetrics'
import PageWithTabs from 'src/common/PageWithTabs'

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
