import Close from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import DoneAll from '@mui/icons-material/DoneAll'
import { Chip } from '@mui/material'
import React from 'react'

const ApprovalsChip = (props: any) => {

  const { approvals } = props;
  const [ approvedCount, setApprovedCount ] = React.useState<number>(0)

  React.useEffect(() => {
    setApprovedCount(approvals.filter(e => e === 'Accepted').length)
  }, [approvals])

  const returnApprovals = () => {
    
    if (approvals.filter(e => e === 'Accepted').length === approvals.length) {
      return (
        <Chip icon={<DoneAll />} color="success" label={'Approvals ' + approvedCount + '/' + approvals.length} />
      )
    } else if (approvedCount < approvals.length && approvedCount !== 0) {
      return (
        <Chip icon={<Done />} color="warning" label={'Approvals ' + approvedCount + '/' + approvals.length} />
      )
    } else {
      return (
        <Chip icon={<Close />} color="error" label={'Approvals ' + approvedCount + '/' + approvals.length} />
      )
    }
  }

  return (
    <>
      {returnApprovals()}
    </>
  )

}

export default ApprovalsChip