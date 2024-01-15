import OrganisationIcon from '@mui/icons-material/Business'
import EmailIcon from '@mui/icons-material/Email'
import UserIcon from '@mui/icons-material/Person'
import { Box, Divider, Popover, Stack, Typography } from '@mui/material'
import { useGetUserInformation } from 'actions/user'
import { MouseEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

export interface UserInformation {
  name?: string
  organisation?: string
  email?: string
}

type UserDisplayProps = {
  dn: string
  hidePopover?: boolean
}

export default function UserDisplay({ dn, hidePopover = false }: UserDisplayProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = useMemo(() => !!anchorEl, [anchorEl])

  const { userInformation, isUserInformationLoading, isUserInformationError } = useGetUserInformation(
    dn.includes(':') ? dn.split(':')[1] : dn,
  )

  if (isUserInformationError) {
    return <MessageAlert message={isUserInformationError.info.message} severity='error' />
  }

  if (isUserInformationLoading || !userInformation) {
    return <Loading />
  }

  return (
    <>
      <Box
        component='span'
        aria-owns={open ? 'user-popover' : undefined}
        aria-haspopup='true'
        sx={{ fontWeight: 'bold' }}
        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)}
        onMouseLeave={() => setAnchorEl(null)}
      >
        {userInformation.name}
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
              <Typography color='primary' fontWeight='bold'>
                {userInformation.name}
              </Typography>
            </Stack>
            <Divider />
            <Stack direction='row' spacing={1}>
              <OrganisationIcon color='primary' />
              <Typography>
                <span style={{ fontWeight: 'bold' }}>Organisation</span>: {userInformation.organisation}
              </Typography>
            </Stack>
            <Stack direction='row' spacing={1}>
              <EmailIcon color='primary' />
              <Typography>
                <Box component='span' fontWeight='bold'>
                  Email
                </Box>
                : {userInformation.email}
              </Typography>
            </Stack>
          </Stack>
        </Popover>
      )}
    </>
  )
}
