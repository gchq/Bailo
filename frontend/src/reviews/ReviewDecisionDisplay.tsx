import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Card, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModelRoles } from 'actions/model'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntityKind, ReviewResponse } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getRoleDisplay } from 'utils/roles'

type ReviewDecisionDisplayProps = {
  response: ReviewResponse
  modelId: string
}

export default function ReviewDecisionDisplay({ response, modelId }: ReviewDecisionDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const theme = useTheme()
  const isApproved = useMemo(() => response.decision === 'approve', [response.decision])
  const username = response.user.split(':')[1]

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack direction='row' spacing={2} alignItems='center'>
        <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />{' '}
        <Card
          sx={{
            width: '100%',
            p: 1,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems='center'
            sx={{ width: '100%' }}
            justifyContent='space-between'
          >
            <Stack alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
                <Typography>
                  <UserDisplay dn={username} />
                  {` ${isApproved ? 'has approved' : 'has requested changes'}`}
                </Typography>
                {isApproved ? (
                  <Done color='success' fontSize='small' />
                ) : (
                  <HourglassEmpty color='warning' fontSize='small' />
                )}
                {response.outdated && (
                  <Typography sx={{ backgroundColor: theme.palette.warning.light, borderRadius: 1, px: 0.5 }}>
                    Outdated
                  </Typography>
                )}
              </Stack>
              <Typography variant='caption'>as {getRoleDisplay(response.role, modelRoles)}</Typography>
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
    </>
  )
}
