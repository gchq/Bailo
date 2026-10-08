import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import type { Breakpoint } from '@mui/system'

type ComparisonSwapButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  breakpoint?: Breakpoint
}

export default function ComparisonSwapButton({
  label,
  onClick,
  disabled,
  breakpoint = 'md',
}: ComparisonSwapButtonProps) {
  return (
    <Stack sx={{ justifyContent: 'center', alignItems: 'center' }}>
      <Typography>&nbsp;</Typography>
      <Tooltip title={`Swap ${label} sides`}>
        <span>
          <IconButton
            color='primary'
            aria-label={`Swap Source and Target ${label} sides`}
            onClick={onClick}
            disabled={disabled}
            sx={{
              border: '1px solid',
              borderColor: 'primary.main',
              '&.Mui-disabled': {
                borderColor: 'action.disabled',
              },
            }}
          >
            <CompareArrowsIcon
              sx={{
                transition: 'transform 150ms ease-in-out',
                transform: { xs: 'rotate(90deg)', [breakpoint]: 'rotate(0deg)' },
                '&:focus': {
                  transform: { xs: 'rotate(270deg)', [breakpoint]: 'rotate(180deg)' },
                },
                '&:hover': {
                  transform: { xs: 'rotate(270deg)', [breakpoint]: 'rotate(180deg)' },
                },
              }}
              fontSize='large'
            />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
