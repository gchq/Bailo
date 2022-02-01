import Close from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import DoneAll from '@mui/icons-material/DoneAll'
import Chip from '@mui/material/Chip'
import React from 'react'

const ApprovalsChip = (props: any) => {
  const { approvals } = props
  const [approvedCount, setApprovedCount] = React.useState<number>(0)
  const [styling, setStyling] = React.useState<object>({})
  const [icon, setIcon] = React.useState<any>(undefined)

  React.useEffect(() => {
    setApprovedCount(approvals.filter((e: string) => e === 'Accepted').length)
    if (approvals.filter((e: string) => e === 'Accepted').length === approvals.length) {
      setStyling({ borderRadius: 1, backgroundColor: '#4c8a4c', color: 'white', height: 'auto' })
      setIcon(<DoneAll sx={{ color: 'white !important', pl: 1 }} />)
    } else if (approvedCount < approvals.length && approvedCount !== 0) {
      setStyling({ borderRadius: 1, backgroundColor: '#dc851b', color: 'white', height: 'auto' })
      setIcon(<Done sx={{ color: 'white !important', pl: 1 }} />)
    } else {
      setStyling({ borderRadius: 1, backgroundColor: '#d63b3b', color: 'white', height: 'auto' })
      setIcon(<Close sx={{ color: 'white !important', pl: 1 }} />)
    }
  }, [approvals, approvedCount])

  return (
    <>
      <Chip 
        icon={icon        }  
        sx={styling} 
        label={'Approvals ' + approvedCount + '/' + approvals.length} 
      />
    </>
  )
}

export default ApprovalsChip
