import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { useGetRelease } from 'actions/release'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableRelease from 'src/entry/model/releases/EditableRelease'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import ReviewFooter from 'src/entry/model/reviews/ReviewFooter'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import ReviewComments from 'src/reviews/ReviewComments'
import { ReviewKind } from 'types/types'

export default function Release() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)

  const { release, isReleaseLoading, isReleaseError, mutateRelease } = useGetRelease(modelId, semver)
  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(modelId)

  const error = MultipleErrorWrapper('Unable to load release', {
    isReleaseError,
    isModelError,
  })

  if (error) {
    return error
  }

  if (!release || !model || isReleaseLoading || isModelLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text={release ? release.semver : 'Loading...'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper>
          <>
            {<ReviewBanner release={release} />}
            <Stack spacing={2} sx={{ px: 4, py: 2 }}>
              <Stack
                direction={{ sm: 'row', xs: 'column' }}
                spacing={2}
                divider={<Divider flexItem orientation='vertical' />}
              >
                <Link href={`/model/${modelId}?tab=releases`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Stack
                  direction='row'
                  sx={{
                    overflow: 'hidden',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant='h6'
                    component='h1'
                    color='primary'
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {release ? release.semver : 'Loading...'}
                  </Typography>
                  <CopyToClipboardButton
                    textToCopy={release.semver}
                    notificationText='Copied release semver to clipboard'
                    ariaLabel='copy release semver to clipboard'
                  />
                </Stack>
              </Stack>
              <ReviewFooter release={release} />
              {release && (
                <EditableRelease
                  release={release}
                  isEdit={isEdit}
                  onIsEditChange={setIsEdit}
                  readOnly={!!model?.settings.mirror?.sourceModelId}
                />
              )}
              <ReviewComments
                identifier={release.semver}
                parentId={release._id}
                entryId={release.modelId}
                kind={ReviewKind.RELEASE}
                isEdit={isEdit}
                mutator={mutateRelease}
              />
            </Stack>
          </>
        </Paper>
      </Container>
    </>
  )
}
