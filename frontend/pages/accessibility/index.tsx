import { Container } from '@mui/material'
import ReportPage from 'src/accessibility/report.mdx'
import StatementPage from 'src/accessibility/statement.mdx'
import PageWithTabs, { PageTab } from 'src/common/PageWithTabs'

export default function Accessibility() {
  const tabs: PageTab[] = [
    {
      title: 'Statement',
      path: 'statement',
      view: (
        <Container maxWidth='lg'>
          <StatementPage />
        </Container>
      ),
    },
    {
      title: 'Report',
      path: 'report',
      view: (
        <Container maxWidth='lg'>
          <ReportPage />
        </Container>
      ),
    },
  ]

  return <PageWithTabs title='Accessibility' tabs={tabs} />
}
