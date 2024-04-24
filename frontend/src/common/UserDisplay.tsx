import { Label } from '@mui/icons-material'
import EmailIcon from '@mui/icons-material/Email'
import UserIcon from '@mui/icons-material/Person'
import { Box, Divider, Popover, Stack, Typography } from '@mui/material'
import { useGetUserInformation } from 'actions/user'
import { MouseEvent, useMemo, useRef, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'

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
}

export default function UserDisplay({ dn, hidePopover = false }: UserDisplayProps) {
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
      <Box
        component='span'
        ref={ref}
        data-test='userDisplayName'
        aria-owns={open ? 'user-popover' : undefined}
        aria-haspopup='true'
        sx={{ fontWeight: 'bold' }}
        onMouseEnter={(e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
        onMouseLeave={() => setAnchorEl(null)}
      >
        {userInformation ? userInformation.name : dn.charAt(0).toUpperCase() + dn.slice(1)}
      </Box>
      {!hidePopover && (
        <Popover
          id='user-popover'
          sx={{
            pointerEvents: 'none',
          }}
          PaperProps={{ onMouseEnter: popoverEnter, onMouseLeave: popoverLeave, sx: { pointerEvents: 'auto' } }}
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
              <Typography color='primary' fontWeight='bold' data-test='userDisplayNameProperty'>
                {userInformation ? userInformation.name : dn.charAt(0).toUpperCase() + dn.slice(1)}
              </Typography>
            </Stack>
            <Divider />
            {!userInformation && isUserInformationError && (
              <Typography>{isUserInformationError.info.message}</Typography>
            )}
            {userInformation && (
              <>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <EmailIcon color='primary' />
                  <Typography data-test='userDisplayEmailProperty'>
                    <Box component='span' fontWeight='bold'>
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
                          <Box component='span' fontWeight='bold'>
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
