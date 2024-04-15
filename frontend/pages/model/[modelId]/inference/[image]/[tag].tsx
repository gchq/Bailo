import { ArrowBack } from '@mui/icons-material'
import { Button, Card, Container, Link, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import Wrapper from 'src/Wrapper'

export default function InferenceApp() {
  const router = useRouter()
  const { modelId, image, tag }: { modelId?: string; image?: string; tag?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const serviceEndpoint = useMemo(
    () => `${uiConfig?.inference.connection.host}/inference/${modelId}/${image}/${tag}`,
    [uiConfig, modelId, image, tag],
  )

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <Wrapper title='Inferencing Service' page='Inferencing'>
      {(isModelLoading || isUiConfigLoading) && <Loading />}
      <Container maxWidth='lg'>
        <Card sx={{ my: 4, p: 4 }}>
          {model && (
            <Stack spacing={2}>
              <Typography component='h1' variant='h4' color='primary' fontWeight='bold'>
                {model.name}
              </Typography>
              {image}:{tag}
              <Stack direction='row' justifyContent='space-between'>
                <Link href={`/model/${modelId}?tab=inferencing`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Link href={`/model/${modelId}/inference/${image}/${tag}/settings`}>
                  <Button sx={{ width: 'fit-content' }}>View Settings</Button>
                </Link>
              </Stack>
              <iframe src={serviceEndpoint} width='100%' height='600' />
            </Stack>
          )}
        </Card>
      </Container>
    </Wrapper>
  )
}
