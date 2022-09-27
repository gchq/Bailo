import DisplaySettings from '@mui/icons-material/DisplaySettings'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material'
import _ from 'lodash'
import Link from 'next/link'
import React, { ChangeEvent } from 'react'
import { useGetUserDeployments } from '../data/deployment'
import { useGetModelById } from '../data/model'
import { useGetCurrentUser } from '../data/user'
import EmptyBlob from '../src/common/EmptyBlob'
import { lightTheme } from '../src/theme'
import Wrapper from '../src/Wrapper'
import { Deployment } from '../types/interfaces'

function ModelNameFromKey({ modelId }: { modelId: string }) {
  const { model, isModelError } = useGetModelById(modelId)
  if (isModelError) {
    return <Typography>Error getting model name</Typography>
  }
  return <Typography variant='h5'>{model?.currentMetadata?.highLevelDetails?.name ?? 'Loading...'}</Typography>
}

interface GroupedDeployments {
  [key: string]: Deployment[]
}

function Deployments() {
  const { currentUser, isCurrentUserError } = useGetCurrentUser()
  const { userDeployments, isUserDeploymentsLoading, isUserDeploymentsError } = useGetUserDeployments(currentUser?._id)

  const [selectedOrder, setSelectedOrder] = React.useState<string>('date')
  const [groupedDeployments, setGroupedDeployments] = React.useState<GroupedDeployments | undefined>(undefined)
  const [orderedDeployments, setOrderedDeployments] = React.useState<Deployment[] | undefined>([])

  const theme = useTheme() || lightTheme

  React.useEffect(() => {
    if (!isUserDeploymentsLoading && !isCurrentUserError && !isUserDeploymentsError && userDeployments !== undefined) {
      const groups: GroupedDeployments = _.groupBy(userDeployments, (deployment) => deployment.model)
      setGroupedDeployments(groups)
      // Default the ordered deployment list to date
      const sortedArray = [...userDeployments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      setOrderedDeployments(sortedArray)
    }
  }, [userDeployments, setOrderedDeployments, isCurrentUserError, isUserDeploymentsError, isUserDeploymentsLoading])

  const handleOrderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedOrder(event.target.value)
  }

  const displayDate = (date: Date) => new Date(date).toLocaleDateString('en-UK')

  React.useEffect(() => {
    if (selectedOrder === 'name' && !isUserDeploymentsError && userDeployments !== undefined) {
      const sortedArray: Deployment[] = [...userDeployments].sort((a, b) =>
        a.metadata.highLevelDetails.name > b.metadata.highLevelDetails.name ? 1 : -1
      )
      setOrderedDeployments(sortedArray)
    } else if (selectedOrder === 'date' && userDeployments !== undefined) {
      const sortedArray = [...userDeployments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      setOrderedDeployments(sortedArray)
    }
  }, [selectedOrder, setOrderedDeployments, isUserDeploymentsError, userDeployments])

  return (
    <Wrapper title='My Deployments' page='deployments'>
      <Paper sx={{ py: 2, px: 4 }}>
        <Box>
          <Box>
            <Accordion sx={{ boxShadow: 'none' }}>
              <AccordionSummary
                aria-controls='panel1a-content'
                expandIcon={<ExpandMoreIcon />}
                id='panel1a-header'
                sx={{ p: 0 }}
              >
                <DisplaySettings sx={{ color: '#757575', mr: 1 }} />
                <Typography>Arrange by</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2, backgroundColor: 'whitesmoke' }}>
                <FormControl component='fieldset'>
                  <RadioGroup
                    defaultValue='date'
                    row
                    onChange={handleOrderChange}
                    aria-label='order'
                    name='row-radio-buttons-group'
                  >
                    <FormControlLabel value='date' control={<Radio />} label='Date' />
                    <FormControlLabel value='name' control={<Radio />} label='Name' />
                    <FormControlLabel value='model' control={<Radio />} label='Model' />
                  </RadioGroup>
                </FormControl>
              </AccordionDetails>
            </Accordion>
            <Divider flexItem />
          </Box>
          {(selectedOrder === 'date' || selectedOrder === 'name') && (
            <Box>
              {orderedDeployments?.map((deployment, index) => (
                <Box key={`deployment-${deployment.uuid}`} sx={{ mt: 2 }}>
                  <Link href={`/deployment/${deployment?.uuid}`} passHref>
                    <MuiLink
                      variant='h5'
                      sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                    >
                      {deployment?.metadata?.highLevelDetails?.name}
                    </MuiLink>
                  </Link>
                  <Typography variant='body1' sx={{ marginBottom: 2 }}>
                    {displayDate(deployment?.createdAt)}
                  </Typography>
                  {index !== orderedDeployments.length - 1 && (
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
          {selectedOrder === 'model' && (
            <Box>
              {groupedDeployments !== undefined &&
                Object.keys(groupedDeployments).map((key) => (
                  <Box sx={{ mt: 3, mb: 3 }} key={key}>
                    <ModelNameFromKey modelId={key} />
                    <Divider flexItem />
                    {groupedDeployments[key].map((deployment) => (
                      <Box sx={{ p: 1, m: 1, backgroundColor: '#f3f1f1', borderRadius: 2 }} key={deployment.uuid}>
                        <Box>
                          <Link href={`/deployment/${deployment?.uuid}`} passHref>
                            <MuiLink
                              variant='h5'
                              sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                            >
                              {deployment?.metadata?.highLevelDetails?.name}
                            </MuiLink>
                          </Link>
                        </Box>
                        <Box>
                          <Typography variant='caption'>{displayDate(deployment?.createdAt)}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}
            </Box>
          )}
        </Box>
        <Box>
          {userDeployments !== undefined && !isUserDeploymentsLoading && userDeployments.length === 0 && (
            <EmptyBlob text='No deployments here' />
          )}
        </Box>
      </Paper>
    </Wrapper>
  )
}

export default Deployments
