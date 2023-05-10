import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import React, { useState } from 'react'

import { postEndpoint } from '../data/api'
import { ApprovalCategory, ApprovalFilterType, useGetNumApprovals, useListApprovals } from '../data/approvals'
import EmptyBlob from '../src/common/EmptyBlob'
import MultipleErrorWrapper from '../src/errors/MultipleErrorWrapper'
import Wrapper from '../src/Wrapper'
import { Approval } from '../types/types'

function ErrorWrapper({ message }: { message: string | undefined }) {
  return (
    <Paper sx={{ mt: 2, mb: 2 }}>
      <Alert severity='error'>{message || 'Unable to communicate with server.'}</Alert>
    </Paper>
  )
}

function ApprovalList({ category, filter }: { category: ApprovalCategory; filter: ApprovalFilterType }) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const [approval, setApproval] = useState<Approval | undefined>(undefined)
  const [approvalModalText, setApprovalModalText] = useState('')
  const [approvalModalTitle, setApprovalModalTitle] = useState('')

  const theme = useTheme()

  const { approvals, isApprovalsLoading, isApprovalsError, mutateApprovals } = useListApprovals(category, filter)
  const { mutateNumApprovals } = useGetNumApprovals()

  const managerStyling = {
    mb: 2,
    borderLeft: '.3rem solid #283593',
    p: 2,
    backgroundColor: theme.palette.container.main,
  }
  const reviewerStyling = {
    mb: 2,
    borderLeft: '.3rem solid #de3c30',
    p: 2,
    backgroundColor: theme.palette.container.main,
  }

  const handleClose = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onConfirm = async () => {
    await postEndpoint(`/api/v1/approval/${approval?._id}/respond`, { choice }).then((res) => res.json())

    mutateApprovals()
    mutateNumApprovals()
    setOpen(false)
  }

  const error = MultipleErrorWrapper(
    `Unable to load approval page`,
    {
      isApprovalsError,
    },
    ErrorWrapper
  )
  if (error) return error

  const changeState = (changeStateChoice: string, changeStateApproval: Approval) => {
    setOpen(true)
    setApproval(changeStateApproval)
    setChoice(changeStateChoice)
    if (changeStateChoice === 'Accepted') {
      setApprovalModalTitle(`Approve ${category}`)
      setApprovalModalText(`I can confirm that the ${category.toLowerCase()} meets all necessary requirements.`)
    } else {
      setApprovalModalTitle(`Reject ${category}`)
      setApprovalModalText(`The ${category.toLowerCase()} does not meet the necessary requirements for approval.`)
    }
  }

  const getUploadCategory = (approvalCategory: ApprovalCategory) =>
    approvalCategory === 'Upload' ? 'models' : 'deployments'

  if (isApprovalsLoading || !approvals) {
    return <Paper sx={{ mt: 2, mb: 2 }} />
  }

  return (
    <Paper sx={{ mt: 2, mb: 2, pb: 2 }}>
      <Typography sx={{ p: 3 }} variant='h4'>
        {category === 'Upload' ? 'Models' : 'Deployments'}
      </Typography>
      {approvals.map((approvalObj: any) => (
        <Box sx={{ px: 3 }} key={approvalObj._id}>
          <Grid container spacing={1} sx={approvalObj.approvalType === 'Manager' ? managerStyling : reviewerStyling}>
            <Grid item xs={12} md={6} lg={7}>
              {category === 'Upload' && (
                <>
                  <Link href={`/model/${approvalObj.version?.model?.uuid}`} passHref legacyBehavior>
                    <MuiLink
                      variant='h5'
                      sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                    >
                      {approvalObj.version?.metadata?.highLevelDetails?.name}
                    </MuiLink>
                  </Link>
                  <Stack direction='row' spacing={2}>
                    <Chip color='primary' label={approvalObj.approvalType} size='small' />
                    <Chip color='primary' label={`Version: ${approvalObj.version?.version}`} size='small' />
                    <Box sx={{ mt: 'auto !important', mb: 'auto !important' }}>
                      <Typography variant='body1'>
                        {approvalObj.version?.metadata?.highLevelDetails?.modelInASentence}
                      </Typography>
                    </Box>
                  </Stack>
                  {approvalObj.version === undefined ||
                    (approvalObj.version === null && (
                      <Alert sx={{ mt: 2 }} severity='warning'>
                        This model appears to have data missing - check with the uploader to make sure it was uploaded
                        correctly
                      </Alert>
                    ))}
                </>
              )}
              {category === 'Deployment' && (
                <>
                  <Link href={`/deployment/${approvalObj.deployment?.uuid}`} passHref legacyBehavior>
                    <MuiLink
                      variant='h5'
                      sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                    >
                      {approvalObj.deployment?.metadata?.highLevelDetails?.name}
                    </MuiLink>
                  </Link>
                  <Typography variant='body1'>
                    Requesting deployment of{' '}
                    <Link href={`/model/${approvalObj.deployment?.model?.uuid}`} passHref legacyBehavior>
                      <MuiLink sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}>
                        {approvalObj.deployment?.model?.latestVersion?.metadata?.highLevelDetails?.name}
                      </MuiLink>
                    </Link>
                  </Typography>
                  {approvalObj.deployment === undefined ||
                    (approvalObj.deployment === null && (
                      <Alert sx={{ mt: 2 }} severity='warning'>
                        This deployment appears to have data missing - check with the requester to make sure it was
                        requested correctly
                      </Alert>
                    ))}
                </>
              )}
            </Grid>
            <Grid item xs={12} md sx={{ display: 'flex' }}>
              <Box ml='auto' my='auto'>
                {approvalObj.status !== 'No Response' && (
                  <Chip label={approvalObj.status} color={approvalObj.status === 'Accepted' ? 'success' : 'error'} />
                )}
              </Box>
            </Grid>
            <Grid item sx={{ display: 'flex', width: 200 }}>
              <Box ml='auto' my='auto'>
                <Button
                  color='secondary'
                  variant='outlined'
                  onClick={() => changeState('Declined', approvalObj)}
                  sx={{ mr: 1 }}
                  disabled={approvalObj.status === 'Declined'}
                >
                  Reject
                </Button>
                <Button
                  variant='contained'
                  onClick={() => changeState('Accepted', approvalObj)}
                  data-test={`approveButton${approvalObj.approvalType}${
                    category === 'Upload' ? approvalObj.version?.model?.uuid : approvalObj.deployment?.uuid
                  }`}
                  disabled={approvalObj.status === 'Accepted'}
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
          <Button color='secondary' variant='outlined' onClick={onCancel}>
            Cancel
          </Button>
          <Button variant='contained' onClick={onConfirm} autoFocus data-test='confirmButton'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {approvals.length === 0 && (
        <EmptyBlob text={`All done! No ${getUploadCategory(category)} are waiting for approval.`} />
      )}
    </Paper>
  )
}

export default function Review() {
  const [value, setValue] = useState<ApprovalFilterType>('user')

  const handleChange = (_event: React.SyntheticEvent, newValue: ApprovalFilterType) => {
    setValue(newValue)
  }

  return (
    <Wrapper title='Reviews' page='review'>
      <Tabs value={value} onChange={handleChange}>
        <Tab value='user' label='Approvals' />
        <Tab value='archived' label='Archived' />
      </Tabs>
      <ApprovalList category='Upload' filter={value} />
      <ApprovalList category='Deployment' filter={value} />
    </Wrapper>
  )
}
