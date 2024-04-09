import { Visibility, VisibilityOff } from '@mui/icons-material'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
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
  const [isObfuscated, setIsObfuscated] = useState(true)
  const [text, setText] = useState(command)

  const getFullCommand = () => {
    let updatedText = text.replaceAll(TokenValueKind.ACCESS_KEY, token.accessKey)
    updatedText = updatedText.replaceAll(TokenValueKind.SECRET_KEY, token.secretKey)

    return updatedText
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
      <CopyToClipboardButton
        textToCopy={getFullCommand()}
        notificationText='Copied command to clipboard'
        ariaLabel='copy command to clipboard'
      />
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
