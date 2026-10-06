import EmailIcon from '@mui/icons-material/Email'
import Error from '@mui/icons-material/Error'
import Label from '@mui/icons-material/Label'
import UserIcon from '@mui/icons-material/Person'
import { Box, Divider, Popover, Stack, Typography } from '@mui/material'
import { useGetUserInformation } from 'actions/user'
import { MouseEvent, useMemo, useRef, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import UserAvatar from 'src/common/UserAvatar'
import EntityIcon from 'src/entry/EntityIcon'
import { EntityKind } from 'types/types'

export type UserInformation = {
  name?: string
  email?: string
} & AdditionalProperties

interface AdditionalProperties {
  [x: string]: string
}

export type UserDisplayProps = {
  dn: string
  hidePopover?: boolean
  displayAsAvatar?: boolean
  showIcon?: boolean
  fontWeight?: string
}

export default function UserDisplay({
  dn,
  hidePopover = false,
  displayAsAvatar = false,
  showIcon = false,
  fontWeight = '500',
}: UserDisplayProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = useMemo(() => !!anchorEl, [anchorEl])
  const ref = useRef<HTMLDivElement>(null)
  const { userInformation, isUserInformationLoading, isUserInformationError } = useGetUserInformation(
    dn.includes(':') ? dn.split(':')[1] : dn,
  )

  const popoverEnter = () => {
    if (ref.current) {
      setAnchorEl(ref.current)
    }
  }

  const popoverLeave = () => {
    setAnchorEl(null)
  }

  if (isUserInformationLoading) {
    return <Loading />
  }

  return (
    <>
      {displayAsAvatar}
      <Box
        component='span'
        ref={ref}
        data-test='userDisplayName'
        aria-owns={open ? 'user-popover' : undefined}
        aria-haspopup='true'
        onMouseEnter={(e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
        onMouseLeave={() => setAnchorEl(null)}
        sx={{
          fontWeight: 'bold',
        }}
      >
        {displayAsAvatar ? (
          <UserAvatar
            entity={{ kind: (dn.split(':')[0] as EntityKind) || EntityKind.USER, id: dn.split(':')[1] || dn }}
          />
        ) : (
          <>
            {userInformation ? (
              <Stack
                direction='row'
                spacing={1}
                sx={{
                  alignItems: 'center',
                }}
              >
                {showIcon && (
                  <EntityIcon
                    entryCollaborator={{
                      entity: dn,
                      roles: [],
                    }}
                  />
                )}
                <Typography sx={{ fontWeight }}>{userInformation.name}</Typography>
              </Stack>
            ) : (
              <Stack
                direction='row'
                spacing={1}
                sx={{
                  alignItems: 'center',
                }}
              >
                {showIcon && <Error color='error' />}
                <Typography color='error'>Unknown User/Group</Typography>
              </Stack>
            )}
          </>
        )}
      </Box>
      {!hidePopover && (
        <Popover
          id='user-popover'
          sx={{
            pointerEvents: 'none',
          }}
          slotProps={{
            paper: { onMouseEnter: popoverEnter, onMouseLeave: popoverLeave, sx: { pointerEvents: 'auto' } },
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
            <Stack
              direction='row'
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <UserIcon color='primary' />
              <Typography
                color='primary'
                data-test='userDisplayNameProperty'
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {userInformation ? userInformation.name : dn.charAt(0).toUpperCase() + dn.slice(1)}
              </Typography>
            </Stack>
            <Divider />
            {!userInformation && isUserInformationError && (
              <Typography>{isUserInformationError.info.message}</Typography>
            )}
            {userInformation && (
              <>
                <Stack
                  direction='row'
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                  }}
                >
                  <EmailIcon color='primary' />
                  <Typography data-test='userDisplayEmailProperty'>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 'bold',
                      }}
                    >
                      Email
                    </Box>
                    : {userInformation.email}
                  </Typography>
                  <CopyToClipboardButton
                    textToCopy={userInformation.email ? userInformation.email : ''}
                    notificationText='Copied email address to clipboard'
                    ariaLabel='copy email address to clipboard'
                  />
                </Stack>
                {Object.keys(userInformation).map((key) => {
                  if (key !== 'name' && key !== 'email') {
                    return (
                      <Stack direction='row' spacing={1} key={key}>
                        <Label color='primary' />
                        <Typography data-test={`userDisplayDynamicProperty-${key}`}>
                          <Box
                            component='span'
                            sx={{
                              fontWeight: 'bold',
                            }}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Box>
                          : {userInformation[key]}
                        </Typography>
                      </Stack>
                    )
                  }
                })}
              </>
            )}
          </Stack>
        </Popover>
      )}
    </>
  )
}
