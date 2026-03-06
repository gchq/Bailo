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
import { rerunImageArtefactScan, useGetImageScanResults } from 'actions/artefactScanning'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { ChangeEvent, useCallback, useEffect, useEffectEvent, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Title from 'src/common/Title'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import useNotification from 'src/hooks/useNotification'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { ImageScanDetail } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

interface VulnerabilityResultItem {
  cve: string
  description: string
  packageList: string[]
  severity: string
  toolName: string
}

export default function ImageTagInformation() {
  const router = useRouter()
  const { modelId, name, tag }: { modelId?: string; name?: string; tag?: string } = router.query

  const { images, isImagesLoading, isImagesError, mutateImages } = useGetImageScanResults(
    modelId as string,
    ImageScanDetail.FULL,
  )
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

  const modelImage = images.find((image) => image.name === name)

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
    const imageForModel = images.find((image) => image.repository === modelId)

    if (!imageForModel) {
      return
    }
    const scanResultsForTag = imageForModel.scanResults.find((scanResult) => scanResult.tag === tag)

    if (scanResultsForTag) {
      for (const result of scanResultsForTag.results) {
        if (result.imageScanDetail === ImageScanDetail.FULL && result.additionalInfo !== undefined) {
          if (result.additionalInfo['Results'] !== undefined) {
            for (const results of result.additionalInfo['Results']) {
              for (const vulnerability of results.Vulnerabilities) {
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
                  lastScanDate = result.lastRunAt
                  resultList.push({
                    cve: vulnerability.VulnerabilityID,
                    description: vulnerability.Description,
                    severity: vulnerability.Severity,
                    toolName: result.toolName,
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
    setFormattedDataEvent(
      resultList,
      criticalResults,
      highResults,
      mediumResults,
      lowResults,
      unknownResults,
      lastScanDate,
    )
  }, [filterList, name, images, tag, modelId])

  const handleModalOpen = useCallback((cve: string, description: string) => {
    handleOpen()
    setModalContent(description)
    setModalTitle(cve)
  }, [])

  const tableRows = useCallback(() => {
    return formattedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
      <TableRow key={row.cve + index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          {row.cve}
        </TableCell>
        <TableCell>{row.severity.toUpperCase()}</TableCell>
        <TableCell>
          <List>
            {row.packageList.map((packageId) => (
              <ListItem key={packageId}>{packageId}</ListItem>
            ))}
          </List>
        </TableCell>
        <TableCell>
          <Button onClick={() => handleModalOpen(row.cve, row.description)}>Read full description</Button>
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
      mutateImages()
    } else {
      sendNotification({
        variant: 'error',
        msg: await getErrorMessage(response),
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }, [modelId, mutateImages, name, sendNotification, tag])

  if (isImagesError) {
    return <MessageAlert message={isImagesError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isImagesLoading || isUiConfigLoading || !modelImage) {
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
            <Box width='fit-content'>
              <CodeLine
                line={`${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${tag}`}
              />
            </Box>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={4}
              alignItems='center'
              divider={<Divider flexItem orientation='vertical' />}
            >
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
                <Stack spacing={2}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Typography sx={{ pl: 2 }}>Filters:</Typography>
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
                  <Table sx={{ minWidth: 650 }}>
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
