import Wrapper from 'src/Wrapper'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Stack from '@mui/material/Stack'
import { useState } from 'react'
import Link from 'next/link'
import MuiLink from '@mui/material/Link'
import EmptyBlob from '../src/common/EmptyBlob'
import { Request } from '../types/interfaces'
import { RequestType, ReviewFilterType, useListRequests, useGetNumRequests } from '../data/requests'
import MultipleErrorWrapper from '../src/errors/MultipleErrorWrapper'
import { postEndpoint } from '../data/api'

export default function Review() {
  const [value, setValue] = useState<ReviewFilterType>('mine')

  const handleChange = (_event: React.SyntheticEvent, newValue: ReviewFilterType) => {
    setValue(newValue)
  }

  return (
    <Wrapper title='Reviews' page={'review'}>
      <>
        <Tabs indicatorColor='secondary' value={value} onChange={handleChange}>
          <Tab value='mine' label='My approvals' />
          <Tab value='all' label='All approvals (Admin)' />
        </Tabs>
        <ApprovalList type={'Upload'} category={value} />
        <ApprovalList type={'Deployment'} category={value} />
      </>
    </Wrapper>
  )
}

const ErrorWrapper = ({ message }: { message: string | undefined }) => (
  <Paper sx={{ mt: 2, mb: 2 }}>
    <Alert severity='error'>{message || 'Unable to communicate with server.'}</Alert>
  </Paper>
)

const ApprovalList = ({ type, category }: { type: RequestType; category: ReviewFilterType }) => {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const [request, setRequest] = useState<Request | undefined>(undefined)
  const [approvalModalText, setApprovalModalText] = useState('')
  const [approvalModalTitle, setApprovalModalTitle] = useState('')

  const { requests, isRequestsLoading, isRequestsError, mutateRequests } = useListRequests(type, category)
  const { mutateNumRequests } = useGetNumRequests()

  const managerStyling = { mb: 2, borderLeft: '.3rem solid #283593', p: 2, backgroundColor: 'whitesmoke' }
  const reviewerStyling = { mb: 2, borderLeft: '.3rem solid #de3c30', p: 2, backgroundColor: 'whitesmoke' }

  const handleClose = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onConfirm = async () => {
    await postEndpoint(`/api/v1/request/${request!._id}/respond`, { choice }).then((res) => res.json())

    mutateRequests()
    mutateNumRequests()
    setOpen(false)
  }

  const error = MultipleErrorWrapper(
    `Unable to load approval page`,
    {
      isRequestsError,
    },
    ErrorWrapper
  )
  if (error) return error

  if (isRequestsLoading) {
    return <Paper sx={{ mt: 2, mb: 2 }} />
  }

  const changeState = (changeStateChoice: string, changeStateRequest: Request) => {
    setOpen(true)
    setRequest(changeStateRequest)
    setChoice(changeStateChoice)
    if (changeStateChoice === 'Accepted') {
      setApprovalModalTitle(`Approve ${type}`)
      setApprovalModalText(`I can confirm that the ${type.toLowerCase()} meets all necessary requirements.`)
    } else {
      setApprovalModalTitle(`Reject ${type}`)
      setApprovalModalText(`The ${type.toLowerCase()} does not meet the necessary requirements for approval.`)
    }
  }

  return (
    <Paper sx={{ mt: 2, mb: 2, pb: 2 }}>
      <Typography sx={{ p: 3 }} variant='h4'>
        {type === 'Upload' ? 'Models' : 'Deployments'}
      </Typography>
      {requests!.map((requestObj: any, index) => (
        <Box sx={{ px: 3 }} key={`model-${index}`}>
          <Grid container sx={requestObj.approvalType === 'Manager' ? managerStyling : reviewerStyling}>
            <Grid item xs={12} sm={8}>
              {type === 'Upload' && (
                <>
                  <Link href={`/model/${requestObj.version.model.uuid}`} passHref>
                    <MuiLink variant='h5' sx={{ fontWeight: '500', textDecoration: 'none' }}>
                      {requestObj.version.metadata.highLevelDetails.name}
                    </MuiLink>
                  </Link>
                  <Stack direction='row' spacing={2}>
                    <Chip label={requestObj.approvalType} size='small' />
                    <Box sx={{ mt: 'auto !important', mb: 'auto !important' }}>
                      <Typography variant='body1'>
                        {requestObj.version.metadata.highLevelDetails.modelInASentence}
                      </Typography>
                    </Box>
                  </Stack>
                </>
              )}
              {type === 'Deployment' && (
                <>
                  <Link href={`/deployment/${requestObj.deployment.uuid}`} passHref>
                    <MuiLink variant='h5' sx={{ fontWeight: '500', textDecoration: 'none' }}>
                      {requestObj.deployment.metadata.highLevelDetails.name}
                    </MuiLink>
                  </Link>
                  <Typography variant='body1'>
                    Requesting deployment of{' '}
                    <Link href={`/model/${requestObj.deployment.model.uuid}`} passHref>
                      <MuiLink sx={{ fontWeight: '500', textDecoration: 'none' }}>
                        {requestObj.deployment.model.currentMetadata.highLevelDetails.name}
                      </MuiLink>
                    </Link>
                  </Typography>
                </>
              )}
            </Grid>
            <Grid item xs={12} sm={4} sx={{ m: 'auto', textAlign: 'right' }}>
              <Box>                
                <Button
                  color='secondary'
                  sx={{ m: 1 }}
                  onClick={() => changeState('Declined', requestObj)}
                  variant='outlined'
                >
                  Reject
                </Button>
                <Button
                  sx={{ m: 1 }}
                  onClick={() => changeState('Accepted', requestObj)}
                  variant='contained'
                  data-test='approveButton'
                >
                  Approve
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ))}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle id='alert-dialog-title'>{approvalModalTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{approvalModalText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' variant='outlined'onClick={onCancel}>Cancel</Button>
          <Button variant='contained' onClick={onConfirm} autoFocus data-test='confirmButton'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {requests!.length === 0 && (
        <EmptyBlob
          text={'All done! No ' + (type === 'Upload' ? 'models' : 'deployments') + ' are waiting for approvals'}
        />
      )}
    </Paper>
  )
}
