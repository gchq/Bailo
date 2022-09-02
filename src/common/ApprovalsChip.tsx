import React, { useState, MouseEvent } from 'react'

import Close from '@mui/icons-material/CloseTwoTone'
import Done from '@mui/icons-material/DoneTwoTone'
import DoneAll from '@mui/icons-material/DoneAllTwoTone'
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
import { Theme } from '../../src/theme'

export default function ApprovalsChip({ approvals }: { approvals: any }) {
  Object.keys(approvals).forEach((key) => (approvals[key] === undefined ? delete approvals[key] : {}))

  const approvalOutcomes = [approvals?.managerResponse, approvals?.reviewerResponse].filter(Boolean)
  const numApprovals = approvalOutcomes.filter((e: string) => e === 'Accepted').length
  const totalApprovals = approvalOutcomes.length

  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const open = Boolean(anchorEl)

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

  const getRequestResponses = (response) => {
    let Icon
    let secondaryText

    if (response === 'Accepted') {
      Icon = Done
      secondaryText = 'Approved'
    } else if (response === 'Declined') {
      Icon = Close
      secondaryText = 'Declined'
    } else if (response === 'No Response') {
      Icon = AccessTime
      secondaryText = 'Awaiting response'
    }

    return [Icon, secondaryText]
  }

  const [ReviewerIcon, reviewerSecondaryText] = getRequestResponses(approvals?.reviewerResponse)
  const reviewerPrimaryText = `Technical reviewer (${approvals?.reviewer})`

  const [ManagerIcon, managerSecondaryText] = getRequestResponses(approvals?.managerResponse)
  const managerPrimaryText = `Model manager (${approvals?.manager})`

  const approvalsClicked = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLDivElement)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Stack direction='row' spacing={0}>
      <Chip
        sx={{ borderRadius: 1, color: 'white', height: 'auto', backgroundColor }}
        label={`Approvals ${numApprovals}/${totalApprovals}`}
        onClick={approvalsClicked}
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
        <List dense={true}>
          {approvals?.reviewerResponse !== undefined && (
            <ListItem>
              <ListItemIcon>
                <ReviewerIcon aria-hidden={true} />
              </ListItemIcon>
              <ListItemText primary={reviewerPrimaryText} secondary={reviewerSecondaryText} />
            </ListItem>
          )}
          {approvals?.managerResponse !== undefined && (
            <ListItem>
              <ListItemIcon>
                <ManagerIcon aria-hidden={true} />
              </ListItemIcon>
              <ListItemText primary={managerPrimaryText} secondary={managerSecondaryText} />
            </ListItem>
          )}
        </List>
      </Menu>
    </Stack>
  )
}
