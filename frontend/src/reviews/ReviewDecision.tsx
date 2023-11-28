import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Card, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import UserAvatar from 'src/common/UserAvatar'
import { DecisionKeys } from 'types/interfaces'
import { EntityKind } from 'types/types'

type ReviewDecisionProps = {
  user: string
  decision: DecisionKeys
}

export default function ReviewDecision({ user, decision }: ReviewDecisionProps) {
  const isApproved = useMemo(() => decision === 'approve', [decision])

  const username = user.split(':')[0]

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />{' '}
      <Card
        sx={{
          width: '100%',
          p: 1,
        }}
        variant='outlined'
      >
        <Stack direction='row' spacing={1} alignItems='center'>
          <Typography>
            <Box component='span' fontWeight='bold'>
              {username}
            </Box>
            {` ${isApproved ? 'approved' : 'requested changes'}`}
          </Typography>
          {isApproved ? <Done color='success' fontSize='small' /> : <HourglassEmpty color='warning' fontSize='small' />}
        </Stack>
      </Card>
    </Stack>
  )
}
