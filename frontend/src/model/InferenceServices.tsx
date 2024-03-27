import { Box, Button, Container, Stack } from '@mui/material'
import { useGetInferencesForModelId } from 'actions/inferencing'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import InferenceDisplay from 'src/model/inferencing/InferenceDisplay'

import { ModelInterface } from '../../types/types'

type InferenceProps = {
  model: ModelInterface
}

export default function InferenceServices({ model }: InferenceProps) {
  const router = useRouter()
  const { inferences, isInferencesLoading, isInferencesError } = useGetInferencesForModelId(model.id)
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
          <Button variant='outlined' onClick={handleCreateNewInferenceService}>
            Create Service
          </Button>
        </Box>
        {isInferencesLoading && <Loading />}
        {inferenceDisplays}
      </Stack>
    </Container>
  )
}
