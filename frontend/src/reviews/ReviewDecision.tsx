import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Card, Stack, Typography } from '@mui/material'
import { useGetIdentity } from 'actions/user'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import UserAvatar from 'src/common/UserAvatar'
import MessageAlert from 'src/MessageAlert'
import { DecisionKeys } from 'types/interfaces'

type ReviewDecisionProps = {
  user: string
  decision: DecisionKeys
}

export default function ReviewDecision({ user, decision }: ReviewDecisionProps) {
  const isApproved = useMemo(() => decision === 'approve', [decision])

  const { entity, isEntityLoading, isEntityError } = useGetIdentity(user || '')

  if (isEntityError) {
    return <MessageAlert message={isEntityError.info.message} severity='error' />
  }

  return (
    <>
      {isEntityLoading && <Loading />}
      <Stack direction='row' spacing={2} alignItems='center'>
        <UserAvatar entityDn={entity} size='chip' />{' '}
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
                {entity}
              </Box>
              {` ${isApproved ? 'approved' : 'requested changes'}`}
            </Typography>
            {isApproved ? (
              <Done color='success' fontSize='small' />
            ) : (
              <HourglassEmpty color='warning' fontSize='small' />
            )}
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
