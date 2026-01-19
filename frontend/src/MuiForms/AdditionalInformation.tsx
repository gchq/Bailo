import { Box, Stack, Typography } from '@mui/material'
import { SxProps, useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import { ReactNode } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

interface AdditionalInformationProps {
  children: ReactNode
  editMode?: boolean
  display?: boolean
  required?: boolean
  mirroredState?: any
  label: string | undefined
  id: string
  sx?: SxProps
}

export default function AdditionalInformation({
  children,
  sx,
  editMode = false,
  display = false,
  required = false,
  id,
  label = '',
  mirroredState,
}: AdditionalInformationProps) {
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

  if (!display && !editMode) {
    return (
      <>
        <Typography
          fontWeight='bold'
          id={`${id}-label`}
          aria-label={`Label for ${label}`}
          component='label'
          htmlFor={id}
        >
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        {mirroredState ? (
          <Box>{mirroredState}</Box>
        ) : (
          <Typography
            sx={{
              fontStyle: 'italic',
              color: theme.palette.customTextInput.main,
            }}
          >
            Unanswered
          </Typography>
        )}
      </>
    )
  }

  return (
    <>
      {editMode && (
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
            {<>{children}</>}
          </Stack>
        </Box>
      )}
      {!editMode && (
        <Stack>
          <Typography
            fontWeight='bold'
            id={`${id}-label`}
            aria-label={`Label for ${label}`}
            component='label'
            htmlFor={id}
          >
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          {!mirroredState && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
          {mirroredState}
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
              {children}
            </Stack>
          </Box>
        </Stack>
      )}
    </>
  )
}
