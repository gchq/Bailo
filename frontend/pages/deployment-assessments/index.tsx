import Add from '@mui/icons-material/Add'
import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import HelpDialog from 'src/common/HelpDialog'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Title from 'src/common/Title'
import DeploymentAssessmentsList from 'src/deployment-assessments/DeploymentAssessmentsList'

export default function Deployments() {
  const router = useRouter()

  const deploymentAssessmentInfo = `
  Deployment assessments are primarily used to record and approve the use of one or more models. Unlike the previous access request process, deployment assessments are not tied to a specific model, and model owners or managers do not necessarily need to be involved in the review process.

  ### When to use deployment assessments
  Deployment assessments are used to document and approve the use of one or more models. Under the previous process, users were required to submit an access request for each model and wait for approval from someone responsible for that model. With deployment assessments, multiple models can be included within a single assessment.

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
              <Button
                sx={{ minWidth: '154px' }}
                variant='contained'
                onClick={() => router.push('/deployment-assessments/new')}
                startIcon={<Add />}
                data-test='actionButton'
              >
                Create deployment assessment
              </Button>
              <HelpDialog
                title='What are deployment assessments?'
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
