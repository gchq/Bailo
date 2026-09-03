import Create from '@mui/icons-material/Create'
import { Box, Button, Container, Stack } from '@mui/material'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { memoize } from 'lodash-es'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import DeploymentAssessmentSummaryCard from 'src/deployment-assessments/DeploymentAssessmentSummaryCard'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

type DeploymentAssessmentsProps = {
  model: EntryInterface
}

export default function DeploymentAssessments({ model }: DeploymentAssessmentsProps) {
  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments({ modelIds: [model.id] })

  const deploymentAssessmentListItem = memoize(({ data }) => <DeploymentAssessmentSummaryCard assessment={data} />)

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
          list={deploymentAssessments}
          emptyListText='No deployment assessments found'
          sortingProperties={[
            { value: 'name', title: 'Name', iconKind: 'text' },
            { value: 'createdAt', title: 'Created date', iconKind: 'date' },
          ]}
          searchFilterProperty='name'
          hideSearchInput
          defaultSortProperty='createdAt'
        >
          {deploymentAssessmentListItem}
        </Paginate>
      </Stack>
    </Container>
  )
}
