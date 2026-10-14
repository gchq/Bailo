import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { putRelease, UpdateReleaseParams, useGetRelease } from 'actions/release'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import EditableRelease from 'src/entry/model/releases/EditableRelease'
import ReleaseAccessRequestReviewSummary from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import ReviewComments from 'src/reviews/ReviewComments'
import { ReviewKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

export default function Release() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const sendNotification = useNotification()

  const [isEdit, setIsEdit] = useState(false)
  const [putErrorMessage, setPutErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  async function handlePublishRelease() {
    if (!model || !release || !semver) {
      return
    }
    const updatedRelease: UpdateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: release.modelCardVersion,
      draft: false,
      notes: release.notes,
      fileIds: release.fileIds,
      images: release.images,
    }

    setIsLoading(true)

    const response = await putRelease(updatedRelease)

    if (!response.ok) {
      setPutErrorMessage(await getErrorMessage(response))
    } else {
      mutateRelease()
      sendNotification({ msg: 'Release successfully published.', variant: 'success' })
    }

    setIsLoading(false)
  }

  return (
    <>
      <Title text={release ? release.semver : 'Loading...'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper>
          <>
            <ReviewBanner release={release} />
            <DraftBanner
              text='This is a draft release'
              draft={release.draft}
              handlePublish={handlePublishRelease}
              showButton={true}
              disableButton={isEdit}
              isLoading={isLoading}
              errorMessage={putErrorMessage}
            />
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
              <ReleaseAccessRequestReviewSummary release={release} includeResponsesSummary={false} />
              {release &&
                (model?.settings.mirror?.sourceModelId ? (
                  <EditableRelease release={release} readOnly />
                ) : (
                  <EditableRelease
                    release={release}
                    readOnly={false}
                    isEdit={isEdit}
                    onIsEditChange={setIsEdit}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                ))}
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
