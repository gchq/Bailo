import { Box, Button, Container, Stack, Tooltip } from '@mui/material'
import { useGetInferencesForModelId } from 'actions/inferencing'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import InferenceDisplay from 'src/entry/model/inferencing/InferenceDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getRequiredRolesText, hasRole } from 'utils/roles'

type InferenceProps = {
  model: EntryInterface
  currentUserRoles: string[]
}

export default function InferenceServices({ model, currentUserRoles }: InferenceProps) {
  const router = useRouter()
  const { inferences, isInferencesLoading, isInferencesError } = useGetInferencesForModelId(model.id)

  const [canCreateService, requiredRolesText] = useMemo(() => {
    const validRoles = ['owner', 'contributor']
    return [hasRole(currentUserRoles, validRoles), getRequiredRolesText(currentUserRoles, validRoles)]
  }, [currentUserRoles])

  const inferenceDisplays = useMemo(
    () =>
      inferences.length ? (
        inferences.map((inference) => (
          <InferenceDisplay model={model} inference={inference} key={`${inference.image}:${inference.tag}`} />
        ))
      ) : (
        <EmptyBlob text={`No inference services found for model ${model.name}`} />
      ),
    [model, inferences],
  )

  function handleCreateNewInferenceService() {
    router.push(`/model/${model.id}/inference/new`)
  }

  if (isInferencesError) {
    return <MessageAlert message={isInferencesError.info.message} severity='error' />
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Tooltip title={requiredRolesText}>
            <span>
              <Button variant='outlined' disabled={!canCreateService} onClick={handleCreateNewInferenceService}>
                Create Service
              </Button>
            </span>
          </Tooltip>
        </Box>
        {isInferencesLoading && <Loading />}
        {inferenceDisplays}
      </Stack>
    </Container>
  )
}
