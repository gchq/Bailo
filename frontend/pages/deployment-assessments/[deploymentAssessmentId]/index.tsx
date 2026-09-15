import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack } from '@mui/material'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema, validateForm } from 'utils/formUtils'

export default function DeploymentAssessment() {
  const router = useRouter()
  const { deploymentAssessmentId, returnTo }: { deploymentAssessmentId?: string; returnTo?: string } = router.query
  const backHref =
    typeof returnTo === 'string' &&
    (returnTo === '/deployment-assessments' || returnTo.startsWith('/deployment-assessments?'))
      ? returnTo
      : '/deployment-assessments?tab=all-assessments'

  const sendNotification = useNotification()

  const [isEdit, setIsEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [patchErrorMessage, setPatchErrorMessage] = useState('')
  const [showValidationErrors, setShowValidationErrors] = useState(false)

  const {
    deploymentAssessment,
    isDeploymentAssessmentLoading,
    isDeploymentAssessmentError,
    mutateDeploymentAssessment,
  } = useGetDeploymentAssessment(deploymentAssessmentId as string)

  const { schema, isSchemaError } = useGetSchema(deploymentAssessment?.schemaId ?? '')

  const isPublishable = useMemo(() => {
    if (!schema) {
      return false
    }

    return getStepsFromSchema(schema, {}, [], deploymentAssessment?.metadata).every(validateForm)
  }, [schema, deploymentAssessment?.metadata])

  useEffect(() => {
    if (isPublishable) {
      setShowValidationErrors(false)
    }
  }, [isPublishable])

  const error = MultipleErrorWrapper('Unable to load deployment assessment', {
    isDeploymentAssessmentError,
    isSchemaError,
  })
  if (error) {
    return error
  }

  function handleBeforePublish() {
    if (!isPublishable) {
      setShowValidationErrors(true)
      sendNotification({ msg: 'Unable to publish incomplete Deployment Assessment.', variant: 'error' })
      return false
    }

    setShowValidationErrors(false)
    return true
  }

  async function handlePublish() {
    if (deploymentAssessment) {
      setIsLoading(true)
      const response = await patchDeploymentAssessment(deploymentAssessment.id, undefined, false)
      if (!response.ok) {
        setPatchErrorMessage(await getErrorMessage(response))
      } else {
        mutateDeploymentAssessment()
        sendNotification({ msg: 'Deployment Assessment successfully published.', variant: 'success' })
      }
      setIsLoading(false)
    }
  }

  const isLoadingDeploymentAssessment = !router.isReady || isDeploymentAssessmentLoading || !deploymentAssessment

  return (
    <>
      <Title text={deploymentAssessment ? deploymentAssessment.name : 'Loading....'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='deploymentAssessmentContainer'>
        <Paper>
          {isLoadingDeploymentAssessment && <Loading />}
          {deploymentAssessment && (
            <>
              <DraftBanner
                errorMessage={patchErrorMessage}
                setErrorMessage={setPatchErrorMessage}
                disableButton={isEdit}
                isLoading={isLoading}
                handlePublish={handlePublish}
                draft={deploymentAssessment.draft}
                text='This is a draft deployment assessment'
                dialogTitle='Publish Deployment Assessment'
                dialogMessage='Are you sure you want to publish this Deployment Assessment? This decision is irreversible.'
                onBeforePublish={handleBeforePublish}
                showButton
              />
              <Stack spacing={2} sx={{ p: 4 }}>
                <Stack
                  direction={{ sm: 'row', xs: 'column' }}
                  spacing={2}
                  divider={<Divider flexItem orientation='vertical' />}
                >
                  <Link href={backHref}>
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
                    showValidationErrors={showValidationErrors}
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
