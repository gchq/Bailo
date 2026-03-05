import { ExpandMore } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Divider,
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
import { useGetModelImages } from 'actions/entry'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { ChangeEvent, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import CodeLine from 'src/entry/model/registry/CodeLine'
import VulnerabilityResult from 'src/entry/model/registry/VulnerabilityResult'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'

interface VulnerabilityResultItem {
  cve: string
  description: string
  severity: string
  toolName: string
  lastRanAt: string
}

export default function ImageTagInformation() {
  const router = useRouter()
  const { modelId, name, tag }: { modelId?: string; name?: string; tag?: string } = router.query

  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(modelId)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const [formattedData, setFormattedData] = useState<VulnerabilityResultItem[]>([])
  const [lowResults, setLowResults] = useState(0)
  const [mediumResults, setMediumResults] = useState(0)
  const [highResults, setHighResults] = useState(0)
  const [criticalResults, setCriticalResults] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const modelImage = modelImages.find((image) => image.name === name)

  const reportData = {
    images: [
      {
        repository: 's-h6p9f8',
        name: 'registry',
        tags: ['1.0.0'],
        scanResults: [
          {
            tag: '1.0.0',
            results: [
              {
                _id: '699f181235719baf206db90f',
                artefactKind: 'image',
                layerDigest: 'sha256:22848737c0d272ad5d7c7369d8ca830a62929e63e38edcb22085139a6ae0688d',
                toolName: 'Trivy',
                scannerVersion: '0.69.1',
                state: 'complete',
                summary: [],
                lastRunAt: '2026-02-25T15:41:06.317Z',
                deleted: false,
                deletedBy: '',
                deletedAt: '',
                createdAt: '2026-02-25T15:41:06.076Z',
                updatedAt: '2026-02-25T15:41:06.318Z',
                __v: 0,
                imageScanDetail: 'summary',
              },
              {
                _id: '699f181235719baf206db911',
                artefactKind: 'image',
                layerDigest: 'sha256:6c6f69aa25501b090c54c62a9c17e978064c2f1328f67a7ef88c81ce5f2d7983',
                toolName: 'Trivy',
                scannerVersion: '0.69.1',
                state: 'complete',
                summary: [
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      "CVE-2022-30065 busybox: A use-after-free in Busybox's awk applet leads to denial of service",
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-42366 busybox: A heap-buffer-overflow',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2022-40674 expat: a use-after-free in the doContent function in xmlparse.c',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2022-43680 expat: use-after free caused by overeager destruction of a shared DTD in XML_ExternalEntityParserCreate',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-52425 expat: parsing large tokens can trigger a denial of service',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2024-28757 expat: XML Entity Expansion',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-52426 expat: recursive XML entity expansion vulnerability',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription: 'CVE-2022-23521 git: gitattributes parsing integer overflow',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2022-41903 git: Heap overflow in `git archive`, `git log --format` leading to RCE',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2022-24765 git: On multi-user machines Git users might find themselves unexpectedly in a Git worktree',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-29187 git: Bypass of safe.directory protections',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2022-39260 git: git shell function that splits command arguments can lead to arbitrary heap writes.',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-23946 git: git apply: a path outside the working tree can be overwritten with crafted input',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-25652 git: by feeding specially crafted input to `git apply --reject`, a path outside the working tree can be overwritten with partially controlled contents',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-29007 git: arbitrary configuration injection when renaming or deleting a section from a configuration file',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2022-39253 git: exposure of sensitive information to a malicious actor',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-22490 git: data exfiltration with maliciously crafted repository',
                  },
                  {
                    severity: 'low',
                    vulnerabilityDescription:
                      'CVE-2023-25815 git: malicious placement of crafted messages when git was compiled with runtime prefix',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2021-38561 golang: out-of-bounds read in golang.org/x/text/language leads to DoS',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-27191 golang: crash in a golang.org/x/crypto/ssh server',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-4450 openssl: double free after calling PEM_read_bio_ex',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2023-0215 openssl: use-after-free following BIO_new_NDEF',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-0286 openssl: X.400 address type confusion in X.509 GeneralName',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-0464 openssl: Denial of service by excessive resource usage in verifying X509 policy constraints',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-2097 openssl: AES OCB fails to encrypt some bytes',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-4304 openssl: timing attack in RSA Decryption implementation',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-0465 openssl: Invalid certificate policies in leaf certificates are silently ignored',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-2650 openssl: Possible DoS translating ASN.1 object identifiers',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-3446 openssl: Excessive time spent checking DH keys and parameters',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-3817 OpenSSL: Excessive time spent checking DH q parameter value',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-5678 openssl: Generating excessively long X9.42 DH keys or checking excessively long X9.42 DH keys or parameters may be very slow',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription: 'CVE-2022-32207 curl: Unpreserved file permissions',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription: 'CVE-2022-32221 curl: POST following PUT confusion',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription: 'CVE-2023-23914 curl: HSTS ignored on multiple requests',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2023-38545 curl: heap based buffer overflow in the SOCKS5 proxy handshake',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-22576 curl: OAUTH2 bearer bypass in connection re-use',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-27775 curl: bad local IPv6 connection reuse',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-27778 curl: removes wrong file on error',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-27780 curl: percent-encoded path separator in URL host',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-27781 curl: CERTINFO never-ending busy-loop',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-27782 curl: TLS and SSH connection too eager reuse',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-42915 curl: HTTP proxy double-free',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-42916 curl: HSTS bypass via IDN',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-43551 curl: HSTS bypass via IDN',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2023-27533 curl: TELNET option IAC injection',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2023-27534 curl: SFTP path ~ resolving discrepancy',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2023-28319 curl: use after free in SSH sha256 fingerprint check',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-38039 curl: out of heap memory issue due to missing limit on header quantity',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-27774 curl: credential leak on redirect',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-27776 curl: auth/cookie leak on redirect',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-27779 curl: cookie for trailing dot TLD',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-30115 curl: HSTS bypass via trailing dot',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-32205 curl: Set-Cookie denial of service',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-32206 curl: HTTP compression denial of service',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-32208 curl: FTP-KRB bad message verification',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2022-43552 curl: Use-after-free triggered by an HTTP proxy deny response',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-23915 curl: HSTS amnesia with --parallel',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-23916 curl: HTTP multi-header compression denial of service',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-27535 curl: FTP too eager connection reuse',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-27536 curl: GSS delegation too eager connection re-use',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-27537 curl: HSTS double-free',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-27538 curl: SSH connection too eager reuse still',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2023-28320 curl: siglongjmp race condition may lead to crash',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-28321 curl: IDN wildcard match may lead to Improper Cerificate Validation',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-46218 curl: information disclosure by exploiting a mixed case flaw',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-46219 curl: excessively long file name may lead to unknown HSTS status',
                  },
                  {
                    severity: 'low',
                    vulnerabilityDescription:
                      'CVE-2022-35252 curl: Incorrect handling of control code characters in cookies',
                  },
                  {
                    severity: 'low',
                    vulnerabilityDescription: 'CVE-2023-28322 curl: more POST-after-PUT confusion',
                  },
                  {
                    severity: 'low',
                    vulnerabilityDescription: 'CVE-2023-38546 curl: cookie injection with none file',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-4450 openssl: double free after calling PEM_read_bio_ex',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2023-0215 openssl: use-after-free following BIO_new_NDEF',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-0286 openssl: X.400 address type confusion in X.509 GeneralName',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-0464 openssl: Denial of service by excessive resource usage in verifying X509 policy constraints',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-2097 openssl: AES OCB fails to encrypt some bytes',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription: 'CVE-2022-4304 openssl: timing attack in RSA Decryption implementation',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-0465 openssl: Invalid certificate policies in leaf certificates are silently ignored',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-2650 openssl: Possible DoS translating ASN.1 object identifiers',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-3446 openssl: Excessive time spent checking DH keys and parameters',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-3817 OpenSSL: Excessive time spent checking DH q parameter value',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-5678 openssl: Generating excessively long X9.42 DH keys or checking excessively long X9.42 DH keys or parameters may be very slow',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2025-26519 musl libc 0.9.13 through 1.2.5 before 1.2.6 has an out-of-bounds write ...',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-29458 ncurses: segfaulting OOB read',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-29491 ncurses: Local users can trigger security-relevant memory corruption via malformed data',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2022-29458 ncurses: segfaulting OOB read',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-29491 ncurses: Local users can trigger security-relevant memory corruption via malformed data',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription: 'CVE-2023-35945 envoy: HTTP/2 memory leak in nghttp2 codec',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2023-44487 HTTP/2: Multiple HTTP/2 enabled web servers are vulnerable to a DDoS attack (Rapid Reset Attack)',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2023-28531 openssh: smartcard keys to ssh-agent without the intended per-hop destination constraints.',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2023-38408 openssh: Remote code execution in ssh-agent PKCS#11 support',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-48795 ssh: Prefix truncation attack on Binary Packet Protocol (BPP)',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-51384 openssh: destination constraints only apply to first PKCS#11 key',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-51385 openssh: potential command injection via shell metacharacters',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2023-28531 openssh: smartcard keys to ssh-agent without the intended per-hop destination constraints.',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2023-38408 openssh: Remote code execution in ssh-agent PKCS#11 support',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-48795 ssh: Prefix truncation attack on Binary Packet Protocol (BPP)',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-51384 openssh: destination constraints only apply to first PKCS#11 key',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-51385 openssh: potential command injection via shell metacharacters',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2023-28531 openssh: smartcard keys to ssh-agent without the intended per-hop destination constraints.',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2023-38408 openssh: Remote code execution in ssh-agent PKCS#11 support',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-48795 ssh: Prefix truncation attack on Binary Packet Protocol (BPP)',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-51384 openssh: destination constraints only apply to first PKCS#11 key',
                  },
                  {
                    severity: 'medium',
                    vulnerabilityDescription:
                      'CVE-2023-51385 openssh: potential command injection via shell metacharacters',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2022-1586 pcre2: Out-of-bounds read in compile_xclass_matchingpath in pcre2_jit_compile.c',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2022-1587 pcre2: Out-of-bounds read in get_recurse_data_length in pcre2_jit_compile.c',
                  },
                  {
                    severity: 'high',
                    vulnerabilityDescription:
                      'CVE-2022-41409 pcre2: negative repeat value in a pcre2test subject line leads to inifinite loop',
                  },
                  {
                    severity: 'critical',
                    vulnerabilityDescription:
                      'CVE-2022-37434 zlib: heap-based buffer over-read and overflow in inflate() in inflate.c via a large gzip header extra field',
                  },
                ],
                lastRunAt: '2026-02-25T15:41:06.903Z',
                deleted: false,
                deletedBy: '',
                deletedAt: '',
                createdAt: '2026-02-25T15:41:06.079Z',
                updatedAt: '2026-02-25T15:41:06.906Z',
                __v: 0,
                imageScanDetail: 'summary',
              },
            ],
          },
        ],
      },
    ],
  }

  const setFormattedDataEvent = useEffectEvent(
    (
      data: VulnerabilityResultItem[],
      criticalResultsFound: number,
      highResultsFound: number,
      mediumResultsFound: number,
      lowResultsFound: number,
    ) => {
      setFormattedData(data)
      setCriticalResults(criticalResultsFound)
      setHighResults(highResultsFound)
      setMediumResults(mediumResultsFound)
      setLowResults(lowResultsFound)
    },
  )

  useEffect(() => {
    const image = reportData.images.find((image) => image.name === (name as string))
    const resultList: VulnerabilityResultItem[] = []
    let criticalResults = 0
    let highResults = 0
    let mediumResults = 0
    let lowResults = 0
    if (image) {
      const scanResultsForTag = image.scanResults.find((scanResult) => scanResult.tag === tag)
      if (scanResultsForTag) {
        for (const result of scanResultsForTag.results) {
          for (const resultSummary of result.summary) {
            switch (resultSummary.severity) {
              case 'critical':
                criticalResults++
                break
              case 'high':
                highResults++
                break
              case 'medium':
                mediumResults++
                break
              case 'low':
                lowResults++
                break
            }
            const cve = resultSummary.vulnerabilityDescription.split(' ')[0]
            resultList.push({
              cve: cve,
              description: resultSummary.vulnerabilityDescription.replace(cve, '').toUpperCase(),
              severity: resultSummary.severity,
              toolName: result.toolName,
              lastRanAt: result.lastRunAt,
            })
          }
        }
      }
    }
    setFormattedDataEvent(resultList, criticalResults, highResults, mediumResults, lowResults)
  }, [name, tag])

  const tableRows = useCallback(() => {
    return formattedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
      <TableRow key={row.cve} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          {row.cve}
        </TableCell>
        <TableCell>{row.severity.toUpperCase()}</TableCell>
        <TableCell>{row.description}</TableCell>
        <TableCell>{row.lastRanAt}</TableCell>
      </TableRow>
    ))
  }, [formattedData, page, rowsPerPage])

  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (isModelImagesError) {
    return <MessageAlert message={isModelImagesError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isModelImagesLoading || isUiConfigLoading || !modelImage) {
    return <Loading />
  }
  console.log(formattedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage))

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
                <Typography fontWeight='bold'>Size</Typography>
                <Typography>1 GB</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Date added</Typography>
                <Typography>10/10/2010</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Vulnerabilities</Typography>
                <VulnerabilityResult
                  criticalResults={criticalResults}
                  highResults={highResults}
                  mediumResults={mediumResults}
                  lowResults={lowResults}
                />
              </Stack>
            </Stack>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
                <Typography fontWeight='bold'>Vulnerability report ({formattedData.length} found)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>CVE name</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Last ran at</TableCell>
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
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Paper>
      </Container>
    </>
  )
}
