import { Box, Divider, Stack, Typography } from '@mui/material'
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
  mirroredModel?: boolean
  mirroredState?: any
  state?: any
  label: string | undefined
  id: string
  sx?: SxProps
  description?: string
}

export default function AdditionalInformation({
  children,
  sx,
  editMode = false,
  display = false,
  required = false,
  mirroredModel = false,
  id,
  label = '',
  mirroredState,
  description = undefined,
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

  if (!mirroredModel) {
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
        {children}
        <Typography variant='caption' color='textSecondary' fontWeight='bold'>
          {description}
        </Typography>
      </>
    )
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
        {description && (
          <Typography variant='caption' color='textSecondary' fontWeight='bold'>
            {description}
          </Typography>
        )}
      </>
    )
  }

  return (
    <Stack>
      {editMode && (
        <Box
          sx={{
            ...sx,
          }}
        >
          <Box
            sx={{
              borderStyle: 'solid',
              borderWidth: 1,
              borderRadius: 1,
              borderColor: theme.palette.divider,
              py: 1,
              px: 2,
              width: 'auto',
            }}
          >
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
            <Divider sx={{ mt: 1 }} />
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant='caption' fontWeight='bold'>
                Original answer
              </Typography>
              <Box>
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
              </Box>
              <Typography variant='caption' fontWeight='bold'>
                {uiConfig ? uiConfig.modelMirror.display.additionalInfoHeading : 'Additional information'}
              </Typography>
              {<Box sx={{ pl: 4, pb: 2 }}>{children}</Box>}
              {description && (
                <Typography variant='caption' color='textSecondary' fontWeight='bold'>
                  {description}
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
      )}
      {!editMode && (
        <Stack spacing={2}>
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
            {!mirroredState ? (
              <Typography
                sx={{
                  fontStyle: 'italic',
                  color: theme.palette.customTextInput.main,
                }}
              >
                Unanswered
              </Typography>
            ) : (
              mirroredState
            )}
          </Stack>
          {children && (
            <Box>
              <Box
                sx={{
                  borderStyle: 'solid',
                  borderWidth: 1,
                  borderRadius: 1,
                  borderColor: theme.palette.divider,
                  py: 1,
                  px: 2,
                  ml: 4,
                  mb: 2,
                  ...sx,
                }}
              >
                <Stack spacing={1}>
                  <Typography variant='caption' fontWeight='bold'>
                    {uiConfig ? uiConfig.modelMirror.display.additionalInfoHeading : 'Additional information'}
                  </Typography>
                  {children}
                </Stack>
                {description && <Typography variant='caption'>{description}</Typography>}
              </Box>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  )
}
