import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import UserAvatar from 'src/common/UserAvatar'
import { DecisionKeys } from 'types/interfaces'
import { EntityKind } from 'types/types'

type ReviewDecisionProps = {
  user: string
  decision: DecisionKeys
}

export default function ReviewDecision({ user, decision }: ReviewDecisionProps) {
  const theme = useTheme()

  const isApproved = useMemo(() => decision === 'approve', [decision])

  const username = user.split(':')[0]

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />{' '}
      <Box
        sx={{
          border: 'solid',
          borderWidth: '1px',
          borderColor: theme.palette.primary.main,
          borderRadius: 2,
          px: 1,
          py: 0.5,
          width: '100%',
        }}
      >
        <Stack direction='row' spacing={1} alignItems='center'>
          <Typography>
            <span style={{ fontWeight: 'bold' }}>{username}</span>
            {` has ${isApproved ? 'marked this as approved' : 'requested changes'}`}
          </Typography>
          {isApproved ? <Done color='success' fontSize='small' /> : <HourglassEmpty color='warning' fontSize='small' />}
        </Stack>
      </Box>
    </Stack>
  )
}
