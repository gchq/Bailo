import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, Divider, Paper, Popper, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { postDeploymentAssessmentReviewResponse, useGetReviewsForDeploymentAssessment } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
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

  const error = MultipleErrorWrapper('Unable to load deployment assessment', {
    isDeploymentAssessmentError,
    isReviewsError,
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
                  disableButton={isEdit}
                  isLoading={isLoading}
                  handlePublish={handlePublish}
                  draft={deploymentAssessment.draft}
                  text='This is a draft deployment assessment'
                  dialogTitle='Confirm publish'
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
                    responseList={deploymentAssessment.respones}
                  />
                </Stack>
              </>
            )}
          </Paper>
          {isReviewPanelShown && (
            <Popper
              open={reviewPopoverOpen}
              anchorEl={anchorEl}
              sx={{ boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}
            >
              <Paper sx={{ border: 'solid', borderWidth: 1, borderColor: theme.palette.divider }}>
                <Stack direction='row' sx={{ p: 2 }}>
                  <Stack spacing={2} sx={{ width: '450px' }}>
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
