import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, Divider, Paper, Popper, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { mutateWithPatchedAssessment, patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { postDeploymentAssessmentReviewResponse, useGetReviewsForDeploymentAssessment } from 'actions/review'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewWithComment from 'src/common/ReviewWithComment'
import Title from 'src/common/Title'
import AssessmentStateChip from 'src/deployment-assessments/AssessmentStateChip'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ReviewComments from 'src/reviews/ReviewComments'
import { DecisionKeys, ReviewKind } from 'types/types'
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
  const theme = useTheme()

  const [isEdit, setIsEdit] = useState(false)
  const [isReviewPanelShown, setIsReviewPanelShown] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [patchErrorMessage, setPatchErrorMessage] = useState('')
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const reviewPopoverOpen = Boolean(anchorEl)

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
      setIsReviewPanelShown(false)
      mutateReviews()
      mutateDeploymentAssessment()
    }
  }

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(deploymentAssessment?.schemaId ?? '')

  // Built once per schema, so the validator can cache against stable step schemas
  const steps = useMemo(() => (schema ? getStepsFromSchema(schema) : []), [schema])

  const isPublishable = useMemo(
    () =>
      steps.length > 0 &&
      steps.every((step) => validateForm({ ...step, state: deploymentAssessment?.metadata?.[step.section] ?? {} })),
    [steps, deploymentAssessment?.metadata],
  )

  useEffect(() => {
    if (isPublishable) {
      setShowValidationErrors(false)
    }
  }, [isPublishable])

  const error = MultipleErrorWrapper('Unable to load deployment assessment', {
    isDeploymentAssessmentError,
    isSchemaError,
    isReviewsError,
  })
  if (error) {
    return error
  }

  function handleBeforePublish() {
    // Completeness is unknown until the schema arrives
    if (isSchemaLoading) {
      return false
    }

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
        await mutateWithPatchedAssessment(mutateDeploymentAssessment, response)
        sendNotification({ msg: 'Deployment Assessment successfully published.', variant: 'success' })
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
                  disableButton={isEdit || isSchemaLoading}
                  isLoading={isLoading}
                  handlePublish={handlePublish}
                  draft={deploymentAssessment.draft}
                  text='This is a draft deployment assessment'
                  dialogTitle='Publish Deployment Assessment'
                  dialogMessage='Are you sure you want to publish this Deployment Assessment? This decision is irreversible.'
                  onBeforePublish={handleBeforePublish}
                  showButton
                />
                {!deploymentAssessment.draft && (
                  <ReviewBanner
                    deploymentAssessment={deploymentAssessment}
                    onReviewButtonClicked={(anchor) => {
                      setAnchorEl(anchor)
                      setIsReviewPanelShown(true)
                    }}
                  />
                )}
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
                          showValidationErrors={showValidationErrors}
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
          {isReviewPanelShown && (
            <Popper
              open={reviewPopoverOpen}
              anchorEl={anchorEl}
              sx={{
                maxWidth: '450px',
                '&:has(.w-md-editor-fullscreen)': {
                  transform: 'none !important',
                },
                boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
              }}
              modifiers={[
                {
                  name: 'preventOverflow',
                  enabled: true,
                  options: {
                    altAxis: true,
                    altBoundary: true,
                    tether: true,
                    rootBoundary: 'document',
                    padding: 24,
                  },
                },
              ]}
            >
              <Paper sx={{ border: 'solid', borderWidth: 1, borderColor: theme.palette.divider }}>
                <Stack direction='row' sx={{ p: 2 }}>
                  <Stack spacing={2} sx={{ maxWidth: '100%' }}>
                    <ReviewWithComment
                      onSubmit={handleSubmit}
                      reviews={reviews}
                      loading={isReviewButtonLoading}
                      deploymentAssessmentReview
                      onCancel={() => setAnchorEl(null)}
                    />
                    <MessageAlert message={errorMessage} severity='error' />
                  </Stack>
                </Stack>
              </Paper>
            </Popper>
          )}
        </Stack>
      </Container>
    </>
  )
}
