import { Box, Divider, Stack } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import Loading from 'src/common/Loading'
import ReleaseAssetsAccordion from 'src/entry/model/releases/ReleaseAssetsAccordion'
import ReleaseAssetsMainText from 'src/entry/model/releases/ReleaseAssetsMainText'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import ReviewFooter from 'src/entry/model/reviews/ReviewFooter'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface } from 'types/types'

export interface ReleaseDisplayProps {
  model: EntryInterface
  release: ReleaseInterface
  latestRelease?: string
  hideFileDownloads?: boolean
}

export default function ReleaseDisplay({ model, release, latestRelease, hideFileDownloads }: ReleaseDisplayProps) {
  const { isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isReleasesLoading) {
    return <Loading />
  }

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={4}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '100%' }}>
          {<ReviewBanner release={release} />}
          <Stack
            spacing={1}
            sx={{
              p: 2,
            }}
          >
            <ReleaseAssetsMainText model={model} release={release} latestRelease={latestRelease} />
            <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider />}</Box>
            <Stack spacing={1}>
              <ReleaseAssetsAccordion
                model={model}
                release={release}
                mode='interactive'
                hideFileDownloads={hideFileDownloads}
              />
              <ReviewFooter release={release} />
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </>
  )
}
