import Create from '@mui/icons-material/Create'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { memoize } from 'lodash-es'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

type DeploymentAssessments = {
  model: EntryInterface
}

export default function DeploymentAssessments({ model }: DeploymentAssessments) {
  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments([model.id])

  const deploymentAssessmentListItem = memoize(({ data }) => <Typography>{data.name}</Typography>)

  if (isDeploymentAssessmentsLoading) {
    return <Loading />
  }

  if (isDeploymentAssessmentsError) {
    return <MessageAlert message={isDeploymentAssessmentsError.info.message} severity='error' />
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Link href={'/deployment-assessments/new'}>
            <Button
              variant='outlined'
              disabled={!model.card}
              data-test='createDeploymentAssessmentButton'
              startIcon={<Create />}
            >
              Create deployment assessment
            </Button>
          </Link>
        </Box>
        <Paginate
          list={deploymentAssessments.map((deployment) => {
            return { key: deployment.id, ...deployment }
          })}
          emptyListText={`No deployment assessments found for model ${model.name}`}
          sortingProperties={[
            { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
            { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
          ]}
          searchPlaceholderText='Search by name'
          defaultSortProperty='createdAt'
          searchFilterProperty='name'
        >
          {deploymentAssessmentListItem}
        </Paginate>
      </Stack>
    </Container>
  )
}
