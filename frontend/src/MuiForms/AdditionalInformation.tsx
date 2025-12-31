import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import { ReactNode } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

interface AdditionalInformationProps {
  children: ReactNode
}

export default function AdditionalInformation({ children }: AdditionalInformationProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const theme = useTheme()

  if (children === undefined || (Array.isArray(children) && children.length === 0)) {
    return <></>
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading) {
    return <Loading />
  }

  return (
    <Box sx={{ borderStyle: 'solid', borderWidth: 1, borderRadius: 1, borderColor: theme.palette.divider, p: 1, m: 2 }}>
      <Stack spacing={1}>
        <Typography variant='caption' fontWeight='bold'>
          {uiConfig ? uiConfig.modelMirror.display.additionalInfoHeading : 'Additional information'}
        </Typography>
        <Typography>{children}</Typography>
      </Stack>
    </Box>
  )
}
