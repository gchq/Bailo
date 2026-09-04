import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Dialog, DialogContent, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { postDeploymentAssessmentReviewResponse, useGetReviewsForDeploymentAssessment } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewWithComment from 'src/common/ReviewWithComment'
import Title from 'src/common/Title'
import UserDisplay from 'src/common/UserDisplay'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { DecisionKeys } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

export default function ReleaseReview() {
  const router = useRouter()
  const { deploymentAssessmentId }: { deploymentAssessmentId?: string } = router.query

  const [errorMessage, setErrorMessage] = useState('')
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false)

  const { deploymentAssessment, isDeploymentAssessmentLoading, isDeploymentAssessmentError } =
    useGetDeploymentAssessment(deploymentAssessmentId)
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
      mutateReviews()
      router.push(`/deployment-assessments/${deploymentAssessmentId}`)
    }
  }

  const error = MultipleErrorWrapper('Unable to load release review page', {
    isReviewsError,
    isDeploymentAssessmentError,
  })
  if (error) {
    return error
  }

  if (!reviews || !deploymentAssessment || isReviewsLoading || isDeploymentAssessmentLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text={deploymentAssessment ? deploymentAssessment.name : 'Loading...'} />
      <Container maxWidth='md' sx={{ my: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={2}
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Link href={`/deployment-assessments/${deploymentAssessmentId}`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to deployment assessment
                </Button>
              </Link>
              <Typography variant='h6' component='h1' color='primary'>
                {deploymentAssessment ? `Reviewing deployment assessment ${deploymentAssessment.name}` : 'Loading...'}
              </Typography>
              <Button onClick={() => setIsReleaseDialogOpen(true)}>View full release</Button>
            </Stack>
            <ReviewWithComment
              onSubmit={handleSubmit}
              reviews={reviews}
              loading={isReviewButtonLoading}
              deploymentAssessmentReview
            />
            <MessageAlert message={errorMessage} severity='error' />
            <Divider />
            <Stack direction='row' spacing={0.5}>
              <Typography variant='caption' sx={{ mb: 2 }}>
                Created by
              </Typography>
              <UserDisplay dn={deploymentAssessment.createdBy} />
              <Typography>on</Typography>
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {` ${formatDateString(deploymentAssessment.createdAt.toString())}`}
              </Typography>
            </Stack>
          </Stack>
          <Dialog open={isReleaseDialogOpen} onClose={() => setIsReleaseDialogOpen(false)} maxWidth='md' fullWidth>
            <DialogContent sx={{ p: 4 }}>
              <EditableDeploymentAssessmentForm
                deploymentAssessment={deploymentAssessment}
                readOnly
                isEdit={false}
                onIsEditChange={() => {}}
              />
            </DialogContent>
          </Dialog>
        </Paper>
      </Container>
    </>
  )
}
