import { Box, Divider, Stack, Typography } from '@mui/material'
import { SxProps, useTheme } from '@mui/material/styles'
import { ReactNode, useContext } from 'react'
import ExpandableTypography from 'src/common/ExpandableTypography'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UiConfigContext from 'src/contexts/uiConfigContext'

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
  const uiConfig = useContext(UiConfigContext)
  const theme = useTheme()

  if (children === undefined || (Array.isArray(children) && children.length === 0)) {
    return <></>
  }

  if (!mirroredModel) {
    return (
      <Stack spacing={1}>
        <Typography
          id={`${id}-label`}
          aria-label={`Label for ${label}`}
          component='label'
          htmlFor={id}
          sx={{
            fontWeight: 'bold',
          }}
        >
          {label}
          {required && editMode && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        {description && editMode && (
          <ExpandableTypography sx={{ whiteSpace: 'pre-wrap' }}>{description}</ExpandableTypography>
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
          id={`${id}-label`}
          aria-label={`Label for ${label}`}
          component='label'
          htmlFor={id}
          sx={{
            fontWeight: 'bold',
          }}
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
                id={`${id}-label`}
                aria-label={`Label for ${label}`}
                component='label'
                htmlFor={id}
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {label}
                {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
              </Typography>
              {description && (
                <ExpandableTypography variant='caption' sx={{ whiteSpace: 'pre-wrap' }}>
                  {description}
                </ExpandableTypography>
              )}
            </Stack>
            <Divider sx={{ mt: 1 }} />
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {uiConfig.modelMirror.import.originalAnswerHeading}
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
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 'bold',
                  pl: 4,
                }}
              >
                {uiConfig.modelMirror.import.additionalInfoHeading}
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
              id={`${id}-label`}
              aria-label={`Label for ${label}`}
              component='label'
              htmlFor={id}
              sx={{
                fontWeight: 'bold',
              }}
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
                  <Typography
                    variant='caption'
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    {uiConfig.modelMirror.import.additionalInfoHeading}
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
