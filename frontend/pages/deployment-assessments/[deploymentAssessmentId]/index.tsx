import ArrowBack from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import ReviewIcon from '@mui/icons-material/Comment'
import { Box, Button, Container, Divider, IconButton, Paper, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { postDeploymentAssessmentReviewResponse, useGetReviewsForDeploymentAssessment } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import ReviewWithComment from 'src/common/ReviewWithComment'
import Title from 'src/common/Title'
import AssessmentStateChip from 'src/deployment-assessments/AssessmentStateChip'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
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

  const theme = useTheme()

  const [isEdit, setIsEdit] = useState(false)
  const [isReviewPanelShown, setIsReviewPanelShown] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)

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

  const isLoadingDeploymentAssessment =
    !router.isReady || isDeploymentAssessmentLoading || !deploymentAssessment || isReviewsLoading

  return (
    <>
      <Title text={deploymentAssessment ? deploymentAssessment.name : 'Loading....'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='deploymentAssessmentContainer'>
        <Paper>
          {isLoadingDeploymentAssessment && <Loading />}
          {deploymentAssessment && (
            <>
              <ReviewBanner
                deploymentAssessment={deploymentAssessment}
                onReviewButtonClicked={() => setIsReviewPanelShown(true)}
              />
              {deploymentAssessment.draft && (
                <Paper
                  color='primary'
                  sx={{
                    backgroundColor: theme.palette.mode === 'light' ? theme.palette.info.light : 'unset',
                    py: 1,
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                  }}
                >
                  <Stack
                    direction='row'
                    spacing={2}
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 2,
                      width: '100%',
                    }}
                  >
                    <Stack direction='row' spacing={1}>
                      <ReviewIcon color='primary' />
                      <Typography>Draft</Typography>
                    </Stack>
                    <Button
                      variant='outlined'
                      color='inherit'
                      size='small'
                      onClick={() => {}}
                      data-test='publishButton'
                    >
                      Publish
                    </Button>
                  </Stack>
                </Paper>
              )}
              <Stack spacing={2} sx={{ p: 4 }}>
                <Stack
                  direction={{ sm: 'row', xs: 'column' }}
                  spacing={2}
                  divider={<Divider flexItem orientation='vertical' />}
                  sx={{ alignItems: 'center' }}
                >
                  <Link href={backHref}>
                    <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                      Back to deployments
                    </Button>
                  </Link>
                  <Stack
                    direction='row'
                    sx={{
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant='h6' color='primary' component='h1'>
                      {deploymentAssessment ? deploymentAssessment.name : 'Loading...'}
                    </Typography>
                    <CopyToClipboardButton
                      textToCopy={deploymentAssessment.id}
                      notificationText='Copied deployment assessment ID to clipboard'
                      ariaLabel='copy deployment assessment ID to clipboard'
                    />
                  </Stack>
                  <AssessmentStateChip assessment={deploymentAssessment} />
                </Stack>
                <Stack direction='row' spacing={2} divider={<Divider flexItem orientation='vertical' />}>
                  {deploymentAssessment && (
                    <Box sx={{ width: '100%' }}>
                      <EditableDeploymentAssessmentForm
                        deploymentAssessment={deploymentAssessment}
                        isEdit={isEdit}
                        onIsEditChange={setIsEdit}
                      />
                    </Box>
                  )}
                  {isReviewPanelShown && (
                    <Stack direction='row'>
                      <Stack spacing={2} sx={{ width: '350px' }}>
                        <ReviewWithComment
                          onSubmit={handleSubmit}
                          reviews={reviews}
                          loading={isReviewButtonLoading}
                          deploymentAssessmentReview
                        />
                        <MessageAlert message={errorMessage} severity='error' />
                      </Stack>
                      <IconButton
                        onClick={() => setIsReviewPanelShown(!isReviewPanelShown)}
                        sx={{ height: 'fit-content' }}
                      >
                        <CloseIcon fontSize='small' />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>
                <ReviewComments
                  identifier={deploymentAssessment.id}
                  parentId={deploymentAssessment._id}
                  kind={ReviewKind.DEPLOYMENTS}
                  isEdit={isEdit}
                  mutator={mutateDeploymentAssessment}
                  entryId=''
                />
              </Stack>
            </>
          )}
        </Paper>
      </Container>
    </>
  )
}
