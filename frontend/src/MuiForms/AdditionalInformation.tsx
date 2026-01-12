import { Box, Stack, Typography } from '@mui/material'
import { SxProps, useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import { ReactNode } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

interface AdditionalInformationProps {
  children: ReactNode
  sx?: SxProps
}

export default function AdditionalInformation({ children, sx }: AdditionalInformationProps) {
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
    <Box
      sx={{
        borderStyle: 'solid',
        borderWidth: 3,
        borderRadius: 1,
        borderColor: theme.palette.divider,
        py: 1,
        px: 2,
        my: 1,
        width: 'fit-content',
        ...sx,
      }}
    >
      <Stack spacing={1}>
        <Typography variant='caption' fontWeight='bold'>
          {uiConfig ? uiConfig.modelMirror.display.additionalInfoHeading : 'Additional information'}
        </Typography>
        <Typography>{children}</Typography>
      </Stack>
    </Box>
  )
}
