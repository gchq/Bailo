import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, Divider, Paper, Stack } from '@mui/material'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import AssessmentStateChip from 'src/deployment-assessments/AssessmentStateChip'
import DeploymentAssessmentComments from 'src/deployment-assessments/DeploymentAssessmentComments'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import { getErrorMessage } from 'utils/fetcher'

export default function DeploymentAssessment() {
  const router = useRouter()
  const { deploymentAssessmentId, returnTo }: { deploymentAssessmentId?: string; returnTo?: string } = router.query
  const backHref =
    typeof returnTo === 'string' &&
    (returnTo === '/deployment-assessments' || returnTo.startsWith('/deployment-assessments?'))
      ? returnTo
      : '/deployment-assessments'

  const sendNotification = useNotification()

  const [isEdit, setIsEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [patchErrorMessage, setPatchErrorMessage] = useState('')
  const [isFormValid, setIsFormValid] = useState<boolean | undefined>(undefined)
  const [showValidation, setShowValidation] = useState(false)

  const handleValidityChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid)
    if (isValid) {
      setShowValidation(false)
    }
  }, [])

  const {
    deploymentAssessment,
    isDeploymentAssessmentLoading,
    isDeploymentAssessmentError,
    mutateDeploymentAssessment,
  } = useGetDeploymentAssessment(deploymentAssessmentId)

  const error = MultipleErrorWrapper('Unable to load deployment assessment', {
    isDeploymentAssessmentError,
  })
  if (error) {
    return error
  }

  function validateBeforeSubmit() {
    if (isFormValid) {
      return true
    }
    setShowValidation(true)
    sendNotification({
      msg: 'Please make sure that all required fields are appropriately filled out before publishing.',
      variant: 'error',
    })
    return false
  }

  async function handlePublish() {
    if (deploymentAssessment) {
      setIsLoading(true)
      const response = await patchDeploymentAssessment(deploymentAssessment.id, undefined, false)
      if (!response.ok) {
        setPatchErrorMessage(await getErrorMessage(response))
      } else {
        mutateDeploymentAssessment()
        sendNotification({ msg: 'Deployment assessment successfully published.', variant: 'success' })
      }
      setIsLoading(false)
    }
  }

  const isLoadingDeploymentAssessment = !router.isReady || isDeploymentAssessmentLoading || !deploymentAssessment

  return (
    <>
      <Title text={deploymentAssessment ? deploymentAssessment.name : 'Loading....'} />
      <Container maxWidth='lg' sx={{ my: 2 }} data-test='deploymentAssessmentContainer'>
        <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
          <Paper sx={{ width: '100%' }}>
            {isLoadingDeploymentAssessment && <Loading />}
            {deploymentAssessment && (
              <>
                <DraftBanner
                  errorMessage={patchErrorMessage}
                  setErrorMessage={setPatchErrorMessage}
                  disableButton={isEdit || isFormValid === undefined}
                  isLoading={isLoading}
                  handleSubmit={handlePublish}
                  validateBeforeSubmit={validateBeforeSubmit}
                  draft={deploymentAssessment.draft}
                  text='This is a draft deployment assessment'
                  dialogTitle='Publish deployment assessment'
                  dialogMessage='Are you sure you want to publish this deployment assessment? Published deployment assessments cannot be returned to draft.'
                  buttonText='Publish'
                  showButton
                />
                <Stack spacing={2} sx={{ p: 4 }}>
                  <Stack
                    direction={{ sm: 'row', xs: 'column' }}
                    spacing={2}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Link href={backHref}>
                      <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                        Back to deployment assessments
                      </Button>
                    </Link>
                    <Stack
                      direction='row'
                      spacing={2}
                      sx={{ alignItems: 'center' }}
                      divider={<Divider flexItem orientation='vertical' />}
                    >
                      <AssessmentStateChip assessment={deploymentAssessment} />
                    </Stack>
                  </Stack>
                  <Divider flexItem />
                  <Stack direction='row' spacing={2} divider={<Divider flexItem orientation='vertical' />}>
                    {deploymentAssessment && (
                      <Box sx={{ width: '100%' }}>
                        <EditableDeploymentAssessmentForm
                          deploymentAssessment={deploymentAssessment}
                          mutate={mutateDeploymentAssessment}
                          isEdit={isEdit}
                          onIsEditChange={(isEditable) => setIsEdit(isEditable)}
                          showValidation={showValidation}
                          onValidityChange={handleValidityChange}
                        />
                      </Box>
                    )}
                  </Stack>
                  <DeploymentAssessmentComments
                    deploymentAssessmentId={deploymentAssessment.id}
                    responses={deploymentAssessment.responses ?? []}
                    isEdit={isEdit}
                    mutateResponses={mutateDeploymentAssessment}
                  />
                </Stack>
              </>
            )}
          </Paper>
        </Stack>
      </Container>
    </>
  )
}
