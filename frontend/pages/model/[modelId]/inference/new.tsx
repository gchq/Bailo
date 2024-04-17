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
import Title from 'src/common/Title'
import MessageAlert from 'src/MessageAlert'
import InferenceForm from 'src/model/inferencing/InferenceForm'
import { FlattenedModelImage } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { isValidPortNumber } from 'utils/stringUtils'

export default function NewInference() {
  const [description, setDescription] = useState('')
  const [port, setPort] = useState('')
  const [processorType, setProcessorType] = useState('cpu')
  const [memory, setMemory] = useState(2)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const { modelId }: { modelId?: string } = router.query

  const [image, setImage] = useState<FlattenedModelImage | undefined>()

  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!model) {
      return setErrorMessage('Please wait for the model to finish loading.')
    }
    if (!image) {
      return setErrorMessage('Please select an image to spin up a service.')
    }
    if (!isValidPortNumber(port)) {
      return setErrorMessage('Please use a valid port number.')
    }

    setErrorMessage('')
    setLoading(true)

    const inference: CreateInferenceParams = {
      modelId: model.id,
      image: image.name,
      description: description,
      tag: image.tag,
      settings: {
        processorType: processorType,
        port: Number(port),
        ...(processorType === 'cpu' && { memory }),
      },
    }

    const res = await postInference(inference)

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
      setLoading(false)
    } else {
      router.push(`/model/${modelId}/inference/${image.name}/${image.tag}`)
    }
  }
  return (
    <>
      <Title text='Create a new Inferencing Service' />
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
                    Model Inferencing allows usage of models within Bailo. This allows users of this model to experiment
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
                />
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
    </>
  )
}
