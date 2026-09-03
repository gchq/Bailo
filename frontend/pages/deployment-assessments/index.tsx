import Add from '@mui/icons-material/Add'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { useRouter } from 'next/router'
import { useContext, useMemo } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import UiConfigContext from 'src/contexts/uiConfigContext'
import NeedsAction from 'src/deployment-assessments/NeedsAction'

export default function Deployments() {
  const router = useRouter()
  const uiConfig = useContext(UiConfigContext)

  // Shares an SWR cache key with the tab's own list, so the count costs no extra request
  const { deploymentAssessments } = useGetDeploymentAssessments({ needsAction: true })

  const tabs = useMemo(
    () => [
      {
        title: deploymentAssessments.length ? `Needs action (${deploymentAssessments.length})` : 'Needs action',
        path: 'needs-action',
        view: <NeedsAction />,
      },
      { title: 'My assessments', path: 'my-assessments', view: <></> },
      { title: 'All assessments', path: 'all-assessments', view: <></> },
    ],
    [deploymentAssessments.length],
  )

  const deploymentAssessmentInfo = `
  Deployment assessments are primarily used to record and approve the use of one or more models. Unlike the previous access request process, deployment assessments are not tied to a specific model, and model owners or managers do not necessarily need to be involved in the review process.

  ### When to use deployment assessments
  Deployment assessments are used to document and approve the use of one or more models. Under the previous process, users were required to submit an access request for each model and wait for approval from someone responsible for that model. With deployment assessments, multiple models can be included within a single assessment.

  ### How are deployment assessments reviewed?
  Deployment assessments are reviewed by a single ${uiConfig.roleDisplayNames.riskOwner}. The ${uiConfig.roleDisplayNames.riskOwner} is selected by the person creating the assessment and is responsible for reviewing and approving its use. They do not need to be involved in the ownership or management of any of the models included in the assessment.
`

  return (
    <>
      <Title text='Deployment Assessments' />
      <PageWithTabs
        title='Deployment Assessments'
        tabs={tabs}
        displayActionButton
        actionButtonTitle='Create deployment assessment'
        actionButtonOnClick={() => router.push('/deployment-assessments/new')}
        actionButtonIcon={<Add />}
        buttonHelpDialog={{
          title: 'What are deployment assessments?',
          content: <MarkdownDisplay>{deploymentAssessmentInfo}</MarkdownDisplay>,
        }}
      />
    </>
  )
}
