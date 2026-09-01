import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack } from '@mui/material'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableDeploymentAssessmentForm from 'src/deployments/EditableDeploymentAssessmentForm'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import { getErrorMessage } from 'utils/fetcher'

export default function DeploymentAssessment() {
  const router = useRouter()
  const { deploymentAssessmentId }: { deploymentAssessmentId?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [patchErrorMessage, setPatchErrorMessage] = useState('')

  const {
    deploymentAssessment,
    isDeploymentAssessmentLoading,
    isDeploymentAssessmentError,
    mutateDeploymentAssessment,
  } = useGetDeploymentAssessment(deploymentAssessmentId as string)

  const error = MultipleErrorWrapper('Unable to load deployment assessment', {
    isDeploymentAssessmentError,
  })
  if (error) {
    return error
  }

  async function handlePublish() {
    if (deploymentAssessment) {
      setIsLoading(true)
      const response = await patchDeploymentAssessment(deploymentAssessment.id, undefined, false)
      if (!response.ok) {
        setPatchErrorMessage(await getErrorMessage(response))
      } else {
        mutateDeploymentAssessment()
      }
      setIsLoading(false)
    }
  }

  return (
    <>
      <Title text={deploymentAssessment ? deploymentAssessment.name : 'Loading....'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='deploymentAssessmentContainer'>
        <Paper>
          {isDeploymentAssessmentLoading && <Loading />}
          {deploymentAssessment && (
            <>
              <DraftBanner
                errorMessage={patchErrorMessage}
                disableButton={isEdit}
                isLoading={isLoading}
                handlePublish={handlePublish}
                draft={deploymentAssessment.draft}
                text='This is a draft deployment assessment'
                showButton
              />
              <Stack spacing={2} sx={{ p: 4 }}>
                <Stack
                  direction={{ sm: 'row', xs: 'column' }}
                  spacing={2}
                  divider={<Divider flexItem orientation='vertical' />}
                >
                  <Link href={`/deployment-assessments`}>
                    <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                      Back to deployments
                    </Button>
                  </Link>
                </Stack>
                {deploymentAssessment && (
                  <EditableDeploymentAssessmentForm
                    deploymentAssessment={deploymentAssessment}
                    mutate={mutateDeploymentAssessment}
                    isEdit={isEdit}
                    onIsEditChange={setIsEdit}
                  />
                )}
              </Stack>
            </>
          )}
        </Paper>
      </Container>
    </>
  )
}
