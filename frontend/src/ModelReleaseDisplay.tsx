import { Close, Done, HourglassEmpty } from '@mui/icons-material'
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { green, orange, red } from '@mui/material/colors'
import { useTheme } from '@mui/material/styles'
import { ApprovalStates } from 'types/types'

import Link from './Link'

export default function ModelReleaseDisplay({
  modelUuid,
  release,
  latestRelease,
}: {
  modelUuid: string
  release: any
  latestRelease: string
}) {
  const theme = useTheme()

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  function approvalStatus(status: ApprovalStates, label: string) {
    switch (status) {
      case ApprovalStates.Accepted:
        return (
          <Tooltip title={`${label} has approved this release`}>
            <Done htmlColor={green[500]} />
          </Tooltip>
        )
      case ApprovalStates.NoResponse:
        return (
          <Tooltip title={`${label} has not reviewed this release`}>
            <HourglassEmpty htmlColor={orange[500]} />
          </Tooltip>
        )
      case ApprovalStates.Declined:
        return (
          <Tooltip title={`${label} has declined this release`}>
            <Close htmlColor={red[500]} />
          </Tooltip>
        )
    }
  }

  function latestVersionAdornment() {
    if (release.semver === latestRelease) {
      return <Typography color='secondary'>(Latest)</Typography>
    }
  }

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Box
          sx={{
            border: 'solid 2px',
            borderRadius: 4,
            padding: 2,
            borderColor: theme.palette.primary.main,
            width: '100%',
          }}
        >
          <Stack spacing={2}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2}>
              <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={1}>
                <Typography variant='h6' color='primary'>
                  {release.name}
                </Typography>
                <Divider orientation='vertical' flexItem />
                <Typography color='secondary'>{release.semver}</Typography>
                {latestVersionAdornment()}
                <Divider orientation='vertical' flexItem />
                <Stack direction='row'>
                  {approvalStatus(release.managerApproved, 'Manager')}
                  {approvalStatus(release.reviewerApproved, 'Technical Reviewer')}
                </Stack>
              </Stack>

              <Link href={`/beta/model/${modelUuid}?release=${release.semver}`}>Model Card</Link>
            </Stack>
            <Stack spacing={1} direction='row' sx={{ mt: '0px !important' }}>
              <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                {formatDate(release.timestamp)}
              </Typography>
              <Typography variant='caption'>Joe Blogs</Typography>
            </Stack>
            <Typography variant='body1'>{release.notes}</Typography>
            <Divider />
            <Stack spacing={0}>
              {release.files.map((file) => (
                <Stack key={file.name} direction='row' justifyContent='space-between' alignItems='center' spacing={2}>
                  <Link href='/beta'>{file.name}</Link>
                  <Typography variant='caption'>{file.size}</Typography>
                </Stack>
              ))}
              {release.images.map((image) => (
                <Stack key={image.ref} direction='row' justifyContent='space-between' alignItems='center' spacing={2}>
                  <Link href='/beta'>{image.ref}</Link>
                  <Typography variant='caption'>{image.size}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </>
  )
}
