import React, { useState, useMemo, useCallback, MouseEvent } from 'react'

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
import useTheme from '@mui/styles/useTheme'

import { ApprovalStates } from '../../types/interfaces'
import { Theme } from '../theme'

export default function ApprovalsChip({
  approvals,
}: {
  approvals: [{ ['reviewer']: any; ['status']: ApprovalStates }, { ['reviewer']: any; ['status']: ApprovalStates }]
}) {
  const numApprovals = useMemo(
    () =>
      approvals.filter(
        (e: { ['reviewer']: any; ['status']: ApprovalStates } | { ['manager']: any; ['status']: ApprovalStates }) =>
          e.status === 'Accepted'
      ).length,
    [approvals]
  )
  const totalApprovals = approvals.length

  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const open = !!anchorEl

  const theme = useTheme<Theme>()

  let backgroundColor
  if (numApprovals === 0) {
    backgroundColor = theme.palette.error.main
  } else if (numApprovals < totalApprovals) {
    backgroundColor = '#dc851b'
  } else {
    backgroundColor = '#4c8a4c'
  }

  const getRequestResponses = (response, index) => {
    let Icon
    let secondaryText
    const primaryText = `${response.reviewer}`

    if (response.status === ApprovalStates.Accepted) {
      Icon = Done
      secondaryText = 'Approved'
    } else if (response.status === ApprovalStates.Declined) {
      Icon = Close
      secondaryText = 'Declined'
    } else if (response.status === ApprovalStates.NoResponse) {
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
  }

  const requestResponseListItems = approvals.map((reviewer, index) => getRequestResponses(reviewer, index))

  const handleApprovalsClicked = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLDivElement)
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
      />
      <Menu id='model-approvals-menu' anchorEl={anchorEl} open={open} onClose={handleClose}>
        <List dense>{requestResponseListItems}</List>
      </Menu>
    </Stack>
  )
}
