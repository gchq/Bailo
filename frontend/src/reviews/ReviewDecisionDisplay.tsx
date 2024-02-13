import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Card, Divider, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import { EntityKind } from 'types/types'
import { ReviewResponse } from 'types/v2/types'
import { formatDateString } from 'utils/dateUtils'

type ReviewDecisionDisplayProps = {
  response: ReviewResponse
}

export default function ReviewDecisionDisplay({ response }: ReviewDecisionDisplayProps) {
  const isApproved = useMemo(() => response.decision === 'approve', [response.decision])

  const username = response.user.split(':')[1]

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />{' '}
      <Card
        sx={{
          width: '100%',
          p: 1,
        }}
      >
        <Stack direction='row' spacing={1} alignItems='center' sx={{ width: '100%' }} justifyContent='space-between'>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Typography>
              <UserDisplay dn={username} />
              {` ${isApproved ? 'has approved' : 'has requested changes'}`}
            </Typography>
            {isApproved ? (
              <Done color='success' fontSize='small' />
            ) : (
              <HourglassEmpty color='warning' fontSize='small' />
            )}
          </Stack>
          <Typography fontWeight='bold'>{formatDateString(response.createdAt)}</Typography>
        </Stack>
        {response.comment && (
          <div>
            <Divider sx={{ my: 2 }} />
            <MarkdownDisplay>{response.comment}</MarkdownDisplay>
          </div>
        )}
      </Card>
    </Stack>
  )
}
