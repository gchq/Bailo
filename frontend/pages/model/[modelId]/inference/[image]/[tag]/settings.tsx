import { ArrowBack } from '@mui/icons-material'
import { Button, Card, Container, Divider, Link, Stack, Typography } from '@mui/material'
import { useGetInference } from 'actions/inferencing'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import EditableInference from 'src/model/inferencing/EditableInference'
import Wrapper from 'src/Wrapper'

export default function InferenceSettings() {
  const router = useRouter()
  const { modelId, image, tag }: { modelId?: string; image?: string; tag?: string } = router.query
  const [isEdit, setIsEdit] = useState(false)
  const { inference, isInferenceLoading, isInferenceError } = useGetInference(modelId, image, tag)

  if (!inference || isInferenceLoading) {
    return <Loading />
  }

  if (isInferenceError) {
    return <MessageAlert message={isInferenceError.info.message} severity='error' />
  }

  return (
    <Wrapper title={inference ? `${inference.image}:${inference.tag}` : 'Loading...'} page='inferencing' fullWidth>
      <Container maxWidth='md'>
        <Card sx={{ my: 4, p: 4 }}>
          <Stack spacing={2}>
            <Stack direction='row' spacing={2} divider={<Divider flexItem orientation='vertical' />}>
              <Link href={`/model/${modelId}?tab=inferencing`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to model
                </Button>
              </Link>
              <Typography variant='h6' component='h1' color='primary'>
                {inference ? `${inference.image}:${inference.tag}` : 'Loading...'}
              </Typography>
            </Stack>
            {inference && <EditableInference inference={inference} isEdit={isEdit} onIsEditChange={setIsEdit} />}
          </Stack>
        </Card>
      </Container>
    </Wrapper>
  )
}
