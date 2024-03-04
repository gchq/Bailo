import { ArrowBack } from '@mui/icons-material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { LoadingButton } from '@mui/lab'
import { Box, Button, Card, Container, Link, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { CreateInferenceParams, postInference } from 'actions/inferencing'
import { useGetModel } from 'actions/model'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import InferenceForm from 'src/model/inferencing/InferenceForm'
import Wrapper from 'src/Wrapper'
import { FlattenedModelImage } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

export default function NewInference() {
  const [image, setImage] = useState<FlattenedModelImage>({} as any)
  const [description, setDescription] = useState('')
  const [port, setPort] = useState(8000)
  const [processorType, setProcessorType] = useState('cpu')
  const [memory, setMemory] = useState(2)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const { modelId }: { modelId?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!model) {
      return setErrorMessage('Please wait for the model to finish loading before trying to make a release.')
    }
    const inference: CreateInferenceParams = {
      modelId: model.id,
      image: image.name,
      description: description,
      tag: image.tag,
      settings: {
        processorType: processorType,
        memory: processorType === 'cpu' ? memory : undefined,
        port: port,
      },
    }

    const res = await postInference(inference)

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
      setLoading(false)
    } else {
      const body = await res.json()
      router.push(`/model/${modelId}/inference/${body.image}/${body.tag}`)
    }
  }
  return (
    <Wrapper title='Create a new Inferencing Service' page='Inferencing'>
      {isModelLoading && <Loading />}
      {model && !isModelLoading && (
        <Container maxWidth='md'>
          <Card sx={{ my: 4, p: 4 }}>
            <Box component='form' onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <Link href={`/model/${modelId}?tab=inferencing`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Stack spacing={2} alignItems='center' justifyContent='center'>
                  <Typography variant='h6' component='h1' color='primary'>
                    New Inferencing Service
                  </Typography>
                  <RocketLaunchIcon color='primary' fontSize='large' />
                  <Typography>
                    Model Inferencing allows usage of models within Bailo! This allows users of this model to experiment
                    with them without creating any local deployment.
                  </Typography>
                </Stack>
                <InferenceForm
                  model={model}
                  formData={{ image, description, memory, port, processorType }}
                  onImageChange={(value) => setImage(value)}
                  onDescriptionChange={(value) => setDescription(value)}
                  onProcessorTypeChange={(value) => setProcessorType(value)}
                  onMemoryChange={(value) => setMemory(value)}
                  onPortChange={(value) => setPort(value)}
                ></InferenceForm>
              </Stack>
              <Stack alignItems='flex-end' padding={2}>
                <LoadingButton
                  variant='contained'
                  type='submit'
                  disabled={!(image && description && port)}
                  loading={loading}
                >
                  Create Inferencing Service
                </LoadingButton>
                <MessageAlert message={errorMessage} severity='error' />
              </Stack>
            </Box>
          </Card>
        </Container>
      )}
    </Wrapper>
  )
}
