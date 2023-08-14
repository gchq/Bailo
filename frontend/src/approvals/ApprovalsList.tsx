import { List, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useGetApprovalRequestsForUser } from 'actions/approval'
import { timeDifference } from 'utils/dateUtils'

import { ApprovalRequestInterface } from '../../types/types'
import Loading from '../common/Loading'
import Link from '../Link'

type ApprovalsListProps = {
  isActive?: boolean
}

export default function ApprovalsList({ isActive = true }: ApprovalsListProps) {
  const { approvals, isApprovalsLoading } = useGetApprovalRequestsForUser(isActive)

  return (
    <>
      {isApprovalsLoading && <Loading />}
      <List>
        {approvals.map((approval) => (
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
  function editedAdornement() {
    if (approval.updatedAt > approval.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(approval.updatedAt))}.`
    }
  }
  return (
    <Link style={{ textDecoration: 'none' }} href={`/beta/model/${approval.model}`}>
      <ListItem disablePadding>
        <ListItemButton>
          <Stack>
            <Stack spacing={1} direction='row' justifyContent='flex-start' alignItems='center'>
              <Typography color='primary' variant='h6' component='h3' sx={{ fontWeight: 'bold' }}>
                {approval.model}
              </Typography>
              <Typography>{approval.release}</Typography>
            </Stack>
            <Stack spacing={1} direction='row' justifyContent='flex-start' alignItems='center'>
              <Typography variant='caption'>{`Created ${timeDifference(
                new Date(),
                new Date(approval.createdAt)
              )}.`}</Typography>
              <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
                {editedAdornement()}
              </Typography>
            </Stack>
          </Stack>
        </ListItemButton>
      </ListItem>
    </Link>
  )
}
