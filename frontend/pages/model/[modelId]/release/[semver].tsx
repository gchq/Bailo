import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { putRelease, UpdateReleaseParams, useGetRelease } from 'actions/release'
import { useGetResponses } from 'actions/response'
import { postReviewResponse, useGetReviewRequestsForModel } from 'actions/review'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import ReviewPopper from 'src/common/ReviewPopper'
import Title from 'src/common/Title'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import EditableRelease from 'src/entry/model/releases/EditableRelease'
import ReleaseAccessRequestReviewSummary from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import ReviewComments from 'src/reviews/ReviewComments'
import { DecisionKeys, ReviewKind, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema } from 'utils/formUtils'

export default function Release() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const sendNotification = useNotification()

  const [isEdit, setIsEdit] = useState(false)
  const [putErrorMessage, setPutErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)
  const [reviewErrorMessage, setReviewErrorMessage] = useState('')

  const { release, isReleaseLoading, isReleaseError, mutateRelease } = useGetRelease(modelId, semver)
  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(modelId)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.card.schemaId || '')
  const { reviews, isReviewsLoading, isReviewsError, mutateReviews } = useGetReviewRequestsForModel({
    modelId: modelId as string,
    semver: `${semver}`,
  })
  const { mutateResponses } = useGetResponses([release ? release._id : '', ...reviews.map((review) => review._id)])
  const [reviewComment, setReviewComment] = useState('')

  const onSplitSchemaChange = useEffectEvent((newSplitSchema: SplitSchemaNoRender) => {
    setSplitSchema(newSplitSchema)
  })

  useEffect(() => {
    if (!model || !schema) {
      return
    }
    const steps = getStepsFromSchema(
      schema,
      {},
      ['properties.contacts'],
      model.card.metadata,
      model.mirroredCard?.metadata || {},
    )
    for (const step of steps) {
      step.steps = steps
    }
    onSplitSchemaChange({ reference: schema.id, steps })
  }, [schema, model])

  async function handleSubmitReleaseForReview() {
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
      sendNotification({ msg: 'Release successfully submitted for review.', variant: 'success' })
    }

    setIsLoading(false)
  }

  async function handleSubmitReview(decision: DecisionKeys, comment: string, role: string) {
    setReviewErrorMessage('')
    if (!modelId) {
      return setReviewErrorMessage('Could not find model ID')
    }
    if (!semver) {
      return setReviewErrorMessage('Could not find release semver')
    }

    setIsReviewButtonLoading(true)
    const res = await postReviewResponse({
      modelId,
      role,
      comment,
      decision,
      semver,
    })

    if (!res.ok) {
      setReviewErrorMessage(await getErrorMessage(res))
    } else {
      await Promise.all([mutateReviews(), mutateRelease(), mutateResponses()])
    }
    setIsReviewButtonLoading(false)
  }

  const error = MultipleErrorWrapper('Unable to load release', {
    isReleaseError,
    isModelError,
    isSchemaError,
    isReviewsError,
  })

  if (error) {
    return error
  }

  if (
    !release ||
    !model ||
    !schema ||
    !reviews ||
    isReleaseLoading ||
    isModelLoading ||
    isSchemaLoading ||
    isReviewsLoading
  ) {
    return <Loading />
  }

  return (
    <>
      <Title text={release ? release.semver : 'Loading...'} />
      <Container maxWidth='lg' data-test='releaseContainer'>
        <Paper>
          <>
            <DraftBanner
              text='This is a draft release'
              dialogTitle='Confirm release submission for review'
              draft={release.draft}
              handleSubmitForReview={handleSubmitReleaseForReview}
              showButton
              disableButton={isEdit}
              isLoading={isLoading}
              errorMessage={putErrorMessage}
              setErrorMessage={setPutErrorMessage}
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
              {!release.draft && (
                <Stack direction='row' sx={{ justifyContent: 'space-between' }} spacing={2}>
                  <ReleaseAccessRequestReviewSummary release={release} includeResponsesSummary={false} />
                  <ReviewPopper
                    reviews={reviews}
                    onSubmit={handleSubmitReview}
                    isLoading={isReviewButtonLoading}
                    errorMessage={reviewErrorMessage}
                    reviewComment={reviewComment}
                    onReviewCommentChange={(comment) => setReviewComment(comment)}
                  />
                </Stack>
              )}
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
              <Divider flexItem />
              <Typography sx={{ fontWeight: 'bold' }}>Model card version: {release.modelCardVersion}</Typography>
              <Box sx={{ width: '100%' }}>
                <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} />
              </Box>
              <Divider flexItem />
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
