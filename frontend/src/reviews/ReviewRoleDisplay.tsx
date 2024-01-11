import { Typography } from '@mui/material'

import { useGetModelRoles } from '../../actions/model'
import { DecisionKeys, ReviewRequestInterface } from '../../types/interfaces'
import Loading from '../common/Loading'
//import { getRoleDisplay } from '../../utils/beta/roles'
import MessageAlert from '../MessageAlert'

//get roles
//get response types
//need to do a condition if mtr or msro
//string statement to say who needs to review release
// place in map function

// does decisionKeys need to be imported instead

// make message dissappear once task is complete
// do I need to use a useState for the message so that it is not shown when release/acces has been reviewed?

// export const ResponseTypes = {
//   Approve: 'approve',
//   RequestChanges: 'request_changes',
// } as const

// export type ResponseTypeKeys = (typeof ResponseTypes)[keyof typeof ResponseTypes]

type DisplayRoleProps = {
  review: ReviewRequestInterface
  kind?: DecisionKeys
}

export default function ReviewRoleDisplay({ review, kind }: DisplayRoleProps) {
  const { _modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(review.model.id)

  const showRole = () => {
    if (review.kind === 'release' || (review.kind === 'access' && kind !== 'approve') || kind !== 'request_changes') {
      return `This ${review.kind} needs to be reviewed by the ${review.role} `
    }
    //need to do error/bad request
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
