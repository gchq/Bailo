import { ExpandMore } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  Modal,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { rerunImageArtefactScan, useGetImageScanResults } from 'actions/artefactScanning'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useCallback, useEffect, useEffectEvent, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Title from 'src/common/Title'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

interface VulnerabilityResultItem {
  cve: string
  description: string
  packageList: string[]
  severity: string
  toolName?: string
}

export default function ImageTagInformation() {
  const router = useRouter()
  const { modelId, name, tag }: { modelId?: string; name?: string; tag?: string } = router.query

  const {
    image: modelImage,
    isImageLoading,
    isImageError,
    mutateImages,
  } = useGetImageScanResults(modelId as string, name as string, tag as string)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const sendNotification = useNotification()

  const [formattedData, setFormattedData] = useState<VulnerabilityResultItem[]>([])
  const [lowResults, setLowResults] = useState(0)
  const [mediumResults, setMediumResults] = useState(0)
  const [highResults, setHighResults] = useState(0)
  const [criticalResults, setCriticalResults] = useState(0)
  const [unknownResults, setUnknownResults] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [open, setOpen] = useState(false)
  const [modelContent, setModalContent] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [filterList, setFilterList] = useState<string[]>([])
  const [lastRanAt, setLastRanAt] = useState('')

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const theme = useTheme()

  const setFormattedDataEvent = useEffectEvent(
    (
      data: VulnerabilityResultItem[],
      criticalResultsFound: number,
      highResultsFound: number,
      mediumResultsFound: number,
      lowResultsFound: number,
      unknownResultsFound: number,
      lastScanDate: string,
    ) => {
      setFormattedData(data)
      setCriticalResults(criticalResultsFound)
      setHighResults(highResultsFound)
      setMediumResults(mediumResultsFound)
      setLowResults(lowResultsFound)
      setUnknownResults(unknownResultsFound)
      setLastRanAt(lastScanDate !== '' ? formatDateTimeString(lastScanDate) : 'N/A')
      setPage(0)
    },
  )

  useEffect(() => {
    let resultList: VulnerabilityResultItem[] = []
    let criticalResults = 0
    let highResults = 0
    let mediumResults = 0
    let lowResults = 0
    let unknownResults = 0
    let lastScanDate = ''

    if (!modelImage) {
      return
    }
    if (modelImage.additionalInfo !== undefined) {
      for (const results of modelImage.additionalInfo) {
        if (
          results.additionalInfo !== undefined &&
          'Results' in results.additionalInfo &&
          results.additionalInfo.Results !== undefined
        ) {
          for (const result of results.additionalInfo.Results) {
            for (const vulnerability of result.Vulnerabilities) {
              const existingItem = resultList.find(
                (resultListItem) => resultListItem.cve === vulnerability.VulnerabilityID,
              )
              if (existingItem) {
                existingItem.packageList.push(vulnerability.PkgID)
              } else {
                switch (vulnerability.Severity) {
                  case 'CRITICAL':
                    criticalResults++
                    break
                  case 'HIGH':
                    highResults++
                    break
                  case 'MEDIUM':
                    mediumResults++
                    break
                  case 'LOW':
                    lowResults++
                    break
                  case 'UNKNOWN':
                    unknownResults++
                }
                lastScanDate = results.lastRunAt
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
    if (filterList.length > 0) {
      resultList = resultList.filter((resultListItem) => filterList.includes(resultListItem.severity))
    }
    setFormattedDataEvent(
      resultList,
      criticalResults,
      highResults,
      mediumResults,
      lowResults,
      unknownResults,
      lastScanDate,
    )
  }, [filterList, name, modelImage, tag, modelId])

  const handleModalOpen = useCallback((cve: string, description: string) => {
    handleOpen()
    setModalContent(description)
    setModalTitle(cve)
  }, [])

  const displayDescriptionSummary = (description: string) => {
    if (description.includes('Issue summary') && description.includes('Impact summary')) {
      return description.substring(
        description.indexOf('Issue summary: ') + 15,
        description.lastIndexOf('Impact summary'),
      )
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
              <ListItem key={packageId}>{packageId}</ListItem>
            ))}
          </List>
        </TableCell>
        <TableCell>
          <Stack spacing={2}>
            <Typography>{displayDescriptionSummary(row.description)}</Typography>
            {row.description.startsWith('Issue summary') && (
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

  const handleRescan = useCallback(async () => {
    const response = await rerunImageArtefactScan(modelId as string, name as string, tag as string)
    if (response.status === 200) {
      sendNotification({
        variant: 'success',
        msg: `Starting manual re-scan of ${name}:${tag}`,
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
          <Stack spacing={6}>
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
            <Box width='fit-content'>
              <CodeLine line={`${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelId}/${name}:${tag}`} />
            </Box>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={4}
              alignItems='center'
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Image size</Typography>
                <Typography>{modelImage.imageSize ? prettyBytes(modelImage.imageSize) : 'Unknown size'}</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Last scanned</Typography>
                <Typography>{lastRanAt}</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Vulnerabilities</Typography>
                <VulnerabilityResult
                  low={lowResults}
                  medium={mediumResults}
                  high={highResults}
                  critical={criticalResults}
                  unknown={unknownResults}
                  onRescan={handleRescan}
                />
              </Stack>
            </Stack>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
                <Typography fontWeight='bold'>Vulnerability report</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {formattedData.length === 0 && <EmptyBlob text='No vulnerabilities found' />}
                {formattedData.length > 0 && (
                  <Stack spacing={2}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Typography>Filters:</Typography>
                      <Chip
                        color={filterList.includes('CRITICAL') ? 'secondary' : 'default'}
                        onClick={() => handleFilterListChipOnClick('CRITICAL')}
                        label='Critical'
                      />
                      <Chip
                        color={filterList.includes('HIGH') ? 'secondary' : 'default'}
                        onClick={() => handleFilterListChipOnClick('HIGH')}
                        label='High'
                      />
                      <Chip
                        color={filterList.includes('MEDIUM') ? 'secondary' : 'default'}
                        onClick={() => handleFilterListChipOnClick('MEDIUM')}
                        label='Medium'
                      />
                      <Chip
                        color={filterList.includes('LOW') ? 'secondary' : 'default'}
                        onClick={() => handleFilterListChipOnClick('LOW')}
                        label='Low'
                      />
                      <Chip
                        color={filterList.includes('UNKNOWN') ? 'secondary' : 'default'}
                        onClick={() => handleFilterListChipOnClick('UNKNOWN')}
                        label='Unknown'
                      />
                    </Stack>
                    <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
                      <Table sx={{ minWidth: 650 }} size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>CVE name</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Package List</TableCell>
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
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Paper>
      </Container>
      <Modal open={open} onClose={handleClose} aria-label='full-cve-description-modal'>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant='h6' component='h2'>
            {modalTitle}
          </Typography>
          <MarkdownDisplay>{modelContent}</MarkdownDisplay>
        </Box>
      </Modal>
    </>
  )
}
