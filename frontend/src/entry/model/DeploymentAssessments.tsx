import Create from '@mui/icons-material/Create'
import { Box, Button, Container, Stack, Tooltip } from '@mui/material'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { memoize } from 'lodash-es'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import DeploymentAssessmentSummaryCard from 'src/deployment-assessments/DeploymentAssessmentSummaryCard'
import useDeploymentAssessmentSchemaAvailability, {
  noDeploymentAssessmentSchemasMessage,
} from 'src/hooks/useDeploymentAssessmentSchemaAvailability'
import MessageAlert from 'src/MessageAlert'
import { type EntryInterface } from 'types/types'

type DeploymentAssessmentsProps = {
  model: EntryInterface
}

export const noModelCardMessage = 'A model card must be created before a Deployment Assessment can be created.'

export default function DeploymentAssessments({ model }: DeploymentAssessmentsProps) {
  const router = useRouter()
  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments({ modelIds: [model.id], draft: false })
  const { isSchemasLoading, noSchemasAvailable } = useDeploymentAssessmentSchemaAvailability()

  let disabledReason = ''
  if (!model.card) {
    disabledReason = noModelCardMessage
  } else if (noSchemasAvailable) {
    disabledReason = noDeploymentAssessmentSchemasMessage
  }

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
          <Tooltip title={disabledReason}>
            <span>
              <Button
                variant='outlined'
                disabled={!model.card || isSchemasLoading || noSchemasAvailable}
                onClick={() => router.push('/deployment-assessments/new')}
                data-test='createDeploymentAssessmentButton'
                startIcon={<Create />}
              >
                Create Deployment Assessment
              </Button>
            </span>
          </Tooltip>
        </Box>
        <Paginate
          list={deploymentAssessments}
          emptyListText='No Deployment Assessments found'
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
