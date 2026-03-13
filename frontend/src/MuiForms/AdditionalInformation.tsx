import { Box, Divider, Stack, Typography } from '@mui/material'
import { SxProps, useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import { ReactNode } from 'react'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import MessageAlert from 'src/MessageAlert'

interface AdditionalInformationProps {
  children: ReactNode
  editMode?: boolean
  display?: boolean
  required?: boolean
  mirroredModel?: boolean
  mirroredState?: any
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
      <Stack spacing={1}>
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
        {description && editMode && (
          <Typography variant='caption' color='textSecondary' fontWeight='bold'>
            {description}
          </Typography>
        )}
        {children}
      </Stack>
    )
  }

  const mirroredStateDisplay = () => {
    switch (typeof mirroredState) {
      case 'boolean':
        return mirroredState ? 'Yes' : 'No'
      case 'string':
        return <MarkdownDisplay>{mirroredState}</MarkdownDisplay>
      case 'number':
        return mirroredState as number
      default:
        return mirroredState
    }
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
        {(typeof mirroredState === 'boolean' && mirroredState !== undefined) || mirroredState ? (
          <Box sx={{ wordBreak: 'break-word' }}>{mirroredStateDisplay()}</Box>
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
              {description && <Typography variant='caption'>{description}</Typography>}
            </Stack>
            <Divider sx={{ mt: 1 }} />
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant='caption' fontWeight='bold'>
                {uiConfig ? uiConfig.modelMirror.import.originalAnswerHeading : 'Original answer'}
              </Typography>
              <Box>
                {mirroredState !== undefined ? (
                  <Box sx={{ color: theme.palette.customTextInput.main }}>{mirroredStateDisplay()}</Box>
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
              <Typography sx={{ pl: 4 }} variant='caption' fontWeight='bold'>
                {uiConfig ? uiConfig.modelMirror.import.additionalInfoHeading : 'Additional information'}
              </Typography>
              {<Box sx={{ pl: 4, pb: 2 }}>{children}</Box>}
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
            {mirroredState === undefined ? (
              <Typography
                sx={{
                  fontStyle: 'italic',
                  color: theme.palette.customTextInput.main,
                }}
              >
                Unanswered
              </Typography>
            ) : (
              <Box sx={{ wordBreak: 'break-word' }}>{mirroredStateDisplay()}</Box>
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
                    {uiConfig ? uiConfig.modelMirror.import.additionalInfoHeading : 'Additional information'}
                  </Typography>
                  {children}
                </Stack>
              </Box>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  )
}
