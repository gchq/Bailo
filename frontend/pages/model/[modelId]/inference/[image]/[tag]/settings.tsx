import { ArrowBack } from '@mui/icons-material'
import { Button, Card, Container, Divider, Link, Stack, Typography } from '@mui/material'
import { useGetInference } from 'actions/inferencing'
import { useGetModel } from 'actions/model'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableInference from 'src/entry/model/inferencing/EditableInference'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { EntryKind } from 'types/types'
import { getCurrentUserRoles } from 'utils/roles'

export default function InferenceSettings() {
  const router = useRouter()
  const { modelId, image, tag }: { modelId?: string; image?: string; tag?: string } = router.query
  const { inference, isInferenceLoading, isInferenceError } = useGetInference(modelId, image, tag)
  const { model, isModelLoading, isModelError } = useGetModel(modelId, EntryKind.MODEL)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const currentUserRoles = useMemo(() => getCurrentUserRoles(model, currentUser), [model, currentUser])

  const error = MultipleErrorWrapper(`Unable to load inference settings page`, {
    isInferenceError,
    isModelError,
    isCurrentUserError,
  })
  if (error) return error

  return (
    <>
      <Title text={inference ? `${inference.image}:${inference.tag}` : 'Loading...'} />
      {!inference || isInferenceLoading || isModelLoading || isCurrentUserLoading ? (
        <Loading />
      ) : (
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
              {inference && <EditableInference inference={inference} currentUserRoles={currentUserRoles} />}
            </Stack>
          </Card>
        </Container>
      )}
    </>
  )
}
