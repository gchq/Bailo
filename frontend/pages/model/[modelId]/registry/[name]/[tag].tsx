import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetEntry, useGetModelImages } from 'actions/entry'
import { useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel, useGetReviewRequestsForUser } from 'actions/review'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableRelease from 'src/entry/model/releases/EditableRelease'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ReviewComments from 'src/reviews/ReviewComments'
import { EntryKind } from 'types/types'
import { getCurrentUserRoles, hasRole } from 'utils/roles'

export default function ImageTagInformation() {
  const router = useRouter()
  const { modelId, name, tag }: { modelId?: string; name?: string; tag?: string } = router.query

  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(modelId)

  const modelImage = modelImages.filter((image) => image.name === name)
  console.log(modelImage)

  if (isModelImagesError) {
    return <MessageAlert message={isModelImagesError.info.message} severity='error' />
  }

  if (isModelImagesLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text={name && tag ? `${name}:${tag}` : 'Loading...'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper sx={{ p: 4 }}>
          <Stack
            direction={{ sm: 'row', xs: 'column' }}
            spacing={2}
            divider={<Divider flexItem orientation='vertical' />}
          >
            <Link href={`/model/${modelId}?tab=registry`}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                Back to model
              </Button>
            </Link>
            <Stack overflow='hidden' direction='row' alignItems='center'>
              <Typography overflow='hidden' textOverflow='ellipsis' variant='h6' component='h1' color='primary'>
                {name && tag ? `${name}:${tag}` : 'Loading...'}
              </Typography>
              <CopyToClipboardButton
                textToCopy={''}
                notificationText='Copied image name and tag to clipboard'
                ariaLabel='copy image name and tag to clipboard'
              />
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </>
  )
}
