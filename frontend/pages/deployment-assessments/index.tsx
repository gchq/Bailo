import Add from '@mui/icons-material/Add'
import { Box, Button, Container, Divider, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import HelpDialog from 'src/common/HelpDialog'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Title from 'src/common/Title'
import DeploymentAssessmentsList from 'src/deployment-assessments/DeploymentAssessmentsList'
import useDeploymentAssessmentSchemaAvailability, {
  noDeploymentAssessmentSchemasMessage,
} from 'src/hooks/useDeploymentAssessmentSchemaAvailability'

export default function Deployments() {
  const router = useRouter()
  const { isSchemasLoading, noSchemasAvailable } = useDeploymentAssessmentSchemaAvailability()

  const deploymentAssessmentInfo = `
  Deployment assessments are used to document the use of one or more models. Unlike the previous access request process, Deployment Assessments are not tied to a specific model, and model owners or managers do not need to be involved.

  ### When to use Deployment Assessments
  Use a Deployment Assessment to record how one or more models will be deployed. Under the previous process, users were required to submit an access request for each model and wait for approval from someone responsible for that model. With Deployment Assessments, multiple models can be included within a single assessment.

  ### Drafts and publishing
  The author of a Deployment Assessment is responsible for its contents as the Deployment Risk Owner. Assessments can be saved as a draft and edited until they are ready, then published. Publishing cannot be undone, but comments can still be added afterwards.
`
  return (
    <Container maxWidth='xl' data-test='deploymentAssessmentsList'>
      <Paper sx={{ p: 2 }}>
        <Title text='Deployment Assessments' />
        <Stack spacing={2} divider={<Divider flexItem />}>
          <Stack
            direction='row'
            spacing={2}
            sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, pb: 2 }}
          >
            <Typography component='h1' color='primary' variant='h6'>
              Deployment Assessments
            </Typography>
            <Box>
              <Tooltip title={noSchemasAvailable ? noDeploymentAssessmentSchemasMessage : ''}>
                <span>
                  <Button
                    sx={{ minWidth: '154px' }}
                    variant='contained'
                    onClick={() => router.push('/deployment-assessments/new')}
                    startIcon={<Add />}
                    disabled={isSchemasLoading || noSchemasAvailable}
                    data-test='actionButton'
                  >
                    Create Deployment Assessment
                  </Button>
                </span>
              </Tooltip>
              <HelpDialog
                title='What are Deployment Assessments?'
                content={<MarkdownDisplay>{deploymentAssessmentInfo}</MarkdownDisplay>}
              />
            </Box>
          </Stack>
          <DeploymentAssessmentsList />
        </Stack>
      </Paper>
    </Container>
  )
}
