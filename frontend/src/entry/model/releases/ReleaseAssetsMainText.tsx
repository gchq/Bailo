import { Button, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { EntryInterface, ReleaseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

export interface ReleaseAssetsMainTextProps {
  model: EntryInterface
  release: ReleaseInterface
  latestRelease?: string
  hideCopySemver?: boolean
  hideDescription?: boolean
  includeLinks?: boolean
}

export default function ReleaseAssetsMainText({
  model,
  release,
  latestRelease,
  hideCopySemver = false,
  hideDescription = false,
  includeLinks = true,
}: ReleaseAssetsMainTextProps) {
  const router = useRouter()

  function latestVersionAdornment() {
    if (release.semver === latestRelease) {
      return <Typography color='secondary'>(Latest)</Typography>
    }
  }

  return (
    <>
      <Stack direction={{ sm: 'row', xs: 'column' }} justifyContent='space-between' alignItems='center' spacing={2}>
        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          justifyContent='space-between'
          alignItems='center'
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <Link inert={!includeLinks} noLinkStyle href={`/model/${model.id}/release/${release.semver}`} noWrap>
            <Stack direction='row' alignItems='center' spacing={1} width='100%'>
              <Typography component='h2' variant='h6' color='primary' noWrap>
                {release.semver}
              </Typography>
            </Stack>
          </Link>
          {!hideCopySemver && (
            <CopyToClipboardButton
              textToCopy={release.semver}
              notificationText='Copied release semver to clipboard'
              ariaLabel='copy release semver to clipboard'
            />
          )}
          {latestVersionAdornment()}
        </Stack>
        {includeLinks && (
          <Button onClick={() => router.push(`/model/${model.id}/history/${release.modelCardVersion}`)}>
            View Model Card
          </Button>
        )}
      </Stack>
      <Stack direction='row' alignItems='center' spacing={0.5}>
        <Typography variant='caption' sx={{ mb: 2 }}>
          Created by
        </Typography>
        <UserDisplay dn={release.createdBy} />
        <Typography variant='caption' sx={{ mb: 2 }}>
          on
        </Typography>
        <Typography variant='caption' fontWeight='bold'>
          {` ${formatDateString(release.createdAt)}`}
        </Typography>
      </Stack>
      {!hideDescription && <MarkdownDisplay>{release.notes}</MarkdownDisplay>}
    </>
  )
}
