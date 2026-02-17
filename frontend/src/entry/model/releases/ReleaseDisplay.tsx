import { Box, Divider, Stack } from '@mui/material'
import { useGetFileScannerInfo } from 'actions/fileScanning'
import { useGetReleasesForModelId } from 'actions/release'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import ReleaseAssetsAccordion from 'src/entry/model/releases/ReleaseAssetsAccordion'
import ReleaseAssetsMainText from 'src/entry/model/releases/ReleaseAssetsMainText'
import ReleaseAssetsResponses from 'src/entry/model/releases/ReleaseAssetsResponses'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { EntryInterface, ReleaseInterface } from 'types/types'

export interface ReleaseDisplayProps {
  model: EntryInterface
  release: ReleaseInterface
  latestRelease?: string
  hideReviewBanner?: boolean
  hideFileDownloads?: boolean
}

export default function ReleaseDisplay({
  model,
  release,
  latestRelease,
  hideReviewBanner = false,
  hideFileDownloads,
}: ReleaseDisplayProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: model.id,
    semver: release.semver,
  })

  const { isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const { isScannersLoading, isScannersError } = useGetFileScannerInfo()
  const { isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const error = MultipleErrorWrapper('Unable to load release', {
    isScannersError,
    isReviewsError,
    isUiConfigError,
    isReleasesError,
  })
  if (error) {
    return error
  }

  if (isReviewsLoading || isReleasesLoading || isUiConfigLoading || isScannersLoading) {
    return <Loading />
  }

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Box sx={{ width: '100%' }}>
          {reviews.length > 0 && !hideReviewBanner && <ReviewBanner release={release} />}
          <Stack spacing={1} p={2}>
            <ReleaseAssetsMainText model={model} release={release} latestRelease={latestRelease} />
            <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider />}</Box>
            <Stack spacing={1}>
              <ReleaseAssetsAccordion
                model={model}
                release={release}
                mode='interactive'
                hideFileDownloads={hideFileDownloads}
              />
              <ReleaseAssetsResponses model={model} release={release} />
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </>
  )
}
