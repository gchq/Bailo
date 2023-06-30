import AccessTime from '@mui/icons-material/AccessTime'
import Close from '@mui/icons-material/CloseTwoTone'
import Done from '@mui/icons-material/DoneTwoTone'
import DownArrow from '@mui/icons-material/KeyboardArrowDown'
import UpArrow from '@mui/icons-material/KeyboardArrowUp'
import { Badge, IconButton, Tooltip } from '@mui/material'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import { postEndpoint } from 'data/api'
import { useListApprovals } from 'data/approvals'
import React, { MouseEvent, ReactElement, useCallback, useMemo, useState } from 'react'

import { Approval, ApprovalCategory, ApprovalStates, Deployment, User, Version } from '../../types/types'

/*
- If current user is in approval.reviewers array AND approval.status === ApprovalStates.NoResponse -> Show approve/decline buttons 
  - Show badge with number for number of times the above is true
  - Will require user to be passed in via props

- When user clicks approve/decline call:
  await postEndpoint(`/api/v1/approval/${approval?._id}/respond`, { choice }).then((res) => res.json())

- Assumption: Once POST approval has succeeded, call onChange prop from ApprovalsChip
  - In the model (frontend/pages/model/[uuid].tsx) and deployment (frontend/pages/deployment/[uuid].tsx) overviews, call mutate when this onChange prop is called
*/

type ApprovalsChipProps = {
  versionOrDeploymentId: Version['_id'] | Deployment['_id']
  approvalCategory: ApprovalCategory
  currentUser: User
}

export default function ApprovalsChip({
  versionOrDeploymentId,
  approvalCategory,
  currentUser,
}: ApprovalsChipProps): ReactElement {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  // TODO use loading, error and mutate
  const {
    approvals: foundApprovals,
    isApprovalsLoading,
    isApprovalsError,
    mutateApprovals,
  } = useListApprovals(approvalCategory, 'user', versionOrDeploymentId)
  const approvals = useMemo(() => foundApprovals || [], [foundApprovals])

  const open = useMemo(() => !!anchorEl, [anchorEl])
  const numAcceptedApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === ApprovalStates.Accepted).length,
    [approvals]
  )
  const totalApprovals = useMemo(() => approvals.length, [approvals])
  const noResponseApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === ApprovalStates.NoResponse),
    [approvals]
  )
  const numCurrentUserApprovals = useMemo(
    () =>
      noResponseApprovals.filter((approval) => approval.approvers.some((reviewer) => reviewer.id === currentUser.id))
        .length,
    [noResponseApprovals, currentUser]
  )

  const backgroundColor = useMemo(() => {
    if (numAcceptedApprovals === 0) {
      return theme.palette.error.main
    }
    if (numAcceptedApprovals < totalApprovals) {
      return '#dc851b'
    }
    return '#4c8a4c'
  }, [numAcceptedApprovals, totalApprovals, theme])

  const getApprovalResponses = useCallback(
    (approval: Pick<Approval, '_id' | 'approvers' | 'status'>, index: number) => {
      let Icon = AccessTime
      let secondaryText = ''
      const primaryText = approval.approvers.map((reviewer) => reviewer.id).join(', ')
      const isAwaitingCurrentUserResponse =
        approval.status === ApprovalStates.NoResponse &&
        approval.approvers.some((reviewer) => reviewer.id === currentUser.id)

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

      const updateApprovalState = async (newState: Exclude<ApprovalStates, ApprovalStates.NoResponse>) => {
        // TODO: Error handling
        const approvalResponse = await postEndpoint(`/api/v1/approval/${approval._id}/respond`, { choice: newState })
        mutateApprovals()
      }

      return (
        <ListItem key={index}>
          <Stack direction='row' alignItems='center' spacing={2}>
            <>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Icon aria-hidden />
              </ListItemIcon>
              <ListItemText primary={primaryText} secondary={secondaryText} />
            </>
            <>
              {isAwaitingCurrentUserResponse && (
                <Stack direction='row' alignItems='center'>
                  <Tooltip title='Approve'>
                    <IconButton onClick={() => updateApprovalState(ApprovalStates.Accepted)}>
                      <Done />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Reject'>
                    <IconButton onClick={() => updateApprovalState(ApprovalStates.Declined)}>
                      <Close />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </>
          </Stack>
        </ListItem>
      )
    },
    [currentUser, mutateApprovals]
  )

  const approvalResponseListItems = useMemo(
    () =>
      approvals.map((approval, index) => (
        <>
          {getApprovalResponses(approval, index)}
          {index < approvals.length - 1 && <Divider variant='middle' />}
        </>
      )),
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
      <Badge badgeContent={numCurrentUserApprovals} color='primary'>
        <Chip
          sx={{ borderRadius: 1, color: 'white', height: 'auto', backgroundColor }}
          label={`Approvals ${numAcceptedApprovals}/${totalApprovals}`}
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
      </Badge>
      <Menu id='model-approvals-menu' anchorEl={anchorEl} open={open} onClose={handleClose}>
        <List dense>{approvalResponseListItems}</List>
      </Menu>
    </Stack>
  )
}
