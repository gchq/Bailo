import { createContext } from 'react'
import { type ScanInfoInterface } from 'types/types'

const ArtefactScanningInfoContext = createContext<ScanInfoInterface[]>([])

export default ArtefactScanningInfoContext
