import React, { ChangeEvent } from 'react'
import _ from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Box from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DisplaySettings from '@mui/icons-material/DisplaySettings'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Stack from '@mui/material/Stack'
import useTheme from '@mui/styles/useTheme'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'

import { Deployment } from '../types/interfaces'
import { useGetCurrentUser } from '../data/user'
import { listPublicDeployments, useGetUserDeployments } from '../data/deployment'
import Wrapper from '../src/Wrapper'
import EmptyBlob from '../src/common/EmptyBlob'
import { lightTheme } from '../src/theme'
import useDebounce from '../utils/useDebounce'
import { PublicDeploymentDoc } from '../server/models/PublicDeployment'
import { ModelNameFromKey, VersionNameFromKey } from '../src/util/ObjectKeyDisplay'


type TabOptions = 'my-deployments' | 'public'

function isTabOption(value: string): value is TabOptions {
  return ['my-deployments', 'public'].includes(value)
}

interface GroupedDeployments {
  [key: string]: Deployment[]
}

function Deployments() {
  const router = useRouter()
  const { tab }: { tab?: TabOptions } = router.query

  const [selectedOrder, setSelectedOrder] = React.useState<string>('date')
  const [groupedDeployments, setGroupedDeployments] = React.useState<GroupedDeployments | undefined>(undefined)
  const [orderedDeployments, setOrderedDeployments] = React.useState<Deployment[] | undefined>([])
  const [group, setGroup] = React.useState<TabOptions>('my-deployments')
  const [filter, setFilter] = React.useState('')
  const debouncedFilter = useDebounce(filter, 250)

  const { currentUser, isCurrentUserError } = useGetCurrentUser()
  const { userDeployments, isUserDeploymentsLoading, isUserDeploymentsError } = useGetUserDeployments(currentUser?._id)
  const { publicDeployments, isPublicDeploymentsLoading, isPublicDeploymentsError } = listPublicDeployments(debouncedFilter)

  const theme: any = useTheme() || lightTheme

  React.useEffect(() => {
    if (tab !== undefined && isTabOption(tab)) {
      setGroup(tab)
    }
  }, [tab])
  
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

  const handleGroupChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    router.push(`/deployments?tab=${newValue}`)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value)
  }

  const onFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
        <Tabs
          value={group}
          onChange={handleGroupChange}
          aria-label='basic tabs example'
          textColor={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
          indicatorColor='secondary'
        >
          <Tab label='My Deployments' value='my-deployments' />
          <Tab label='Public Deployments' value='public' />
        </Tabs>

        {group === 'my-deployments' &&
          <>
            <Box sx={{ pt: 2 }}>
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
                  <AccordionDetails sx={{ p: 2 }}>
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
                        <ModelNameFromKey modelId={key} fontVariant={'h5'} />
                        <Divider flexItem />
                        {groupedDeployments[key].map((deployment) => (
                          <Box sx={{ p: 1, m: 1, backgroundColor: theme.palette.mode === 'light' ? '#f3f1f1' : '#5a5a5a', borderRadius: 2 }} key={deployment.uuid}>
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
          </>
        }

        {group === 'public' && !isPublicDeploymentsLoading && !isPublicDeploymentsError &&        
          <>
            <Box sx={{ p: 2 }}>
                <Paper
                  component='form'
                  onSubmit={onFilterSubmit}
                  sx={{
                    p: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    width: '70%',
                    maxWidth: '400px',
                    margin: 'auto',
                    marginRight: 0,
                    marginBottom: 3,
                  }}
                >
                  <InputBase sx={{ ml: 1, flex: 1 }} placeholder='Filter Public Deployments' value={filter} onChange={handleFilterChange} />
                  <IconButton color='primary' type='submit' sx={{ p: '10px' }} aria-label='filter'>
                    <SearchIcon />
                  </IconButton>
                </Paper>
                {publicDeployments && publicDeployments?.map((deployment: PublicDeploymentDoc, index) => (
                  <Box key={`deployment-${deployment.uuid}`} sx={{ mt: 2 }}>
                    <Link href={`/deployment/public/${deployment?.uuid}`} passHref>
                      <MuiLink
                        variant='h5'
                        sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                      >
                        {deployment?.uuid}
                      </MuiLink>
                    </Link>
                    <Stack sx={{ pb: 1, pt: 1 }} spacing={1} direction='row'>
                      <Typography variant='body1'>Model:</Typography>
                      <ModelNameFromKey modelId={deployment.model.toString()} fontVariant={'body1'}/>
                    </Stack>
                    <Stack sx={{ pb: 1 }} spacing={1} direction='row'>
                      <Typography variant='body1'>Version:</Typography>
                      <VersionNameFromKey versionId={deployment.version.toString()} fontVariant={'body1'}/>
                    </Stack>
                    <Typography variant='body1' sx={{ marginBottom: 2 }}>
                      {displayDate(deployment?.createdAt)}
                    </Typography>
                    {index !== publicDeployments.length - 1 && (
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }} />
                    )}
                  </Box>
                ))}
                {publicDeployments?.length === 0 && <EmptyBlob text='No public deployments here' />}
              </Box>
          </>
        }

      </Paper>
    </Wrapper>
  )
}

export default Deployments
