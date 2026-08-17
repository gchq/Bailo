import Add from '@mui/icons-material/Add'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'

export default function Deployments() {
  const router = useRouter()
  const tabs = useMemo(
    () => [
      { title: 'Needs Action', path: 'needs-action', view: <></> },
      { title: 'My Assessments', path: 'my-assessments', view: <></> },
      { title: 'All Assessments', path: 'all-assessments', view: <></> },
    ],
    [],
  )

  return (
    <>
      <Title text='Deployment Assessments' />
      <PageWithTabs
        title='Deployment Assessments'
        tabs={tabs}
        displayActionButton
        actionButtonTitle='Create deployment assessment'
        actionButtonOnClick={() => router.push('/deployments/new')}
        actionButtonIcon={<Add />}
      />
    </>
  )
}
