import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import MuiLink from '@mui/material/Link'
import Snackbar from '@mui/material/Snackbar'
import copy from 'copy-to-clipboard'
import UploadIcon from '@mui/icons-material/Upload'
import EditIcon from '@mui/icons-material/Edit'
import PostAddIcon from '@mui/icons-material/PostAdd'
import Favorite from '@mui/icons-material/Favorite'
import DownArrow from '@mui/icons-material/KeyboardArrowDown'
import UpArrow from '@mui/icons-material/KeyboardArrowUp'

import TerminalLog from 'src/TerminalLog'
import Wrapper from 'src/Wrapper'
import ModelOverview from 'src/ModelOverview'
import createComplianceFlow from 'utils/complianceFlow'
import { FlowElement } from 'react-flow-renderer'
import {
  useGetModelVersions,
  useGetModelVersion,
  useGetModelDeployments,
} from 'data/model'
import { getCurrentUser } from 'data/user'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { setTargetValue } from 'data/utils'
import Link from 'next/link'
import EmptyBlob from '../../src/common/EmptyBlob'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import { Deployment, Version } from '../../types/interfaces'
import ApprovalsChip from 'src/common/ApprovalsChip'
import Menu from '@mui/material/Menu'
import MenuList from '@mui/material/MenuList'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import { postEndpoint } from 'data/api'
import dynamic from 'next/dynamic'

const ComplianceFlow = dynamic(() => import('../../src/ComplianceFlow'))

type TabOptions = 'overview' | 'compliance' | 'build' | 'deployments' | 'settings'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

const Model = () => {
  const router = useRouter()
  const { uuid }: { uuid?: string } = router.query

  const { currentUser, isCurrentUserLoading } = getCurrentUser()

  const [group, setGroup] = useState<TabOptions>('overview')
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined)
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [modelFavourited, setModelFavourited] = useState<boolean>(false)
  const open = Boolean(anchorEl);

  const [copyModelCardSnackbarOpen, setCopyModelCardSnackbarOpen] = useState(false)

  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(uuid)
  const { version, isVersionLoading, isVersionError, mutateVersion } = useGetModelVersion(uuid, selectedVersion)
  const { deployments, isDeploymentsLoading } = useGetModelDeployments(uuid)

  const [complianceFlow, setComplianceFlow] = useState<FlowElement<any>[]>([])

  const onVersionChange = setTargetValue(setSelectedVersion)

  const handleGroupChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    mutateVersion()
  }

  const requestDeployment = () => {
    router.push(`/model/${uuid}/deploy`)
  }

  const copyModelCardToClipboard = () => {
    copy(JSON.stringify(version?.metadata, null, 2))
    setCopyModelCardSnackbarOpen(true)
  }

  const handleCopyModelCardSnackbarClose = () => {
    setCopyModelCardSnackbarOpen(false)
  }

  useEffect(() => {
    if (version) {
      setComplianceFlow(createComplianceFlow(version))
    }
  }, [version])

  useEffect(() => {
    if (!isCurrentUserLoading && currentUser !== undefined && version?.model !== undefined) {
      setModelFavourited(currentUser.favourites.includes(version?.model))
    }
  }, [currentUser, version])

  const error = MultipleErrorWrapper(`Unable to load model page`, {
    isVersionsError,
    isVersionError,
  })
  if (error) return error

  if (isVersionsLoading || isVersionLoading || isDeploymentsLoading) {
    return <Wrapper title={'Loading...'} page={'model'} />
  }

  const editModel = () => {
    router.push(`/upload?mode=edit&modelUuid=${uuid}&version=${version?.version}`)
  }

  const uploadNewVersion = () => {
    router.push(`/upload?mode=newVersion&modelUuid=${uuid}`)
  }  

  const actionMenuClicked = (event) => {
    setAnchorEl(event.currentTarget);
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleFavourite = async() => {
    if (version?.model !== undefined) {
      const apiAddress = currentUser?.favourites.includes(version?.model) ? 'unfavourite' : 'favourite'
      await postEndpoint(`/api/v1/user/${apiAddress}/${version?.model}`, {}
      ).then(async (res) => {
        return res.text()
      }).then(function(data) {
        const updatedUser = JSON.parse(data);
        setModelFavourited(updatedUser.favourites.includes(version?.model))
      });
    }
  }

  return (
    <Wrapper title={`Model: ${version!.metadata.highLevelDetails.name}`} page={'model'}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Grid container justifyContent='space-between' alignItems='center'>
            <Stack direction='row' spacing={2}>
              <ApprovalsChip approvals={[version?.managerApproved, version?.reviewerApproved]}/>
              <Button
                id="model-actions-button"
                aria-controls="model-actions-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={actionMenuClicked}
                variant='outlined'
                data-test="requestDeploymentButton"
                endIcon={open ? <UpArrow /> : <DownArrow />}
              >
                Actions
              </Button>                         
            </Stack>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
            >
              <MenuList>
                <MenuItem
                  onClick={requestDeployment} 
                  disabled={!version!.built || version?.managerApproved !== 'Accepted' || version?.reviewerApproved !== 'Accepted'}
                  data-test="submitDeployment"
                >
                  <ListItemIcon>
                    <UploadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Request deployment</ListItemText>                
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={toggleFavourite}                  
                >
                  {!modelFavourited &&
                    <>
                      <ListItemIcon>
                        <FavoriteBorder fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Favourite</ListItemText>
                    </>
                  }
                  {modelFavourited &&
                    <>
                      <ListItemIcon>
                        <Favorite fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Unfavourite</ListItemText>
                    </>
                  }              
                </MenuItem>
                <MenuItem
                  onClick={editModel} 
                  disabled={(version?.managerApproved === 'Accepted' 
                    && version?.reviewerApproved === 'Accepted') 
                    || currentUser?.id !== version?.metadata?.contacts?.uploader
                  }
                >
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Edit</ListItemText>                
                </MenuItem>
                <MenuItem
                  onClick={uploadNewVersion} 
                  disabled={currentUser?.id !== version?.metadata?.contacts?.uploader}
                >
                  <ListItemIcon>
                    <PostAddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Upload new version</ListItemText>
                </MenuItem>              
              </MenuList>
            </Menu>
            <Stack direction='row' spacing={2}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel id='version-label'>Version</InputLabel>
                <Select
                  labelId='version-label'
                  id='version'
                  value={version!.version}
                  label='Version'
                  onChange={onVersionChange}
                >
                  {versions!.map((versionObj: Version, index: number) => (
                    <MenuItem key={`item-${index}`} value={versionObj.version}>
                      {versionObj.version}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          <Tabs indicatorColor='secondary' value={group} onChange={handleGroupChange} aria-label='basic tabs example'>
            <Tab label='Overview' value='overview' />
            <Tab label='Compliance' value='compliance' />
            <Tab label='Build Logs' value='build' />
            <Tab label='Deployments' value='deployments' />
            <Tab label='Settings' value='settings' />
          </Tabs>
        </Box>
        <Box sx={{ marginBottom: 3 }} />

        {group === 'overview' && <ModelOverview version={version} />}

        {group === 'compliance' && (
          <>
            <ComplianceFlow initialElements={complianceFlow} />
          </>
        )}

        {group === 'build' && <TerminalLog logs={version!.logs} title='Model Build Logs' />}

        {group === 'deployments' && (
          <>
            {deployments!.length === 0 && <EmptyBlob text='No deployments here' />}
            {deployments!.map((deployment: Deployment, index: number) => (
              <Box key={`deployment-${index}`}>
                <Link href={`/deployment/${deployment.uuid}`} passHref>
                  <MuiLink variant='h5' sx={{ fontWeight: '500', textDecoration: 'none' }}>
                    {deployment.metadata.highLevelDetails.name}
                  </MuiLink>
                </Link>

                <Typography variant='body1' sx={{ marginBottom: 2 }}>
                  Contacts: {deployment.metadata.contacts.requester}, {deployment.metadata.contacts.secondPOC}
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }} />
              </Box>
            ))}
          </>
        )}

        {group === 'settings' && (
          <>
            <Typography variant='h6' sx={{ mb: 1 }}>
              General
            </Typography>

            <Box mb={2}>
              <Button variant='outlined' onClick={copyModelCardToClipboard}>
                Copy Model Card to Clipboard
              </Button>
              <Snackbar
                open={copyModelCardSnackbarOpen}
                autoHideDuration={6000}
                onClose={handleCopyModelCardSnackbarClose}
              >
                <Alert onClose={handleCopyModelCardSnackbarClose} severity='success' sx={{ width: '100%' }}>
                  Copied model card to clipboard
                </Alert>
              </Snackbar>
            </Box>

            <Box sx={{ mb: 4 }} />

            <Typography variant='h6' sx={{ mb: 1 }}>
              Danger Zone
            </Typography>
            <Button variant='outlined' color='error'>
              Delete Model
            </Button>
          </>
        )}
      </Paper>
    </Wrapper>
  )
}

export default Model
