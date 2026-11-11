import Add from '@mui/icons-material/Add'
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined'
import { Box, Button, Container, Divider, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import Title from 'src/common/Title'
import DeploymentAssessmentsList from 'src/deployment-assessments/DeploymentAssessmentsList'
import useDeploymentAssessmentSchemaAvailability, {
  noDeploymentAssessmentSchemasMessage,
} from 'src/hooks/useDeploymentAssessmentSchemaAvailability'

export default function Deployments() {
  const router = useRouter()
  const { isSchemasLoading, noSchemasAvailable } = useDeploymentAssessmentSchemaAvailability()

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
              <Tooltip title='What are Deployment Assessments?'>
                <IconButton
                  size='small'
                  component='a'
                  href='/docs/users/using-a-model/deployment-assessments'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <HelpOutlinedIcon color='primary' />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
          <DeploymentAssessmentsList />
        </Stack>
      </Paper>
    </Container>
  )
}
