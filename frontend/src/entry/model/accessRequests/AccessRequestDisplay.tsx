import { Box, Card, Grid, Stack, Typography } from '@mui/material'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import UserDisplay from 'src/common/UserDisplay'
import ReleaseAccessRequestReviewSummary from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import Link from 'src/Link'
import { AccessRequestInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type AccessRequestDisplayProps = {
  accessRequest: AccessRequestInterface
}

export default function AccessRequestDisplay({ accessRequest }: AccessRequestDisplayProps) {
  return (
    <>
      <Stack
        direction='row'
        spacing={4}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '100%' }}>
          <ReviewBanner accessRequest={accessRequest} />
          <Stack
            sx={{
              p: 2,
            }}
          >
            <Stack
              direction='row'
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <Link
                sx={{ overflow: 'hidden' }}
                href={`/model/${accessRequest.modelId}/access-request/${accessRequest.id}`}
              >
                <Typography
                  component='h2'
                  variant='h6'
                  color='primary'
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {accessRequest.metadata.overview.name}
                </Typography>
              </Link>
              <CopyToClipboardButton
                textToCopy={accessRequest.id}
                notificationText='Copied access request ID to clipboard'
                ariaLabel='copy access request ID to clipboard'
              />
            </Stack>
            <Stack
              spacing={1}
              direction='row'
              sx={{
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant='caption'>
                Created by {<UserDisplay dn={accessRequest.createdBy} />} on
                <Typography
                  variant='caption'
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  {` ${formatDateString(accessRequest.createdAt)} `}
                </Typography>
              </Typography>
              {accessRequest.metadata.overview.endDate && (
                <Typography variant='caption'>
                  End Date:
                  <Typography
                    variant='caption'
                    data-test='accessRequestEndDate'
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    {` ${formatDateString(accessRequest.metadata.overview.endDate)}`}
                  </Typography>
                </Typography>
              )}
            </Stack>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={4}
              sx={{
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <Card
                sx={{
                  px: 2,
                  pt: 1,
                  pb: 2,
                  width: '100%',
                }}
              >
                <Typography
                  variant='subtitle2'
                  component='h3'
                  sx={{
                    mb: 1,
                  }}
                >
                  Users
                </Typography>
                <Grid container>
                  {accessRequest.metadata.overview.entities.map((entity) => (
                    <Grid size={{ xs: 3 }} key={entity}>
                      <UserDisplay dn={entity} />
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Stack>
            <ReleaseAccessRequestReviewSummary accessRequest={accessRequest} />
          </Stack>
        </Box>
      </Stack>
    </>
  )
}
