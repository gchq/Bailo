import ArrowBack from '@mui/icons-material/ArrowBack'
import ReviewIcon from '@mui/icons-material/Comment'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { patchDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetDeploymentAssessment } from 'actions/deploymentAssessments'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableDeploymentAssessmentForm from 'src/deployments/EditableDeploymentAssessmentForm'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import { getErrorMessage } from 'utils/fetcher'

export default function DeploymentAssessment() {
  const router = useRouter()
  const { deploymentAssessmentId }: { deploymentAssessmentId?: string } = router.query

  const theme = useTheme()

  const [isEdit, setIsEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
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
                      onClick={() => {
                        setPublishOpen(true)
                      }}
                      loading={isLoading}
                      data-test='publishButton'
                    >
                      Publish
                    </Button>
                    <ConfirmationDialogue
                      open={publishOpen}
                      title='Delete Deployment Assessment'
                      onConfirm={handlePublish}
                      onCancel={() => setPublishOpen(false)}
                      errorMessage={patchErrorMessage}
                      dialogMessage={
                        'Are you sure you want to publish this deployment assessment? This is irreversible.'
                      }
                      confirmLoading={isLoading}
                    />
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
                      textToCopy={deploymentAssessment.name}
                      notificationText='Copied deployment assessment ID to clipboard'
                      ariaLabel='copy deployment assessment ID to clipboard'
                    />
                  </Stack>
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
