import ReviewIcon from '@mui/icons-material/Comment'
import { Stack, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { AccessRequestInterface, ReleaseInterface } from '../../../types/types'

export type ReviewBannerProps =
  | {
      release: ReleaseInterface
      accessRequest?: never
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
    }

export default function ReviewBanner({ release, accessRequest }: ReviewBannerProps) {
  const theme = useTheme()
  const router = useRouter()

  const [modelId, urlParam, semverOrAcessRequestId] = useMemo(
    () =>
      release
        ? [release.modelId, 'release', release.semver, { release }]
        : [accessRequest.modelId, 'access-request', accessRequest.id, { accessRequest }],
    [release, accessRequest],
  )

  const handleReviewOnClick = () => {
    router.push(`/model/${modelId}/${urlParam}/${semverOrAcessRequestId}/review`)
  }

  return (
    <Paper
      sx={{
        color: 'white',
        backgroundColor: theme.palette.primary.main,
        py: 1,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: theme.palette.primary.main,
        borderRadius: 0,
      }}
    >
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        spacing={2}
        sx={{ px: 2, width: '100%' }}
      >
        <Stack direction='row' spacing={1}>
          <ReviewIcon />
          <Typography>Ready for review</Typography>
        </Stack>
        <Button variant='outlined' color='inherit' size='small' onClick={handleReviewOnClick} data-test='reviewButton'>
          Review
        </Button>
      </Stack>
    </Paper>
  )
}
