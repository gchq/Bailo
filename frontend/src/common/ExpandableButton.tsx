import { Stack, Typography } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
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
  initialMaxWidth = '50px',
  onHoverMaxWidth = '350px',
}: ExpandableButtonProps) {
  const StyledButton = styled('button')(({ theme }) => ({
    maxWidth: initialMaxWidth,
    webkitTransition: 'max-width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    transition: 'max-width 0.5s',
    alignItems: 'center',
    overflow: 'hidden',
    color: theme.palette.common.white,
    borderStyle: 'none',
    borderRadius: 3,
    cursor: 'pointer',
    height: height,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    '&&:hover': {
      maxWidth: onHoverMaxWidth,
    },
  }))

  return (
    <StyledButton data-test='expandableButton' onClick={() => onClick()} aria-label={ariaLabel}>
      <Stack direction='row' alignItems='center' spacing={2}>
        <div style={{ paddingLeft: 10, paddingTop: 2 }}>{icon}</div>
        <Typography sx={{ whiteSpace: 'nowrap', pr: 1 }}>{label}</Typography>
      </Stack>
    </StyledButton>
  )
}
