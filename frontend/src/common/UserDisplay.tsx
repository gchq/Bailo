import EmailIcon from '@mui/icons-material/Email'
import UserIcon from '@mui/icons-material/Person'
import { Box, Divider, Popover, Stack, Typography } from '@mui/material'
import { useListUsers } from 'actions/user'
import { MouseEvent, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import { EntityObject } from 'types/v2/types'

type ConditionalUserDisplayProps =
  | {
      entityId?: string
      entity?: never
    }
  | {
      entityId?: never
      entity?: EntityObject
    }

type CommonUserDisplayProps = {
  hidePopover?: boolean
}

type UserDisplayProps = CommonUserDisplayProps & ConditionalUserDisplayProps

export default function UserDisplay({ entity, entityId, hidePopover = false }: UserDisplayProps) {
  const [user, setUser] = useState<EntityObject | undefined>(entity || undefined)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)

  const { users, isUsersLoading } = useListUsers(entityId ? entityId : '')

  useEffect(() => {
    if (!user && users) {
      setUser(users.find((userFromList) => userFromList.id === entityId))
    }
  }, [entityId, users, user])

  return (
    <>
      {isUsersLoading && <Loading />}
      {!isUsersLoading && user && (
        <>
          <Box
            component='span'
            aria-owns={open ? 'user-popover' : undefined}
            aria-haspopup='true'
            sx={{ fontWeight: 'bold' }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)}
            onMouseLeave={() => setAnchorEl(null)}
          >
            {user.id}
          </Box>
          {!hidePopover && (
            <Popover
              id='user-popover'
              sx={{
                pointerEvents: 'none',
              }}
              open={open}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              onClose={() => setAnchorEl(null)}
              disableRestoreFocus
            >
              <Stack spacing={1} sx={{ p: 2 }}>
                <Stack direction='row' alignItems='center' spacing={1}>
                  <UserIcon color='primary' />
                  <Typography variant='h6' color='primary' fontWeight='bold'>
                    {user.id}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction='row' spacing={1} justifyContent='center'>
                  <EmailIcon color='primary' />
                  <Typography>
                    <span style={{ fontWeight: 'bold' }}>Email</span>: example@example.com
                  </Typography>
                </Stack>
              </Stack>
            </Popover>
          )}
        </>
      )}
    </>
  )
}
