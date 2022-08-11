import Close from '@mui/icons-material/CloseTwoTone'
import Done from '@mui/icons-material/DoneTwoTone'
import DoneAll from '@mui/icons-material/DoneAllTwoTone'
import Chip from '@mui/material/Chip'
import React from 'react'
import useTheme from '@mui/styles/useTheme'
import { Theme } from '../../src/theme'

export default function ApprovalsChip({ approvals }: { approvals: any }) {
  const numApprovals = approvals.filter((e: string) => e === 'Accepted').length
  const totalApprovals = approvals.length

  const theme = useTheme<Theme>()

  let Icon
  let backgroundColor
  if (numApprovals === 0) {
    Icon = Close
    backgroundColor = theme.palette.error.main
  } else if (numApprovals < totalApprovals) {
    Icon = Done
    backgroundColor = '#dc851b'
  } else {
    Icon = DoneAll
    backgroundColor = '#4c8a4c'
  }

  return (
    <Chip
      icon={<Icon sx={{ color: 'white !important', pl: 1 }} />}
      sx={{ borderRadius: 1, color: 'white', height: 'auto', backgroundColor }}
      label={`Approvals ${numApprovals}/${totalApprovals}`}
    />
  )
}
