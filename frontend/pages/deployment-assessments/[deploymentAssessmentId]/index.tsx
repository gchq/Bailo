import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, Divider, Paper, Stack } from '@mui/material'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { postDeploymentAssessmentReviewResponse, useGetReviewsForDeploymentAssessment } from 'actions/review'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewPopper from 'src/common/ReviewPopper'
import Title from 'src/common/Title'
import AssessmentStateChip from 'src/deployment-assessments/AssessmentStateChip'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import ReviewComments from 'src/reviews/ReviewComments'
import { DecisionKeys, ReviewKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

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
  const [errorMessage, setErrorMessage] = useState('')
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)
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
  const { reviews, isReviewsLoading, isReviewsError, mutateReviews } =
    useGetReviewsForDeploymentAssessment(deploymentAssessmentId)

  async function handleSubmit(decision: DecisionKeys, comment: string) {
    setErrorMessage('')
    if (!deploymentAssessmentId) {
      return setErrorMessage('Could not find deployment assessment ID')
    }

    setIsReviewButtonLoading(true)
    const res = await postDeploymentAssessmentReviewResponse({
      deploymentAssessmentId: deploymentAssessmentId,
      comment,
      decision,
    })

    if (!res.ok) {
      setIsReviewButtonLoading(false)
      setErrorMessage(await getErrorMessage(res))
    } else {
      setErrorMessage('')
      setIsReviewButtonLoading(false)
      mutateReviews()
      mutateDeploymentAssessment()
    }
  }

  const error = MultipleErrorWrapper('Unable to load deployment assessment', {
    isDeploymentAssessmentError,
    isReviewsError,
  })
  if (error) {
    return error
  }

  function validateBeforeSubmitForReview() {
    if (isFormValid) {
      return true
    }
    setShowValidation(true)
    sendNotification({
      msg: 'Please make sure that all required fields are appropriately filled out before submitting for review.',
      variant: 'error',
    })
    return false
  }

  async function handleSubmitForReview() {
    if (deploymentAssessment) {
      setIsLoading(true)
      const response = await patchDeploymentAssessment(deploymentAssessment.id, undefined, false)
      if (!response.ok) {
        setPatchErrorMessage(await getErrorMessage(response))
      } else {
        mutateDeploymentAssessment()
        sendNotification({ msg: 'Deployment Assessment successfully submitted for review.', variant: 'success' })
      }
      setIsLoading(false)
    }
  }

  const isLoadingDeploymentAssessment =
    !router.isReady || isDeploymentAssessmentLoading || !deploymentAssessment || isReviewsLoading

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
                  handleSubmitForReview={handleSubmitForReview}
                  validateBeforeSubmitForReview={validateBeforeSubmitForReview}
                  draft={deploymentAssessment.draft}
                  text='This is a draft deployment assessment'
                  dialogTitle='Confirm submission for review'
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
                        Back to deployments
                      </Button>
                    </Link>
                    <Stack
                      direction='row'
                      spacing={2}
                      sx={{ alignItems: 'center' }}
                      divider={<Divider flexItem orientation='vertical' />}
                    >
                      <AssessmentStateChip assessment={deploymentAssessment} />
                      {!deploymentAssessment.draft && (
                        <ReviewPopper
                          reviews={reviews}
                          onSubmit={handleSubmit}
                          includeDueDate={false}
                          isLoading={isReviewButtonLoading}
                          errorMessage={errorMessage}
                          deploymentAssessmentReview
                        />
                      )}
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
                          onIsEditChange={setIsEdit}
                          showValidation={showValidation}
                          onValidityChange={handleValidityChange}
                        />
                      </Box>
                    )}
                  </Stack>
                  <ReviewComments
                    identifier={deploymentAssessment.id}
                    parentId={deploymentAssessment._id}
                    kind={ReviewKind.DEPLOYMENTS}
                    isEdit={isEdit}
                    mutator={mutateDeploymentAssessment}
                    entryId=''
                    responseList={deploymentAssessment.responses}
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
