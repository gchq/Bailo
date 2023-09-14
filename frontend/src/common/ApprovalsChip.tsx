import AccessTime from '@mui/icons-material/AccessTime'
import Cancel from '@mui/icons-material/CancelOutlined'
import CheckCircle from '@mui/icons-material/CheckCircleOutlined'
import Close from '@mui/icons-material/CloseTwoTone'
import Done from '@mui/icons-material/DoneTwoTone'
import DownArrow from '@mui/icons-material/KeyboardArrowDown'
import UpArrow from '@mui/icons-material/KeyboardArrowUp'
import Badge from '@mui/material/Badge'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import { lighten } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import { postEndpoint } from 'data/api'
import { useGetNumApprovals, useGetVersionOrDeploymentApprovals } from 'data/approvals'
import { Fragment, MouseEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from 'utils/fetcher'

import { Approval, ApprovalCategory, ApprovalStates, Deployment, User, Version } from '../../types/types'
import useNotification from './Snackbar'

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
  const sendNotification = useNotification()
  const { mutateNumApprovals } = useGetNumApprovals()
  const {
    approvals: foundApprovals,
    isApprovalsLoading,
    isApprovalsError,
    mutateApprovals,
  } = useGetVersionOrDeploymentApprovals(approvalCategory, versionOrDeploymentId)
  const approvals = useMemo(() => foundApprovals || [], [foundApprovals])

  const open = useMemo(() => !!anchorEl, [anchorEl])
  const numAcceptedApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === ApprovalStates.Accepted).length,
    [approvals],
  )
  const totalApprovals = useMemo(() => approvals.length, [approvals])
  const noResponseApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === ApprovalStates.NoResponse),
    [approvals],
  )
  const numCurrentUserApprovals = useMemo(
    () =>
      noResponseApprovals.filter((approval) => approval.approvers.some((reviewer) => reviewer.id === currentUser.id))
        .length,
    [noResponseApprovals, currentUser],
  )

  const backgroundColor = useMemo(() => {
    if (numAcceptedApprovals === 0) {
      return theme.palette.error.main
    }
    if (numAcceptedApprovals < totalApprovals) {
      return theme.palette.warning.main
    }
    return theme.palette.success.main
  }, [numAcceptedApprovals, totalApprovals, theme])

  useEffect(() => {
    if (isApprovalsError) sendNotification({ variant: 'error', msg: isApprovalsError.message })
  }, [isApprovalsError, sendNotification])

  const getApprovalResponses = useCallback(
    (approval: Pick<Approval, '_id' | 'approvers' | 'status'>, index: number) => {
      let Icon = AccessTime
      let secondaryText = ''
      const primaryText = approval.approvers.map((reviewer) => reviewer.id).join(', ')
      const isAwaitingCurrentUserResponse =
        approval.status === ApprovalStates.NoResponse &&
        approval.approvers.some((reviewer) => reviewer.id === currentUser.id)

      if (approval.status === ApprovalStates.Accepted) {
        Icon = CheckCircle
        secondaryText = 'Approved'
      } else if (approval.status === ApprovalStates.Declined) {
        Icon = Cancel
        secondaryText = 'Declined'
      } else if (approval.status === ApprovalStates.NoResponse) {
        Icon = AccessTime
        secondaryText = 'Awaiting response'
      }

      const updateApprovalState = async (newState: Exclude<ApprovalStates, ApprovalStates.NoResponse>) => {
        const approvalResponse = await postEndpoint(`/api/v1/approval/${approval._id}/respond`, { choice: newState })

        if (approvalResponse.status >= 200 && approvalResponse.status < 400) {
          mutateApprovals()
          // Update number of approvals for Badge in navigation menu
          mutateNumApprovals()
        } else {
          sendNotification({ variant: 'error', msg: await getErrorMessage(approvalResponse) })
        }
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
                      <Done color='success' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Reject'>
                    <IconButton onClick={() => updateApprovalState(ApprovalStates.Declined)}>
                      <Close color='error' />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </>
          </Stack>
        </ListItem>
      )
    },
    [currentUser.id, mutateApprovals, mutateNumApprovals, sendNotification],
  )

  const approvalResponseListItems = useMemo(
    () =>
      approvals.map((approval, index) => (
        <Fragment key={`approvalResponse-${approval._id}`}>
          {getApprovalResponses(approval, index)}
          {index < approvals.length - 1 && <Divider variant='middle' />}
        </Fragment>
      )),
    [approvals, getApprovalResponses],
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
          sx={{
            borderRadius: 1,
            color: 'white',
            height: 'auto',
            backgroundColor,
            '&:hover': {
              backgroundColor: lighten(backgroundColor, 0.2),
            },
          }}
          label={isApprovalsLoading ? 'Loading approvals...' : `Approvals ${numAcceptedApprovals}/${totalApprovals}`}
          onClick={handleApprovalsClicked}
          icon={open ? <UpArrow sx={{ fill: 'white', pl: 1 }} /> : <DownArrow sx={{ fill: 'white', pl: 1 }} />}
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
