import { Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'
import CodeSnippetActions from 'src/settings/authentication/CodeSnippetActions'

type CodeSnippetProps = {
  children: ReactNode
  fileName?: string
} & (
  | {
      disableVisibilityButton?: false
      showKeys: boolean
      onVisibilityChange: (showKeys: boolean) => void
    }
  | {
      disableVisibilityButton: true
      showKeys?: never
      onVisibilityChange?: never
    }
) &
  (
    | {
        disableCloseButton?: false
        onClose: () => void
      }
    | {
        disableCloseButton: true
        onClose?: never
      }
  )

export default function CodeSnippet({
  children,
  fileName = '',
  disableVisibilityButton = false,
  disableCloseButton = false,
  showKeys = false,
  onVisibilityChange = () => undefined,
  onClose = () => undefined,
}: CodeSnippetProps) {
  const theme = useTheme()

  return (
    <Stack
      direction='column'
      divider={<Divider />}
      sx={{
        backgroundColor: theme.palette.container.main,
        width: '100%',
      }}
    >
      {fileName && (
        <Stack
          direction='row'
          spacing={1}
          alignItems='center'
          justifyContent='space-between'
          sx={{
            pl: theme.spacing(2),
            pr: theme.spacing(1),
            py: theme.spacing(1),
          }}
        >
          <Typography variant='caption'>{fileName}</Typography>
          <CodeSnippetActions
            disableVisibilityButton={disableVisibilityButton}
            disableCloseButton={disableCloseButton}
            showKeys={showKeys}
            onVisibilityChange={() => onVisibilityChange(!showKeys)}
            onClose={onClose}
          />
        </Stack>
      )}
      <Stack
        direction='row'
        spacing={1}
        alignItems='flex-start'
        justifyContent='space-between'
        sx={{
          px: theme.spacing(2),
          py: theme.spacing(1),
        }}
      >
        <Typography
          sx={{
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
          }}
        >
          {children}
        </Typography>
        {!fileName && (
          <CodeSnippetActions
            disableVisibilityButton={disableVisibilityButton}
            disableCloseButton={disableCloseButton}
            showKeys={showKeys}
            onVisibilityChange={() => onVisibilityChange(!showKeys)}
            onClose={onClose}
          />
        )}
      </Stack>
    </Stack>
  )
}
