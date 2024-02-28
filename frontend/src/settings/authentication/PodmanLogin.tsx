import { Visibility, VisibilityOff } from '@mui/icons-material'
import { DialogContent, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import CopyInputTextField from 'src/settings/authentication/CopyInputTextField'
import { TokenInterface } from 'types/v2/types'

type PodmanLoginProps = {
  token: TokenInterface
}
export default function PodmanLogin({ token }: PodmanLoginProps) {
  const theme = useTheme()
  const [showKeys, setShowKeys] = useState(false)
  const handleToggleKeyVisibility = () => {
    setShowKeys(!showKeys)
  }
  return (
    <DialogContent
      sx={{
        width: '600px',
        height: '400px',
        overflow: 'auto',
      }}
    >
      <Stack spacing={2} direction={{ xs: 'column' }}>
        <Typography fontWeight='bold'>1. Run Podman login:</Typography>
        <Typography>Enter the following command on the command line:</Typography>
        <Grid container spacing={0} alignItems='center'>
          {!token.secretKey && <Typography color={theme.palette.error.main}>Could not find Secret Key</Typography>}
          {token.secretKey && (
            <CopyInputTextField
              text={`podman login -u="${showKeys ? token.accessKey : 'xxxxxxxxxx'}" -p="${
                showKeys ? token.secretKey : 'xxxxxxxxxxxxxxxxxxxxx'
              }" <registry-url> `}
            />
          )}
          <Tooltip title={`${showKeys ? 'Hide' : 'Show'} keys`}>
            <IconButton
              onClick={handleToggleKeyVisibility}
              aria-label={`${showKeys ? 'Hide' : 'Show'} keys`}
              data-test='toggleKeyVisibilityButton'
            >
              {showKeys ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        </Grid>
      </Stack>
    </DialogContent>
  )
}
