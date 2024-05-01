import { Box, Stack, Typography } from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { CSSProperties, ReactElement } from 'react'

interface ExpandableButtonProps {
  label: string
  icon: ReactElement
  onClick: () => void
  ariaLabel: string
  height?: CSSProperties['height']
  initialMaxWidth?: CSSProperties['maxWidth']
  onHoverMaxWidth?: CSSProperties['maxWidth']
}

export default function ExpandableButton({
  label,
  icon,
  onClick,
  ariaLabel,
  height = 'unset',
  initialMaxWidth = '52px',
  onHoverMaxWidth = '350px',
}: ExpandableButtonProps) {
  const theme = useTheme()

  const StyledButton = styled('button')({
    maxWidth: initialMaxWidth,
    webkitTransition: 'max-width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    transition: 'max-width 0.5s',
    alignItems: 'center',
    overflow: 'hidden',
    color: theme.palette.common.white,
    borderStyle: 'none',
    // This is to align button padding with FireFox and Chrome
    paddingLeft: '6px',
    paddingRight: '6px',
    paddingTop: '1px',
    paddingBottom: '1px',
    borderRadius: 3,
    cursor: 'pointer',
    height: height,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover, &:focus': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    '&&:hover, &:focus': {
      maxWidth: onHoverMaxWidth,
    },
  })

  return (
    <StyledButton data-test='expandableButton' onClick={() => onClick()} aria-label={ariaLabel}>
      <Box sx={{ px: 1 }}>
        <Stack direction='row' alignItems='center' spacing={2}>
          {icon}
          <Typography sx={{ whiteSpace: 'nowrap' }}>{label}</Typography>
        </Stack>
      </Box>
    </StyledButton>
  )
}
