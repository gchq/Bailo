import Info from '@mui/icons-material/Info'
import DownArrow from '@mui/icons-material/KeyboardArrowDownTwoTone'
import UpArrow from '@mui/icons-material/KeyboardArrowUpTwoTone'
import RestartAlt from '@mui/icons-material/RestartAltTwoTone'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import MuiLink from '@mui/material/Link'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import copy from 'copy-to-clipboard'
import { useRouter } from 'next/router'
import React, { MouseEvent, useEffect, useMemo, useState } from 'react'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { useGetModelVersions } from '@/data/model'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { ModelUploadType } from '@/types/interfaces'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import { Node, Edge } from 'reactflow'
import { ModelDoc } from '../../server/models/Model'
import { useGetDeployment } from '../../data/deployment'
import { useGetUiConfig } from '../../data/uiConfig'
import { useGetCurrentUser } from '../../data/user'
import ApprovalsChip from '../../src/common/ApprovalsChip'
import DeploymentOverview from '../../src/DeploymentOverview'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import TerminalLog from '../../src/TerminalLog'
import Wrapper from '../../src/Wrapper'
import { createDeploymentComplianceFlow } from '../../utils/complianceFlow'
import { postEndpoint } from '../../data/api'
import RawModelExportList from '../../src/RawModelExportList'
import DisabledElementTooltip from '../../src/common/DisabledElementTooltip'
import { getErrorMessage } from '../../utils/fetcher'
import useNotification from '../../src/common/Snackbar'

const ComplianceFlow = dynamic(() => import('../../src/ComplianceFlow'))

type TabOptions = 'overview' | 'compliance' | 'build' | 'settings' | 'exports'

function isTabOption(value: string): value is TabOptions {
  return ['overview', 'compliance', 'build', 'exports', 'settings'].includes(value)
}

function CodeLine({ line }) {
  const theme = useTheme()
  const sendNotification = useNotification()

  const handleButtonClick = () => {
    navigator.clipboard.writeText(line)
    sendNotification({ variant: 'success', msg: 'Copied to clipboard' })
  }

  return (
    <div
      style={{
        cursor: 'pointer',
      }}
      role='button'
      tabIndex={0}
      onClick={() => {
        handleButtonClick()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleButtonClick()
        }
      }}
    >
      <Tooltip title='Copy to clipboard' arrow>
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 1, borderRadius: 2 }}>
          $ <b>{line}</b>
        </Box>
      </Tooltip>
    </div>
  )
}

export default function Deployment() {
  const router = useRouter()
  const { uuid, tab }: { uuid?: string; tab?: TabOptions } = router.query

  const [group, setGroup] = useState<TabOptions>('overview')
  const [complianceFlow, setComplianceFlow] = useState<{ edges: Edge[]; nodes: Node[] }>({ edges: [], nodes: [] })
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const [imageName, setImageName] = useState('')
  const [selectedImageTag, setSelectedImageTag] = useState('')

  const actionOpen = anchorEl !== null

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { deployment, isDeploymentLoading, isDeploymentError, mutateDeployment } = useGetDeployment(uuid, true)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const model: ModelDoc = deployment?.model as ModelDoc
  const { versions } = useGetModelVersions(model?.uuid)

  const theme = useTheme()
  const sendNotification = useNotification()

  const versionOptions = useMemo(() => {
    if (!versions || !model) return []

    setSelectedImageTag(versions?.filter((versionToFilter) => versionToFilter._id === model.latestVersion)[0].version)

    return versions
      .filter(
        (version) =>
          version.metadata?.buildOptions?.uploadType === ModelUploadType.Docker ||
          version.metadata?.buildOptions?.uploadType === ModelUploadType.Zip
      )
      .map((version) => (
        <MenuItem value={version.version} key={`version-${version.version}`}>
          {version.version}
          {version._id === model.latestVersion ? ' (Latest version)' : ''}
        </MenuItem>
      ))
  }, [versions, model])

  useEffect(() => {
    if (deployment && uiConfig) {
      const { modelID } = deployment.metadata.highLevelDetails
      setImageName(`${uiConfig?.registry.host}/${deployment.uuid}/${modelID}`)
    }
  }, [deployment, uiConfig])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    router.push(`/deployment/${uuid}?tab=${newValue}`)
  }

  useEffect(() => {
    if (tab !== undefined && isTabOption(tab)) {
      setGroup(tab)
    }
  }, [tab])

  useEffect(() => {
    if (deployment) {
      setComplianceFlow(createDeploymentComplianceFlow(deployment))
    }
  }, [deployment])

  const handleClickOpen = () => {
    if (!isDeploymentLoading && deployment !== undefined) {
      setOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const actionMenuClicked = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLDivElement)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const onSelectedTagChange = (event: SelectChangeEvent) => {
    setSelectedImageTag(event.target.value)
  }

  const copyDeploymentCardToClipboard = () => {
    copy(JSON.stringify(deployment?.metadata, null, 2))
    sendNotification({ variant: 'success', msg: 'Copied deployment metadata to clipboard' })
  }

  const error = MultipleErrorWrapper(`Unable to load deployment page`, {
    isDeploymentError,
    isUiConfigError,
    isCurrentUserError,
  })
  if (error) return error

  const Loading = <Wrapper title='Loading...' page='deployment' />

  if (isDeploymentLoading || !deployment) return Loading
  if (isUiConfigLoading || !uiConfig) return Loading
  if (isCurrentUserLoading || !currentUser) return Loading

  const requestApprovalReset = async () => {
    const response = await postEndpoint(`/api/v1/deployment/${deployment?.uuid}/reset-approvals`, {})

    if (response.ok) {
      sendNotification({ variant: 'success', msg: 'Approvals reset' })
      mutateDeployment()
    } else {
      sendNotification({ variant: 'error', msg: await getErrorMessage(response) })
    }
  }

  return (
    <>
      <Wrapper title={`Deployment: ${deployment.metadata.highLevelDetails.name}`} page='deployment'>
        {deployment && (
          <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ pb: 3 }}>
            <Button
              variant='text'
              color='primary'
              startIcon={<ArrowBackIosNewIcon />}
              onClick={() => router.push(`/model/${(deployment.model as ModelDoc).uuid}`)}
            >
              Back to model
            </Button>
            <Button variant='outlined' color='primary' startIcon={<Info />} onClick={handleClickOpen}>
              Show download commands
            </Button>
          </Stack>
        )}
        <Paper sx={{ p: 3 }}>
          <Stack direction='row' spacing={2}>
            <ApprovalsChip
              approvals={[{ reviewers: deployment.metadata.contacts.owner, status: deployment.managerApproved }]}
            />
            <Divider orientation='vertical' flexItem />
            <Button
              id='model-actions-button'
              aria-controls='model-actions-menu'
              aria-haspopup='true'
              aria-expanded={actionOpen ? 'true' : undefined}
              onClick={actionMenuClicked}
              variant='outlined'
              data-test='requestDeploymentButton'
              endIcon={actionOpen ? <UpArrow /> : <DownArrow />}
            >
              Actions
            </Button>
          </Stack>
          <Menu anchorEl={anchorEl as HTMLDivElement} open={actionOpen} onClose={handleMenuClose}>
            <MenuList>
              <DisabledElementTooltip
                conditions={[
                  deployment?.managerApproved === 'No Response'
                    ? 'Deployment needs to have been responded to before it can have its approvals reset.'
                    : '',
                ]}
              >
                <MenuItem onClick={requestApprovalReset} disabled={deployment?.managerApproved === 'No Response'}>
                  <ListItemIcon>
                    <RestartAlt fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Reset approvals</ListItemText>
                </MenuItem>
              </DisabledElementTooltip>
            </MenuList>
          </Menu>
          <Box sx={{ borderBottom: 1, marginTop: 1, borderColor: 'divider' }}>
            <Tabs value={group} onChange={handleTabChange} aria-label='basic tabs example'>
              <Tab label='Overview' value='overview' />
              <Tab label='Compliance' value='compliance' />
              <Tab label='Build Logs' value='build' />
              <Tab label='Settings' value='settings' />
              <Tab
                style={{ pointerEvents: 'auto' }}
                disabled={deployment.managerApproved !== 'Accepted'}
                value='exports'
                label={
                  <DisabledElementTooltip
                    conditions={[
                      deployment.managerApproved !== 'Accepted'
                        ? 'Deployment needs to be approved before you can view the exported model list.'
                        : '',
                    ]}
                    placement='top'
                  >
                    Model Exports
                  </DisabledElementTooltip>
                }
                data-test='modelExportsTab'
              />
            </Tabs>
          </Box>
          <Box sx={{ marginBottom: 3 }} />

          {group === 'overview' && <DeploymentOverview deployment={deployment} />}

          {group === 'compliance' && (
            <ComplianceFlow initialEdges={complianceFlow.edges} initialNodes={complianceFlow.nodes} />
          )}

          {group === 'build' && <TerminalLog logs={deployment.logs} title='Deployment Build Logs' />}

          {group === 'settings' && (
            <>
              <Typography variant='h6' sx={{ mb: 1 }}>
                General
              </Typography>
              <Box mb={2}>
                <Button variant='outlined' onClick={copyDeploymentCardToClipboard}>
                  Copy deployment metadata to clipboard
                </Button>
              </Box>
            </>
          )}

          {group === 'exports' && deployment.managerApproved === 'Accepted' && (
            <RawModelExportList deployment={deployment} />
          )}
        </Paper>
      </Wrapper>
      <Dialog maxWidth='lg' onClose={handleClose} open={open}>
        <DialogTitle sx={{ backgroundColor: theme.palette.container.main }}>Pull from Docker</DialogTitle>
        {versions && (
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Select a version</InputLabel>
                {versions && model && (
                  <Select value={selectedImageTag} label='Select a version' onChange={onSelectedTagChange}>
                    {versionOptions}
                  </Select>
                )}
              </FormControl>
            </Box>
            <DialogContentText sx={{ p: 2 }}>
              {selectedImageTag && (
                <Box>
                  <p style={{ margin: 0 }}>
                    # Login to Docker (your token can be found on the
                    <Link href='/settings' passHref>
                      <MuiLink sx={{ ml: 0.5, mr: 0.5, color: theme.palette.secondary.main }}>settings</MuiLink>
                    </Link>
                    page)
                  </p>
                  <CodeLine line={`docker login ${uiConfig.registry.host} -u ${currentUser.id}`} />
                  <br />

                  <p style={{ margin: 0 }}># Pull model</p>
                  <CodeLine line={`docker pull ${imageName}:${selectedImageTag}`} />
                  <br />

                  <p style={{ margin: 0 }}># Run Docker image</p>
                  <CodeLine line={`docker run -p 9000 ${imageName}:${selectedImageTag}`} />
                  <br />

                  <p style={{ margin: 0 }}># Check that the Docker container is running</p>
                  <CodeLine line='docker ps' />
                  <br />

                  <p style={{ margin: 0 }}># The model is accessible at localhost:9000</p>
                </Box>
              )}
            </DialogContentText>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
