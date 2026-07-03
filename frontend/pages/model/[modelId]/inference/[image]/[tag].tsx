import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Link, Paper, Stack, Typography } from '@mui/material'
import { useGetEntry } from 'actions/entry'
import { useRouter } from 'next/router'
import { useContext, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import UiConfigContext from 'src/contexts/uiConfigContext'
import MessageAlert from 'src/MessageAlert'

export default function InferenceApp() {
  const router = useRouter()
  const { modelId, image, tag }: { modelId?: string; image?: string; tag?: string } = router.query
  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetEntry(modelId)
  const uiConfig = useContext(UiConfigContext)

  const [isSpinningUp, setIsSpinningUp] = useState(true)

  const serviceEndpoint = useMemo(
    () => `${uiConfig.inference.connection.host}/inference/${modelId}/${image}/${tag}`,
    [uiConfig, modelId, image, tag],
  )

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (isModelLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text='Inferencing Service' />
      {isModelLoading && <Loading />}
      <Container maxWidth='lg'>
        <Paper sx={{ my: 4, p: 4 }}>
          {model && (
            <Stack spacing={2}>
              <Typography
                component='h1'
                variant='h4'
                color='primary'
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {model.name}
              </Typography>
              {image}:{tag}
              <Stack
                direction='row'
                sx={{
                  justifyContent: 'space-between',
                }}
              >
                <Link href={`/model/${modelId}?tab=inferencing`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Link href={`/model/${modelId}/inference/${image}/${tag}/settings`}>
                  <Button sx={{ width: 'fit-content' }}>View Settings</Button>
                </Link>
              </Stack>
              {isSpinningUp && (
                <Stack
                  direction='row'
                  spacing={3}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    color='primary'
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    Spinning up {image}
                  </Typography>
                  <Loading />
                </Stack>
              )}
              <iframe src={serviceEndpoint} width='100%' height='600' onLoad={() => setIsSpinningUp(false)} />
            </Stack>
          )}
        </Paper>
      </Container>
    </>
  )
}
