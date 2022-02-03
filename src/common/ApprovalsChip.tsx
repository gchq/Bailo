import Close from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import DoneAll from '@mui/icons-material/DoneAll'
import Chip from '@mui/material/Chip'
import React from 'react'

export default function ApprovalsChip({ approvals }: { approvals: any }) {
  const numApprovals = approvals.filter((e: string) => e === 'Accepted').length
  const totalApprovals = approvals.length

  let Icon
  let backgroundColor
  if (numApprovals === 0) {
    Icon = Close
    backgroundColor = '#d63b3b'
  } else if (numApprovals < totalApprovals) {
    Icon = Done
    backgroundColor = '#dc851b'
  } else {
    Icon = DoneAll
    backgroundColor = '#4c8a4c'
  }

  return (
<<<<<<< HEAD
    <Chip 
      icon={<Icon sx={{ color: 'white !important', pl: 1 }} />}  
      sx={{ borderRadius: 1, color: 'white', height: 'auto', backgroundColor }} 
      label={`Approvals ${numApprovals}/${totalApprovals}`} 
    />
=======
    <>
      <Chip 
        icon={icon}  
        sx={styling} 
        label={'Approvals ' + approvedCount + '/' + approvals.length} 
      />
    </>
>>>>>>> 6746d91 (reverted title and font changes)
  )
}