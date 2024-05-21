import { Undo } from '@mui/icons-material'
import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Card, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModelRoles } from 'actions/model'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import { Decision, EntityKind, ResponseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getRoleDisplay } from 'utils/roles'

type ReviewDecisionDisplayProps = {
  response: ResponseInterface
  modelId: string
}

export default function ReviewDecisionDisplay({ response, modelId }: ReviewDecisionDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const theme = useTheme()
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
                  {response.decision === Decision.Approve && ' has approved'}
                  {response.decision === Decision.RequestChanges && ' has requested changes'}
                  {response.decision === Decision.Undo && ' has undone their review'}
                </Typography>
                {response.decision === Decision.Approve && <Done color='success' fontSize='small' />}
                {response.decision === Decision.RequestChanges && <HourglassEmpty color='warning' fontSize='small' />}
                {response.decision === Decision.Undo && <Undo fontSize='small' />}
                {response.outdated && (
                  <Typography sx={{ backgroundColor: theme.palette.warning.light, borderRadius: 1, px: 0.5 }}>
                    Outdated
                  </Typography>
                )}
              </Stack>
              <Typography variant='caption'>
                as {getRoleDisplay(response.role || 'Error fetching model role', modelRoles)}
              </Typography>
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
