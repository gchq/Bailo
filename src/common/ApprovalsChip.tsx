import React, { useState, useMemo, useCallback, MouseEvent, ReactElement } from 'react'
import Close from '@mui/icons-material/CloseTwoTone'
import Done from '@mui/icons-material/DoneTwoTone'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import AccessTime from '@mui/icons-material/AccessTime'
import DownArrow from '@mui/icons-material/KeyboardArrowDown'
import UpArrow from '@mui/icons-material/KeyboardArrowUp'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'

import { ApprovalStates, Entity } from '../../types/interfaces'

type Approval = {
  reviewers: Array<Entity>
  status: ApprovalStates
}

type ApprovalsChipProps = {
  approvals: Approval[]
}

export default function ApprovalsChip({ approvals }: ApprovalsChipProps): ReactElement {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

  const open = useMemo(() => !!anchorEl, [anchorEl])
  const numApprovals = useMemo(() => approvals.filter((approval) => approval.status === 'Accepted').length, [approvals])
  const totalApprovals = useMemo(() => approvals.length, [approvals])

  const backgroundColor = useMemo(() => {
    if (numApprovals === 0) {
      return theme.palette.error.main
    }
    if (numApprovals < totalApprovals) {
      return '#dc851b'
    }
    return '#4c8a4c'
  }, [numApprovals, totalApprovals, theme])

  const getApprovalResponses = useCallback((approval: Approval, index: number) => {
    let Icon
    let secondaryText = ''
    const primaryText = approval.reviewers.map((reviewer) => reviewer.id).join(', ')

    if (approval.status === ApprovalStates.Accepted) {
      Icon = Done
      secondaryText = 'Approved'
    } else if (approval.status === ApprovalStates.Declined) {
      Icon = Close
      secondaryText = 'Declined'
    } else if (approval.status === ApprovalStates.NoResponse) {
      Icon = AccessTime
      secondaryText = 'Awaiting response'
    }

    return (
      <ListItem key={index}>
        <ListItemIcon>
          <Icon aria-hidden />
        </ListItemIcon>
        <ListItemText primary={primaryText} secondary={secondaryText} />
      </ListItem>
    )
  }, [])

  const approvalResponseListItems = useMemo(
    () => approvals.map((approval, index) => getApprovalResponses(approval, index)),
    [approvals, getApprovalResponses]
  )

  const handleApprovalsClicked = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Stack direction='row'>
      <Chip
        sx={{ borderRadius: 1, color: 'white', height: 'auto', backgroundColor }}
        label={`Approvals ${numApprovals}/${totalApprovals}`}
        onClick={handleApprovalsClicked}
        icon={
          open ? (
            <UpArrow sx={{ color: 'white !important', pl: 1 }} />
          ) : (
            <DownArrow sx={{ color: 'white !important', pl: 1 }} />
          )
        }
        aria-controls='model-approvals-menu'
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        data-test='approvalsChip'
      />
      <Menu id='model-approvals-menu' anchorEl={anchorEl} open={open} onClose={handleClose}>
        <List dense>{approvalResponseListItems}</List>
      </Menu>
    </Stack>
  )
}
