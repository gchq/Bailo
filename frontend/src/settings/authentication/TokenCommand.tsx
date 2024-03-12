import { ContentCopy, Visibility, VisibilityOff } from '@mui/icons-material'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import useNotification from 'src/hooks/useNotification'
import { TokenInterface } from 'types/types'

type TokenCommandProps = {
  token: TokenInterface
  command: string
  disableVisibilityToggle?: boolean
}

export const TokenValueKind = {
  ACCESS_KEY: '<access-key>',
  SECRET_KEY: '<secret-key>',
} as const

export type TokenValueKindKeys = (typeof TokenValueKind)[keyof typeof TokenValueKind]

export default function TokenCommand({ token, command, disableVisibilityToggle = false }: TokenCommandProps) {
  const theme = useTheme()
  const sendNotification = useNotification()
  const [isObfuscated, setIsObfuscated] = useState(true)
  const [text, setText] = useState(command)

  const getFullCommand = () => {
    let updatedText = text.replaceAll(TokenValueKind.ACCESS_KEY, token.accessKey)
    updatedText = updatedText.replaceAll(TokenValueKind.SECRET_KEY, token.secretKey)

    return updatedText
  }

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(getFullCommand())
    sendNotification({
      variant: 'success',
      msg: 'Copied command to clipboard',
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    })
  }

  const handleToggleKeyVisibility = () => {
    if (isObfuscated) {
      setText(getFullCommand())
    } else {
      setText(command)
    }
    setIsObfuscated(!isObfuscated)
  }

  return (
    <Stack direction='row' spacing={1}>
      <Box
        sx={{
          backgroundColor: theme.palette.container.main,
          px: 2,
          py: 1,
          display: 'flex',
        }}
      >
        <Typography sx={{ mx: 'auto' }} data-test='commandText'>
          {text}
        </Typography>
      </Box>
      <Tooltip title='Copy to clipboard'>
        <IconButton color='primary' onClick={handleCopyCommand} aria-label='copy command key to clipboard'>
          <ContentCopy />
        </IconButton>
      </Tooltip>
      {!disableVisibilityToggle && (
        <Tooltip title={`${isObfuscated ? 'Show' : 'Hide'} keys`}>
          <IconButton
            color='primary'
            onClick={handleToggleKeyVisibility}
            aria-label={`${isObfuscated ? 'Show' : 'Hide'} keys`}
            data-test='toggleKeysButton'
          >
            {isObfuscated ? <Visibility /> : <VisibilityOff />}
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}
