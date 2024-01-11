import { Typography } from '@mui/material'

import { useGetModelRoles } from '../../actions/model'
//import { AccessRequestInterface } from '../../types/interfaces'
//import { ReleaseInterface } from '../../types/types'
//import { ApprovalStates } from '../../types/v2/enums'
import { ReviewRequestInterface } from '../../types/interfaces'
import Loading from '../common/Loading'
//import { getRoleDisplay } from '../../utils/beta/roles'
import MessageAlert from '../MessageAlert'

//get roles
//get response types
//need to do a condition if mtr or msro
//string statement to say who needs to review release
// place in map function

// does decisionKeys need to be imported instead

export const ResponseTypes = {
  Approve: 'approve',
  RequestChanges: 'request_changes',
} as const

export type ResponseTypeKeys = (typeof ResponseTypes)[keyof typeof ResponseTypes]

type DisplayRoleProps = {
  review: ReviewRequestInterface
  kind: ResponseTypeKeys
}

export default function ReviewRoleDisplay({ review, kind }: DisplayRoleProps) {
  const { _modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(review.model.id)

  const showRole = () => {
    if ((review.kind === 'release' && kind !== ResponseTypes.Approve) || ResponseTypes.RequestChanges) {
      return 'This release needs to be reviewed'
    } else if (
      (review.kind === 'release' && review.role === 'MSRO' && kind === ResponseTypes.Approve) ||
      ResponseTypes.RequestChanges
    ) {
      return 'This release needs to reviewed by the MTR'
    } else if (
      (review.kind === 'release' && review.role === 'MTR') ||
      kind === ResponseTypes.Approve ||
      ResponseTypes.RequestChanges
    ) {
      return 'This release needs to be reviewed by the MSRO'
    }
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Typography>{showRole()}</Typography>
    </>
  )
}
