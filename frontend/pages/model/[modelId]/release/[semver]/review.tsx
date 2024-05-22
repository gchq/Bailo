import { ArrowBack } from '@mui/icons-material'
import { Box, Button, Container, Divider, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { useGetRelease, useGetReleasesForModelId } from 'actions/release'
import { postReviewResponse, useGetReviewRequestsForModel } from 'actions/review'
import { useGetUiConfig } from 'actions/uiConfig'
import Markdown from 'markdown-to-jsx'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewWithComment from 'src/common/ReviewWithComment'
import Title from 'src/common/Title'
import UserDisplay from 'src/common/UserDisplay'
import CodeLine from 'src/entry/model/registry/CodeLine'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { DecisionKeys } from 'types/types'
import { EntryKind } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

export default function ReleaseReview() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const [errorMessage, setErrorMessage] = useState('')

  const { model, isModelLoading, isModelError } = useGetModel(modelId, EntryKind.MODEL)
  const { release, isReleaseLoading, isReleaseError } = useGetRelease(modelId, semver)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { mutateReleases } = useGetReleasesForModelId(modelId)
  const { mutateReviews } = useGetReviewRequestsForModel({
    modelId,
    semver: `${semver}`,
  })

  async function handleSubmit(decision: DecisionKeys, comment: string, role: string) {
    setErrorMessage('')
    if (!modelId) {
      return setErrorMessage('Could not find model ID')
    }
    if (!semver) {
      return setErrorMessage('Could not find release semver')
    }

    const res = await postReviewResponse({
      modelId,
      role,
      comment,
      decision,
      semver,
    })

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      mutateReviews()
      mutateReleases()
      router.push(`/model/${modelId}/release/${semver}`)
    }
  }

  const releaseFiles = useMemo(() => {
    if (release && model) {
      return release.files.map((file) => (
        <Grid container spacing={1} alignItems='center' key={file._id}>
          <Grid item xs>
            <Tooltip title={file.name}>
              <Link href={`/api/v2/model/${model.id}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
                <Typography noWrap textOverflow='ellipsis' display='inline'>
                  {file.name}
                </Typography>
              </Link>
            </Tooltip>
          </Grid>
          <Grid item xs={1} textAlign='right'>
            <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
          </Grid>
        </Grid>
      ))
    }
  }, [model, release])

  const releaseImages = useMemo(() => {
    if (release && model) {
      return release.images.map((image) => (
        <Stack
          key={`${image.repository}-${image.name}-${image.tag}`}
          direction={{ sm: 'row', xs: 'column' }}
          justifyContent='space-between'
          alignItems='center'
          spacing={1}
        >
          {uiConfig && <CodeLine line={`${uiConfig.registry.host}/${model.id}/${image.name}:${image.tag}`} />}
        </Stack>
      ))
    }
  }, [release, model, uiConfig])

  if (!release || !model || !uiConfig || isReleaseLoading || isModelLoading || isUiConfigLoading) {
    return <Loading />
  }

  const error = MultipleErrorWrapper(`Unable to load release review page`, {
    isReleaseError,
    isModelError,
    isUiConfigError,
  })
  if (error) return error

  return (
    <>
      <Title text={semver ? semver : 'Loading...'} />
      <Container maxWidth='md' sx={{ my: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
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
              <Typography variant='h6' component='h1' color='primary'>
                {model ? `Reviewing release ${semver} for model ${model.name}` : 'Loading...'}
              </Typography>
            </Stack>
            <ReviewWithComment onSubmit={handleSubmit} release={release} />
            <MessageAlert message={errorMessage} severity='error' />
            <Divider />
            <Typography variant='caption' sx={{ mb: 2 }}>
              Created by {<UserDisplay dn={release.createdBy} />} on
              <Typography variant='caption' fontWeight='bold'>
                {` ${formatDateString(release.createdAt)}`}
              </Typography>
            </Typography>
            <Markdown>{release.notes}</Markdown>
            <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider />}</Box>
            <Stack spacing={1}>
              {release.files.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Files</Typography>
                  {releaseFiles}
                </>
              )}
              {release.images.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Docker images</Typography>
                  {releaseImages}
                </>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </>
  )
}
