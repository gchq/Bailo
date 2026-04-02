import { Clear, ExpandMore, Refresh } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { rerunImageArtefactScan, useGetImageScanResults } from 'actions/artefactScanning'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import EmptyBlob from 'src/common/EmptyBlob'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Title from 'src/common/Title'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

interface VulnerabilityResultItem {
  cve: string
  description: string
  packageList: string[]
  severity: string
}

export default function ImageTagInformation() {
  const router = useRouter()
  const { modelId, name, tag }: { modelId?: string; name?: string; tag?: string } = router.query
  const fakePlatforms = ['linux/amd64', 'linux/arm64', 'linux/x86_64']
  const {
    image: modelImage,
    isImageLoading,
    isImageError,
    mutateImages,
  } = useGetImageScanResults(modelId as string, name as string, tag as string, 'ubuntu/x86_64' as string)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const sendNotification = useNotification()

  const [formattedData, setFormattedData] = useState<VulnerabilityResultItem[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [open, setOpen] = useState(false)
  const [modelContent, setModalContent] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [filterList, setFilterList] = useState<string[]>([])
  const [toolName, setToolName] = useState('')

  const [selectedPlatform, setSelectedPlatform] = useState(fakePlatforms[0])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const theme = useTheme()

  const setFormattedDataEvent = useEffectEvent((data: VulnerabilityResultItem[]) => {
    setFormattedData(data)
    setPage(0)
  })

  const handleFilterListChipOnClick = useCallback(
    (filter: string) => {
      if (filterList.includes(filter)) {
        setFilterList((list) => list.filter((item) => item !== filter))
      } else {
        setFilterList([...filterList, filter])
      }
    },
    [filterList],
  )

  const updateToolName = useEffectEvent((resultToolName: string) => {
    setToolName(resultToolName)
  })

  const chipFilters = useMemo(() => {
    return ['Critical', 'High', 'Medium', 'Low', 'Unknown'].map((filter) => (
      <Chip
        key={filter}
        color={filterList.includes(filter.toUpperCase()) ? 'secondary' : 'default'}
        onClick={() => handleFilterListChipOnClick(filter.toUpperCase())}
        label={filter}
      />
    ))
  }, [filterList, handleFilterListChipOnClick])

  useEffect(() => {
    let resultList: VulnerabilityResultItem[] = []

    if (!modelImage) {
      return
    }

    if (modelImage.scanResults !== undefined) {
      for (const results of modelImage.scanResults) {
        updateToolName(results.toolName)
        if (
          results.additionalInfo !== undefined &&
          'Results' in results.additionalInfo &&
          results.additionalInfo.Results !== undefined
        ) {
          for (const result of results.additionalInfo.Results) {
            if (result.Vulnerabilities) {
              for (const vulnerability of result.Vulnerabilities) {
                const existingItem = resultList.find(
                  (resultListItem) => resultListItem.cve === vulnerability.VulnerabilityID,
                )
                if (existingItem) {
                  existingItem.packageList.push(vulnerability.PkgID)
                } else {
                  resultList.push({
                    cve: vulnerability.VulnerabilityID,
                    description: vulnerability.Description,
                    severity: vulnerability.Severity,
                    packageList: [vulnerability.PkgID],
                  })
                }
              }
            }
          }
        }
      }
    }
    if (filterList.length > 0) {
      resultList = resultList.filter((resultListItem) => filterList.includes(resultListItem.severity))
    }
    setFormattedDataEvent(resultList)
  }, [filterList, name, modelImage, tag, modelId])

  const handleModalOpen = useCallback((cve: string, description: string) => {
    handleOpen()
    setModalContent(description)
    setModalTitle(cve)
  }, [])

  const displayDescriptionSummary = (description: string) => {
    if (description.includes('Issue summary') || description.includes('Impact summary')) {
      return description.substring(
        description.indexOf('Issue summary: ') + 15,
        description.lastIndexOf('Impact summary'),
      )
    } else if (description.length > 250) {
      return description.substring(0, 250) + '...'
    } else {
      return description
    }
  }

  const tableRows = useCallback(() => {
    return formattedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
      <TableRow key={row.cve + index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          {row.cve}
        </TableCell>
        <TableCell>{row.severity.toUpperCase()}</TableCell>
        <TableCell>
          <List dense>
            {row.packageList.map((packageId) => (
              <ListItem key={packageId} sx={{ pl: 0 }}>
                {packageId}
              </ListItem>
            ))}
          </List>
        </TableCell>
        <TableCell>
          <Stack spacing={2}>
            <MarkdownDisplay>{displayDescriptionSummary(row.description)}</MarkdownDisplay>
            {(row.description.startsWith('Issue summary') || row.description.length > 250) && (
              <Button onClick={() => handleModalOpen(row.cve, row.description)}>Read full description</Button>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    ))
  }, [formattedData, page, rowsPerPage, handleModalOpen])

  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleRescan = useCallback(async () => {
    const response = await rerunImageArtefactScan(modelId as string, name as string, tag as string)
    if (response.status === 200) {
      sendNotification({
        variant: 'success',
        msg: `The image ${name}:${tag} is being rescanned`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      mutateImages()
    } else {
      sendNotification({
        variant: 'error',
        msg: await getErrorMessage(response),
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }, [modelId, mutateImages, name, sendNotification, tag])

  const handleClearFiltersButton = useCallback(() => {
    setFilterList([])
  }, [])

  if (isImageError) {
    return <MessageAlert message={isImageError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isImageLoading || isUiConfigLoading || !modelImage) {
    return <Loading />
  }

  return (
    <>
      <Title text={name && tag ? `${name}:${tag}` : 'Loading...'} />
      <Container maxWidth='xl' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={2}
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Link href={`/model/${modelId}?tab=registry`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to model
                </Button>
              </Link>
              <Stack overflow='hidden' direction='row' alignItems='center'>
                <Typography overflow='hidden' textOverflow='ellipsis' variant='h6' component='h1' color='primary'>
                  {name && tag ? `${name}:${tag}` : 'Loading...'}
                </Typography>
                <CopyToClipboardButton
                  textToCopy={''}
                  notificationText='Copied image name and tag to clipboard'
                  ariaLabel='copy image name and tag to clipboard'
                />
              </Stack>
            </Stack>
            <Stack spacing={1}>
              <Stack direction={'row'} spacing={4}>
                <Stack direction={'column'}>
                  <Typography fontWeight='bold'>URI</Typography>
                  <Box width='fit-content'>
                    <CodeLine
                      line={`docker pull ${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelId}/${name}:${tag}`}
                    />
                  </Box>
                </Stack>
                <Stack direction={'column'}>
                  <Typography fontWeight='bold'>OS/Arch</Typography>
                  <LabelledInput fullWidth label='' htmlFor={''}>
                    <Select
                      required
                      fullWidth
                      value={selectedPlatform}
                      size='small'
                      onChange={(event) => setSelectedPlatform(event.target.value)}
                    >
                      {fakePlatforms.map((platform) => (
                        <MenuItem value={platform} key={platform}>
                          {platform}
                        </MenuItem>
                      ))}
                    </Select>
                  </LabelledInput>
                </Stack>
              </Stack>
            </Stack>
            <Stack
              direction={{ md: 'row', sm: 'column' }}
              spacing={{ md: 4, sm: 1 }}
              alignItems='flex-start'
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Stack spacing={1}>
                <Typography variant='h6' fontWeight='bold'>
                  Compressed image size
                </Typography>
                <Typography>{prettyBytes(modelImage.imageSize)}</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant='h6' fontWeight='bold'>
                  Vulnerabilities
                </Typography>
                <Stack direction='row'>
                  <VulnerabilityResult results={modelImage} />
                  <Tooltip title='Rerun image scan'>
                    <IconButton size='small' onClick={handleRescan} sx={{ mx: 1 }}>
                      <Refresh color='primary' />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              <Stack spacing={1}>
                <Typography variant='h6' fontWeight='bold'>
                  Scanning tool
                </Typography>
                <Typography>{toolName}</Typography>
              </Stack>
            </Stack>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
                <Typography variant='h6' fontWeight='bold'>
                  Vulnerability report
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Typography>Filters:</Typography>
                    {chipFilters}
                    {filterList.length > 0 && (
                      <Button
                        startIcon={<Clear />}
                        onClick={handleClearFiltersButton}
                        aria-label='Clear vulnerability table filters'
                      >
                        Clear
                      </Button>
                    )}
                    <Typography>{`(Showing ${plural(formattedData.length, 'result')})`}</Typography>
                  </Stack>
                  {formattedData.length === 0 && <EmptyBlob text='No vulnerabilities found' />}
                  {formattedData.length > 0 && (
                    <>
                      <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
                        <Table sx={{ minWidth: 650 }} size='small'>
                          <TableHead>
                            <TableRow>
                              <TableCell>CVE name</TableCell>
                              <TableCell>Severity</TableCell>
                              <TableCell>Package list</TableCell>
                              <TableCell>Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>{tableRows()}</TableBody>
                        </Table>
                      </Box>
                      <TablePagination
                        rowsPerPageOptions={[10]}
                        component='div'
                        count={formattedData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Paper>
      </Container>
      <Dialog open={open} onClose={handleClose} aria-label='full-cve-description-dialog' maxWidth='lg'>
        <DialogTitle variant='h6' component='h2'>
          {modalTitle}
        </DialogTitle>
        <DialogContent>
          <MarkdownDisplay>{modelContent}</MarkdownDisplay>
        </DialogContent>
        <DialogActions>
          <Button aria-label='Close dialog button' variant='contained' onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
