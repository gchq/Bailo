import ArrowBack from '@mui/icons-material/ArrowBack'
import ReviewIcon from '@mui/icons-material/Comment'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableDeploymentAssessmentForm from 'src/deployment-assessments/EditableDeploymentAssessmentForm'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'

export default function DeploymentAssessment() {
  const router = useRouter()
  const { deploymentAssessmentId }: { deploymentAssessmentId?: string } = router.query

  const theme = useTheme()

  const [isEdit, setIsEdit] = useState(false)

  const { deploymentAssessment, isDeploymentAssessmentLoading, isDeploymentAssessmentError } =
    useGetDeploymentAssessment(deploymentAssessmentId)

  const error = MultipleErrorWrapper('Unable to load deployment assessment', {
    isDeploymentAssessmentError,
  })
  if (error) {
    return error
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
                >
                  <Link href={`/deployment-assessments`}>
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
                </Stack>
                {deploymentAssessment && (
                  <EditableDeploymentAssessmentForm
                    deploymentAssessment={deploymentAssessment}
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
