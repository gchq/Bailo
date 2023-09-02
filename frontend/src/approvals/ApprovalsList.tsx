import { List, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { timeDifference } from 'utils/dateUtils'

import { useGetApprovalRequestsForUser } from '../../actions/approval'
import { ApprovalRequestInterface } from '../../types/types'
import EmptyBlob from '../common/EmptyBlob'
import Loading from '../common/Loading'

type ApprovalsListProps = {
  isActive?: boolean
  kind?: 'release' | 'access' | 'all'
}

export default function ApprovalsList({ isActive = true, kind = 'all' }: ApprovalsListProps) {
  const { approvals, isApprovalsLoading } = useGetApprovalRequestsForUser(isActive)
  const [filteredApprovals, setFilteredApprovals] = useState<ApprovalRequestInterface[]>([])

  useEffect(() => {
    if (kind === 'all') {
      setFilteredApprovals(approvals)
    } else {
      setFilteredApprovals(approvals.filter((filteredApproval) => filteredApproval.kind === kind))
    }
  }, [approvals, setFilteredApprovals, kind])

  return (
    <>
      {isApprovalsLoading && <Loading />}
      {filteredApprovals.length === 0 && <EmptyBlob text='No approvals found' />}
      <List>
        {filteredApprovals.map((approval) => (
          <ApprovalItem key={approval.release} approval={approval} />
        ))}
      </List>
    </>
  )
}

type ApprovalItemProps = {
  approval: ApprovalRequestInterface
}

function ApprovalItem({ approval }: ApprovalItemProps) {
  const router = useRouter()

  function listItemOnClick() {
    router.push(`/beta/model/${approval.model}`)
  }
  function editedAdornement() {
    if (approval.updatedAt > approval.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(approval.updatedAt))}.`
    }
  }
  return (
    <ListItem disablePadding>
      <ListItemButton onClick={listItemOnClick} aria-label={`Review model ${approval.model} ${approval.release}`}>
        <Stack>
          <Stack spacing={1} direction='row' justifyContent='flex-start' alignItems='center'>
            <Typography color='primary' variant='h6' component='h2' sx={{ fontWeight: 'bold' }}>
              {approval.model}
            </Typography>
            <Typography>{approval.release}</Typography>
          </Stack>
          <Stack spacing={1} direction='row' justifyContent='flex-start' alignItems='center'>
            <Typography variant='caption'>{`Created ${timeDifference(
              new Date(),
              new Date(approval.createdAt),
            )}.`}</Typography>
            <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
              {editedAdornement()}
            </Typography>
          </Stack>
        </Stack>
      </ListItemButton>
    </ListItem>
  )
}
